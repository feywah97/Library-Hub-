
import { GoogleGenAI, Type } from "@google/genai";
import { EXPERT_INSTRUCTION, REGULAR_INSTRUCTION, JOURNAL_INSTRUCTION, PYTHON_INSTRUCTION } from "../constants";
import { GroundingSource, ChatResponse, SearchMode, AISettings } from "../types";

/**
 * Robust JSON extraction and parsing.
 */
const robustParseJson = (rawText: string): any => {
  if (!rawText || typeof rawText !== 'string') return null;

  let jsonCandidate = rawText.trim();

  if (jsonCandidate.includes('```')) {
    const match = jsonCandidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      jsonCandidate = match[1].trim();
    } else {
      jsonCandidate = jsonCandidate.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    }
  }

  const firstBrace = jsonCandidate.indexOf('{');
  const lastBrace = jsonCandidate.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return null;
  }
  
  jsonCandidate = jsonCandidate.substring(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonCandidate);
  } catch (e) {
    try {
      let cleaned = jsonCandidate
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
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

  const parsedData = robustParseJson(rawText);
  
  let contentText = "";
  let suggestions: string[] = ["Lanjutkan riset", "Tanya pakar", "Kembali ke menu"];

  if (parsedData) {
    contentText = parsedData.text || rawText;
    if (Array.isArray(parsedData.suggestions)) {
      suggestions = parsedData.suggestions;
    }
  } else {
    contentText = rawText;
  }

  const priorityDomains = ['repository.pertanian.go.id', 'epublikasi.pertanian.go.id', 'scholar.google.com'];
  const urlRegex = /(https?:\/\/[^\s,;<>\])]+)/gi;
  const foundUrls = contentText.match(urlRegex) || [];
  
  foundUrls.forEach((url: string) => {
    const cleanUrl = url.replace(/[.]$/, "");
    const isPriority = priorityDomains.some(domain => cleanUrl.includes(domain));
    const alreadyExists = sources.some(s => s.uri === cleanUrl);
    
    if (isPriority && !alreadyExists) {
      let title = "Referensi Riset";
      if (cleanUrl.includes('repository.pertanian.go.id')) title = "Repositori Kementan";
      else if (cleanUrl.includes('epublikasi.pertanian.go.id')) title = "e-Publikasi Pertanian";
      else if (cleanUrl.includes('scholar.google.com')) title = "Google Scholar";

      sources.push({ title: title, uri: cleanUrl });
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
  } else if (mode === 'python') {
    instruction = PYTHON_INSTRUCTION;
    thinkingBudget = 32000;
    temperature = 0.4;
  } else if (mode === 'gradio' && customSettings) {
    instruction = EXPERT_INSTRUCTION;
    thinkingBudget = customSettings.thinkingBudget;
    temperature = customSettings.temperature;
  }

  try {
    const response = await ai.models.generateContent({
      model: mode === 'python' ? "gemini-3-pro-preview" : "gemini-3-pro-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: instruction + "\n\nCRITICAL RULE: Return strictly valid JSON. Ensure code blocks in Markdown are escaped correctly.",
        temperature: temperature,
        thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined,
        responseMimeType: "application/json",
        tools: mode === 'python' ? [] : [{ googleSearch: {} }],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["text", "suggestions"]
        }
      },
    });

    return parseGeminiResponse(response);
    
  } catch (error) {
    console.error("Gemini critical failure:", error);
    return {
      text: "Maaf, sistem mengalami gangguan teknis. Silakan coba kueri yang lebih sederhana.",
      suggestions: ["Coba kueri lain", "Hubungi Pustakawan"]
    };
  }
};
