
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

  if (parsedData) {
    return {
      text: parsedData.text || "Maaf, hasil analisis tidak dapat diformat.",
      suggestions: Array.isArray(parsedData.suggestions) ? parsedData.suggestions : [],
      groundingSources: sources.length > 0 ? sources : undefined
    };
  }

  return {
    text: rawText.length > 50 ? rawText : "Maaf, sistem mengalami kendala teknis dalam mode ini.",
    suggestions: ["Ulangi Pencarian", "Buka Google Scholar"],
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
    thinkingBudget = 32768;
  } else if (mode === 'journal') {
    instruction = JOURNAL_INSTRUCTION;
    thinkingBudget = 24576; // Deep research for journals
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: instruction + "\n\nCRITICAL: Respond ONLY in valid JSON format.",
        temperature: mode === 'regular' ? 0.7 : 0.2,
        thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { 
              type: Type.STRING,
              description: "Konten utama jawaban."
            },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Saran eksplorasi."
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
      text: "Terjadi gangguan pada modul pencarian digital. Mohon coba lagi beberapa saat lagi.",
      suggestions: ["Coba kueri lain"]
    };
  }
};
