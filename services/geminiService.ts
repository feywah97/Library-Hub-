
import { GoogleGenAI, Type } from "@google/genai";
import { EXPERT_INSTRUCTION, REGULAR_INSTRUCTION, JOURNAL_INSTRUCTION } from "../constants";
import { GroundingSource, ChatResponse, SearchMode } from "../types";

const extractJson = (text: string): any => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const cleanJson = jsonMatch[0]
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") 
      .trim();
      
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to extract JSON from response:", e);
    return null;
  }
};

const parseGeminiResponse = (response: any): ChatResponse => {
  const rawText = response.text || "";
  const sources: GroundingSource[] = [];
  
  // 1. Extract from Metadata
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

  const parsedData = extractJson(rawText);
  const contentText = parsedData?.text || rawText;

  // 2. Fallback: Manual Extraction for Priority Domains (Bug Fix)
  // Ensure that if these domains are mentioned in text, they show up in grounding sources
  const priorityDomains = ['repository.pertanian.go.id', 'epublikasi.pertanian.go.id', 'scholar.google.com'];
  const urlRegex = /(https?:\/\/[^\s,)]+)/gi;
  const foundUrls = contentText.match(urlRegex) || [];
  
  foundUrls.forEach((url: string) => {
    const isPriority = priorityDomains.some(domain => url.includes(domain));
    const alreadyExists = sources.some(s => s.uri === url);
    
    if (isPriority && !alreadyExists) {
      sources.push({
        title: url.includes('repository') ? "Koleksi Repositori Pertanian" : 
               url.includes('epublikasi') ? "Publikasi Digital Pertanian" : "Google Scholar Reference",
        uri: url
      });
    }
  });

  if (parsedData) {
    return {
      text: contentText,
      suggestions: Array.isArray(parsedData.suggestions) ? parsedData.suggestions : [],
      groundingSources: sources.length > 0 ? sources : undefined
    };
  }

  return {
    text: contentText.length > 50 ? contentText : "Sistem sedang mengoptimalkan kueri. Mohon tunggu.",
    suggestions: ["Cari di Repositori", "Tanya Pustakawan"],
    groundingSources: sources.length > 0 ? sources : undefined
  };
};

export const chatWithGemini = async (
  userMessage: string, 
  history: { role: string; parts: { text: string }[] }[],
  mode: SearchMode = 'expert'
): Promise<ChatResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let instruction = REGULAR_INSTRUCTION;
  let thinkingBudget = 0;

  if (mode === 'expert') {
    instruction = EXPERT_INSTRUCTION;
    thinkingBudget = 24000;
  } else if (mode === 'journal') {
    instruction = JOURNAL_INSTRUCTION;
    thinkingBudget = 20000;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: instruction + "\n\nAnda harus selalu memberikan jawaban dalam format JSON yang valid.",
        temperature: mode === 'regular' ? 0.7 : 0.1,
        thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { 
              type: Type.STRING,
              description: "Konten utama jawaban riset."
            },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Saran eksplorasi literatur."
            }
          },
          required: ["text", "suggestions"]
        }
      },
    });

    return parseGeminiResponse(response);
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "Terjadi gangguan pada modul grounding data. Mohon ulangi kembali kueri Anda.",
      suggestions: ["Coba kueri lain"]
    };
  }
};
