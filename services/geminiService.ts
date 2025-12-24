
import { GoogleGenAI, Type } from "@google/genai";
import { EXPERT_INSTRUCTION, REGULAR_INSTRUCTION, JOURNAL_INSTRUCTION, PYTHON_INSTRUCTION } from "../constants";
import { GroundingSource, ChatResponse, SearchMode, AISettings, AspectRatio, ImageStyle } from "../types";

// In-memory cache for deep visual research results
const VISUAL_CACHE = new Map<string, { imageUrl: string, insight: string, semanticTags: string[] }>();

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
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) return null;
  jsonCandidate = jsonCandidate.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonCandidate);
  } catch (e) {
    try {
      let cleaned = jsonCandidate.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      return JSON.parse(cleaned);
    } catch (innerError) {
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
        if (!sources.some(s => s.uri === chunk.web.uri)) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      }
    });
  }
  const parsedData = robustParseJson(rawText);
  let contentText = parsedData?.text || rawText;
  let suggestions = parsedData?.suggestions || ["Lanjutkan riset", "Tanya pakar", "Kembali ke menu"];
  return { text: contentText, suggestions, groundingSources: sources.length > 0 ? sources : undefined };
};

export const getSmartSearchSuggestions = async (query: string, mode: SearchMode): Promise<string[]> => {
  if (!query || query.length < 4) return [];
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Berikan 3 saran kueri pencarian riset pertanian yang lebih spesifik untuk mode "${mode}" berdasarkan input awal ini: "${query}". 
      Saran harus membantu peneliti menemukan dokumen teknis.
      RETURN ONLY A JSON ARRAY OF STRINGS.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    return robustParseJson(response.text) || [];
  } catch (error) {
    console.error("Suggestion engine error:", error);
    return [];
  }
};

/**
 * Suggests keywords to expand a visual prompt based on agricultural context.
 */
export const getAgriculturalPromptSuggestions = async (query: string): Promise<string[]> => {
  if (!query || query.length < 3) return ["Analisis Tanah", "Hidroponik Modern", "Hama Tanaman", "Pertanian Presisi", "Smart Greenhouse"];
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Berdasarkan kueri riset visual pertanian: "${query}", berikan 5 kata kunci teknis atau frasa singkat dalam Bahasa Indonesia yang bisa ditambahkan untuk memperdalam prompt visual ini. 
      Contoh: "Mikroskopis Akar", "Varietas Unggul", "Sensor IoT".
      RETURN ONLY A JSON ARRAY OF STRINGS.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return robustParseJson(response.text) || [];
  } catch {
    return [];
  }
};

export const getSemanticIntent = async (query: string): Promise<string[]> => {
  if (!query || query.length < 6) return [];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Ekstrak 3 kata kunci teknis pertanian yang menjadi fokus dari kueri ini: "${query}". 
      Format: JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return robustParseJson(response.text) || [];
  } catch {
    return [];
  }
};

/**
 * High-quality image generation using Imagen 4.
 */
export const generateImagen = async (prompt: string, style: ImageStyle, ratio: AspectRatio): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const stylePrompts: Record<ImageStyle, string> = {
    photorealistic: "cinematic high-resolution photography, 8k, extremely detailed, natural lighting",
    scientific_diagram: "clean scientific diagram, annotated, minimalist agricultural tech design, white background",
    digital_art: "modern digital art style, vibrant agricultural futurism, neon accents",
    botanical_illustration: "detailed botanical hand-drawn illustration, watercolor and ink on aged paper",
    vintage_plate: "19th-century scientific lithograph plate, vintage agricultural publication aesthetic",
    satellite: "high-resolution satellite multispectral imagery, top-down farm mapping view"
  };

  const finalPrompt = `${prompt}. Style: ${stylePrompts[style]}. Professional agricultural research output.`;

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: finalPrompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: ratio,
    },
  });

  const base64Data = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64Data}`;
};

export const generateDeepVisual = async (prompt: string, onUpdate?: (step: string) => void): Promise<{ imageUrl: string, insight: string, semanticTags: string[] }> => {
  const normalizedPrompt = prompt.trim().toLowerCase();
  
  if (VISUAL_CACHE.has(normalizedPrompt)) {
    onUpdate?.("Mengambil hasil dari cache riset...");
    return VISUAL_CACHE.get(normalizedPrompt)!;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  onUpdate?.("Melakukan Ekspansi Semantik & Pemetaan Konteks...");
  const researchResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: `Analisis kueri ini secara semantik: "${prompt}". 
    Identifikasi intensi riset, konsep terkait, dan data pendukung yang relevan di bidang pertanian.
    
    WAJIB FORMAT JSON:
    {
      "visual_prompt": "Technical English prompt for image generation, including lighting, style, and semantic accuracy",
      "insight_summary": "Ringkasan analisis riset mendalam dalam Bahasa Indonesia",
      "semantic_tags": ["list", "of", "4", "related", "semantic", "keywords"]
    }`,
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }]
    }
  });

  const researchData = robustParseJson(researchResponse.text);
  const visualPrompt = researchData?.visual_prompt || prompt;
  const insight = researchData?.insight_summary || "Analisis semantik mendalam terhadap kueri riset.";
  const semanticTags = researchData?.semantic_tags || ["Pertanian", "Riset", "Data", "Analisis"];

  onUpdate?.("Menyusun Representasi Visual Berbasis Konteks...");
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { 
      parts: [{ 
        text: `Advanced semantic visualization for agricultural research: ${visualPrompt}. Professional, photorealistic or highly technical clean diagram, 8k, laboratory lighting, agricultural tech aesthetic.` 
      }] 
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    }
  });

  for (const part of imageResponse.candidates[0].content.parts) {
    if (part.inlineData) {
      const result = {
        imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        insight: insight,
        semanticTags: semanticTags
      };
      VISUAL_CACHE.set(normalizedPrompt, result);
      return result;
    }
  }
  
  throw new Error("Gagal merender visualisasi semantik.");
};

export const generateImage = async (prompt: string): Promise<string> => {
  const result = await generateDeepVisual(prompt);
  return result.imageUrl;
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
      model: "gemini-3-pro-preview",
      contents: [...history, { role: "user", parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: instruction + "\n\nCRITICAL: If relevant documents exist, prioritize them in the response and mention their titles. Return only valid JSON.",
        temperature,
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
      text: "Sistem mengalami gangguan teknis saat melakukan riset dokumen.",
      suggestions: ["Coba kueri lain", "Hubungi Pustakawan"]
    };
  }
};
