
import { GoogleGenAI, Type } from "@google/genai";
import { EXPERT_INSTRUCTION, REGULAR_INSTRUCTION, JOURNAL_INSTRUCTION } from "../constants";
import { GroundingSource, ChatResponse, SearchMode, AISettings } from "../types";

/**
 * Robust JSON extraction and parsing.
 * Handles markdown blocks, unescaped characters, and truncated responses.
 */
const robustParseJson = (rawText: string): any => {
  if (!rawText || typeof rawText !== 'string') return null;

  let jsonCandidate = rawText.trim();

  // 1. Remove Markdown code blocks if present
  if (jsonCandidate.includes('```')) {
    const match = jsonCandidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      jsonCandidate = match[1].trim();
    } else {
      // Fallback: remove any triple backticks
      jsonCandidate = jsonCandidate.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    }
  }

  // 2. Locate the first { and last }
  const firstBrace = jsonCandidate.indexOf('{');
  const lastBrace = jsonCandidate.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return null;
  }
  
  jsonCandidate = jsonCandidate.substring(firstBrace, lastBrace + 1);

  // 3. Try standard parse first
  try {
    return JSON.parse(jsonCandidate);
  } catch (e) {
    // 4. If fails, perform aggressive cleanup of control characters and common issues
    try {
      let cleaned = jsonCandidate
        // Remove unescaped control characters (ASCII 0-31) except those that might be part of an escape sequence
        // Actually, JSON.parse strictly forbids real newlines in strings. 
        // We replace real newlines with \n string literals to attempt a fix.
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      
      // Fix potential "Unterminated string" by ensuring we don't have literal quotes inside strings that aren't escaped
      // This is risky but often necessary for LLM outputs.
      
      return JSON.parse(cleaned);
    } catch (innerError) {
      console.error("Aggregation of JSON parsing attempts failed:", innerError);
      return null;
    }
  }
};

const parseGeminiResponse = (response: any): ChatResponse => {
  const rawText = response.text || "";
  const sources: GroundingSource[] = [];
  
  // 1. Extract Grounding Metadata from Native Search Tool
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri && chunk.web.title) {
        sources.push({
          title: chunk.web.title,
          uri: chunk.web.uri
        });
      }
    });
  }

  // 2. Parse the text part as JSON
  const parsedData = robustParseJson(rawText);
  
  // Fallback if JSON fails: Extract what we can or use raw text
  let contentText = "";
  let suggestions: string[] = ["Lanjutkan riset", "Tanya pakar", "Kembali ke menu"];

  if (parsedData) {
    contentText = parsedData.text || rawText;
    if (Array.isArray(parsedData.suggestions)) {
      suggestions = parsedData.suggestions;
    }
  } else {
    // If it's not JSON, it might just be raw text
    contentText = rawText;
  }

  // 3. Manual Extraction for BBPP Lembang Priority Domains
  const priorityDomains = ['repository.pertanian.go.id', 'epublikasi.pertanian.go.id', 'scholar.google.com'];
  const urlRegex = /(https?:\/\/[^\s,;<>\])]+)/gi;
  const foundUrls = contentText.match(urlRegex) || [];
  
  foundUrls.forEach((url: string) => {
    const cleanUrl = url.replace(/[.]$/, "");
    const isPriority = priorityDomains.some(domain => cleanUrl.includes(domain));
    const alreadyExists = sources.some(s => s.uri === cleanUrl);
    
    if (isPriority && !alreadyExists) {
      let title = "Referensi Riset";
      if (cleanUrl.includes('repository.pertanian.go.id')) {
        title = "Repositori Kementan";
      } else if (cleanUrl.includes('epublikasi.pertanian.go.id')) {
        title = "e-Publikasi Pertanian";
      } else if (cleanUrl.includes('scholar.google.com')) {
        title = "Google Scholar";
      }

      sources.push({
        title: title,
        uri: cleanUrl
      });
    }
  });

  return {
    text: contentText,
    suggestions: suggestions,
    groundingSources: sources.length > 0 ? sources : undefined
  };
};

export const chatWithGemini = async (
  userMessage: string, 
  history: { role: string; parts: { text: string }[] }[],
  mode: SearchMode = 'expert',
  customSettings?: AISettings
): Promise<ChatResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let instruction = REGULAR_INSTRUCTION;
  let thinkingBudget = 0;
  let temperature = 0.7;

  if (mode === 'expert') {
    instruction = EXPERT_INSTRUCTION;
    thinkingBudget = 24000;
    temperature = 0.2;
  } else if (mode === 'journal') {
    instruction = JOURNAL_INSTRUCTION;
    thinkingBudget = 20000;
    temperature = 0.3;
  } else if (mode === 'gradio' && customSettings) {
    instruction = EXPERT_INSTRUCTION;
    thinkingBudget = customSettings.thinkingBudget;
    temperature = customSettings.temperature;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: instruction + "\n\nCRITICAL RULE: Return strictly valid JSON. Do not include unescaped newlines within string values; use '\\n' instead. Ensure all quotes inside strings are escaped if they are not the string boundaries.",
        temperature: temperature,
        thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { 
              type: Type.STRING,
              description: "Main assistant response in Markdown format."
            },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Three follow-up suggestions."
            }
          },
          required: ["text", "suggestions"]
        }
      },
    });

    return parseGeminiResponse(response);
    
  } catch (error) {
    console.error("Gemini critical failure:", error);
    return {
      text: "Maaf, sistem mengalami gangguan teknis dalam memproses data. Silakan coba kueri yang lebih sederhana atau hubungi administrator.",
      suggestions: ["Coba kueri lain", "Hubungi Pustakawan"]
    };
  }
};
