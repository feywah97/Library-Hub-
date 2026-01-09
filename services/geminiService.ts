
import { GoogleGenAI, Type } from "@google/genai";
import { EXPERT_INSTRUCTION, REGULAR_INSTRUCTION, JOURNAL_INSTRUCTION, PYTHON_INSTRUCTION, SNI_INSTRUCTION } from "../constants";
import { GroundingSource, ChatResponse, SearchMode, AISettings, AspectRatio, ImageStyle, AIModel, AgriMetrics } from "../types";

// Cache to store suggestion results and prevent redundant API calls
const SUGGESTION_CACHE = new Map<string, string[]>();

// Helper to safely get the API key from the environment
const getSafeApiKey = (): string => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

// Utility to sleep for a specified duration
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utility to call an AI function with exponential backoff and 429 error handling
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error);
    const isQuotaError = errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("429");
    
    if (isQuotaError && retries > 0) {
      console.warn(`Quota exceeded. Retrying in ${delay}ms... (${retries} attempts left)`);
      await sleep(delay);
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

const VISUAL_CACHE = new Map<string, { imageUrls: string[], insight: string, semanticTags: string[] }>();

const STYLE_DESCRIPTIONS: Record<ImageStyle, string> = {
  photorealistic: "cinematic high-resolution photography, 8k, extremely detailed, natural lighting, sharp focus",
  scientific_diagram: "clean scientific diagram, technical annotations, minimalist agricultural engineering design, white background, high clarity",
  digital_art: "modern digital art style, vibrant agricultural futurism, 3D render aesthetic, neon accents",
  botanical_illustration: "detailed botanical hand-drawn illustration, watercolor and ink on aged paper, historical scientific accuracy",
  vintage_plate: "19th-century scientific lithograph plate, vintage agricultural publication aesthetic, cross-hatching detail",
  satellite: "high-resolution satellite multispectral imagery, top-down farm mapping view, geographical data visualization"
};

const robustParseJson = (rawText: string): any => {
  if (!rawText || typeof rawText !== 'string') return null;
  let jsonCandidate = rawText.trim();
  if (jsonCandidate.includes('```')) {
    const match = jsonCandidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) jsonCandidate = match[1].trim();
    else jsonCandidate = jsonCandidate.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  }
  const firstBrace = jsonCandidate.indexOf('{');
  const lastBrace = jsonCandidate.lastIndexOf('}');
  const firstBracket = jsonCandidate.indexOf('[');
  const lastBracket = jsonCandidate.lastIndexOf(']');
  let finalCandidate = '';
  if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    finalCandidate = jsonCandidate.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    finalCandidate = jsonCandidate.substring(firstBracket, lastBracket + 1);
  } else return null;
  try {
    return JSON.parse(finalCandidate);
  } catch (e) {
    try {
      const sanitized = finalCandidate.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
      return JSON.parse(sanitized);
    } catch (innerError) { return null; }
  }
};

const parseGeminiResponse = (response: any): ChatResponse => {
  let rawText = "";
  try { rawText = response.text || ""; } catch (e) {
    rawText = response.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || "Respons diblokir oleh filter keamanan AI.";
  }
  const sources: GroundingSource[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri && chunk.web.title) {
        if (!sources.some(s => s.uri === chunk.web.uri)) sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      } else if (chunk.maps && chunk.maps.uri) sources.push({ title: "Google Maps Location", uri: chunk.maps.uri });
    });
  }
  const parsedData = robustParseJson(rawText);
  return { text: parsedData?.text || rawText, suggestions: parsedData?.suggestions || ["Lanjutkan riset", "Tanya pakar"], groundingSources: sources.length > 0 ? sources : undefined };
};

export const getSmartSearchSuggestions = async (query: string, mode: SearchMode): Promise<string[]> => {
  const cacheKey = `smart_${mode}_${query.trim().toLowerCase()}`;
  if (SUGGESTION_CACHE.has(cacheKey)) return SUGGESTION_CACHE.get(cacheKey)!;
  if (!query || query.length < 4) return [];
  
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  try {
    const results = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Berikan 3 saran kueri pencarian riset pertanian yang lebih spesifik untuk mode "${mode}" berdasarkan input awal ini: "${query}". Saran harus membantu peneliti menemukan dokumen teknis. RETURN ONLY A JSON ARRAY OF STRINGS.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      return robustParseJson(response.text || "[]") || [];
    });
    SUGGESTION_CACHE.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error("Suggestion engine quota error:", error);
    return ["Riset Hidroponik Lanjut", "Dampak Perubahan Iklim Pertanian", "Otomasi Greenhouse IoT"];
  }
};

export const getAgriculturalPromptSuggestions = async (query: string, isSemantic: boolean = false): Promise<string[]> => {
  const cacheKey = `agri_${isSemantic ? 'sem_' : ''}${query.trim().toLowerCase()}`;
  if (SUGGESTION_CACHE.has(cacheKey)) return SUGGESTION_CACHE.get(cacheKey)!;

  const fallbacks = isSemantic ? [
    "Mikroskopis Elektron", "Kromatografi Cair", "Analisis Spektroskopi", "Genomik Tanaman",
    "Fisiologi Stres", "Mikrobioma Tanah", "Nanoteknologi Pupuk", "Isolasi Patogen"
  ] : [
    "Struktur Tanah Mikroskopis", "Sistem Hidroponik NFT", "Irigasi Tetes Otomatis",
    "Hama Wereng Cokelat", "Varietas Unggul Hortikultura", "Smart Greenhouse IoT",
    "Analisis Unsur Hara NPK", "Mekanisasi Pertanian Modern"
  ];
  
  if (!query || query.trim().length < 2) return fallbacks;
  
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  try {
    const results = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User sedang membangun prompt untuk visualisasi riset pertanian ${isSemantic ? '(fokus pada detail teknis/ilmiah)' : ''} dengan kueri awal: "${query}". 
        Berikan 8 kata kunci teknis atau frasa singkat (max 3 kata) yang SANGAT SPESIFIK dan RELEVAN untuk memperdalam aspek visual, teknis, atau ilmiah dari topik tersebut. 
        ${isSemantic ? 'Prioritaskan terminologi laboratorium, biologi molekuler, atau teknik tingkat lanjut.' : 'Prioritaskan aspek praktis lapangan dan visualisasi modern.'}
        Gunakan Bahasa Indonesia formal. RETURN ONLY A JSON ARRAY OF STRINGS.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      return robustParseJson(response.text || "[]") || fallbacks;
    });
    SUGGESTION_CACHE.set(cacheKey, results);
    return results;
  } catch {
    return fallbacks;
  }
};

export const getSemanticIntent = async (query: string): Promise<string[]> => {
  if (!query || query.length < 6) return [];
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Ekstrak 3 kata kunci teknis pertanian yang menjadi fokus dari kueri ini: "${query}". Format: JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return robustParseJson(response.text || "[]") || [];
  } catch { return []; }
};

export const chatWithGemini = async (
  userMessage: string, 
  history: { role: string; parts: { text: string }[] }[],
  mode: SearchMode = 'expert',
  customSettings?: AISettings
): Promise<ChatResponse> => {
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  let instruction = EXPERT_INSTRUCTION;
  let thinkingBudget = 0;
  if (mode === 'expert') { thinkingBudget = 24000; }
  else if (mode === 'journal') { instruction = JOURNAL_INSTRUCTION; thinkingBudget = 20000; }
  else if (mode === 'python') { instruction = PYTHON_INSTRUCTION; thinkingBudget = 32000; }
  else if (mode === 'sni') { instruction = SNI_INSTRUCTION; thinkingBudget = 32000; }
  else if (mode === 'gradio' && customSettings) { instruction = EXPERT_INSTRUCTION; thinkingBudget = customSettings.thinkingBudget; }

  try {
    const response = await callWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [...history, { role: "user", parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: instruction + "\n\nCRITICAL: Return only valid JSON.",
          temperature: customSettings?.temperature || 0.3,
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
    });
    return parseGeminiResponse(response);
  } catch (error: any) {
    const errorStr = JSON.stringify(error);
    if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
      return { text: "⚠️ **Batas Quota Tercapai.** Model AI sedang sibuk memproses banyak permintaan. Mohon tunggu 30-60 detik sebelum mencoba lagi.", suggestions: ["Coba Lagi", "Tunggu Sebentar"] };
    }
    return { text: "Terjadi gangguan teknis pada server AI. Mohon periksa koneksi Anda.", suggestions: ["Coba lagi"] };
  }
};

export const getMapsGroundedWeather = async (lat: number, lng: number): Promise<ChatResponse> => {
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Sebagai Pakar Agroklimatologi BBPP Lembang, berikan briefing teknis presisi untuk koordinat: ${lat}, ${lng}.
    Gunakan Google Maps & Search Grounding untuk data real-time:
    1. GEOGRAFI TEKNIS: Identifikasi Nama Desa/Kecamatan, estimasi ketinggian (mdpl), dan pengaruh topografi lokal (misal: bayangan hujan, lembah, lereng) terhadap suhu udara.
    2. DINAMIKA ATMOSFER: Analisis tekanan udara (hPa), kelembapan spesifik, dan potensi anomali angin lokal yang mungkin terjadi hari ini.
    3. DIAGNOSIS AGRIKULTUR: Bagaimana kombinasi suhu dan kelembapan saat ini berdampak pada risiko penyakit jamur (fungi) atau serangan hama spesifik komoditas unggulan di wilayah ini?
    4. PROTOKOL BUDIDAYA: Berikan 3 instruksi operasional yang SANGAT SPESIFIK (misal: rekomendasi pengairan presisi, waktu aplikasi pestisida hayati, atau perlindungan naungan) berdasarkan cuaca hari ini.
    Gunakan Markdown untuk format yang rapi dan Bahasa Indonesia profesional yang aplikatif.`,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
    }
  });
  return parseGeminiResponse(response);
};

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<{ insight: string, suggestions: string[] }> => {
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: `Sebagai pakar agronomi senior di BBPP Lembang, lakukan analisis visual mendalam pada citra pertanian ini. Diagnosis kesehatan, deteksi hama, dan berikan rekomendasi teknis. WAJIB OUTPUT JSON {text: string, suggestions: string[]}` }
        ]
      }
    });
    const data = robustParseJson(response.text || "{}");
    return {
      insight: data?.text || "Analisis citra selesai.",
      suggestions: data?.suggestions || ["Observasi Lanjutan"]
    };
  } catch (error) { throw error; }
};

export const generateDeepVisual = async (prompt: string, style: ImageStyle, ratio: AspectRatio = "16:9", count: number = 1, onUpdate?: (step: string) => void): Promise<{ imageUrls: string[], insight: string, semanticTags: string[] }> => {
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  onUpdate?.("Merender Gambar...");
  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i > 0) await sleep(2000);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Professional agricultural research visualization: ${prompt}. Style: ${STYLE_DESCRIPTIONS[style]}.` }] },
      config: { imageConfig: { aspectRatio: ratio } }
    });
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          urls.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          break;
        }
      }
    }
  }
  return { imageUrls: urls, insight: "Visualisasi riset selesai.", semanticTags: ["Visual", "Research"] };
};

export const generateImagen = async (prompt: string, style: ImageStyle, ratio: AspectRatio, count: number = 1): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `${prompt}. Style: ${STYLE_DESCRIPTIONS[style]}. Professional agricultural research output.`,
    config: { numberOfImages: count, outputMimeType: 'image/jpeg', aspectRatio: ratio }
  });
  return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
};

export const editImageAgricultural = async (base64Data: string, mimeType: string, prompt: string, style: ImageStyle, count: number = 1): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i > 0) await sleep(2000);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: `Modify this agricultural image: ${prompt}. Style: ${STYLE_DESCRIPTIONS[style]}.` }] }
    });
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          urls.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          break;
        }
      }
    }
  }
  return urls;
};

export const upscaleImage = async (base64DataUrl: string, prompt: string, style: ImageStyle): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  const [, data] = base64DataUrl.split(',');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ inlineData: { data, mimeType: 'image/png' } }, { text: `Upscale to 4K: ${prompt}` }] },
    config: { imageConfig: { imageSize: "4K" } }
  });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("Upscale failed");
};

export const getAgriInsight = async (metrics: AgriMetrics): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Berikan ringkasan analisis singkat (max 3 kalimat) untuk kondisi pertanian saat ini berdasarkan metrik: Cuaca: ${metrics.weather.temp}°C, Kelembapan ${metrics.soil.moisture}%.`,
    });
    return response.text || "Insight tidak tersedia.";
  } catch { return "Error loading analysis."; }
};

export const getWeatherAgriculturalAdvice = async (location: string, weatherData: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Berikan briefing agronomi presisi untuk lokasi ${location} dengan data cuaca: Suhu ${weatherData.temp}°C, Kondisi ${weatherData.condition}. 
      Fokus pada dampak langsung terhadap tanaman hortikultura utama di daerah tersebut. 
      Sertakan variabel teknis seperti waktu kritis penyiraman, potensi stres biotik tanaman, dan saran pemupukan efisien hari ini.`,
    });
    return response.text || "Saran tidak tersedia.";
  } catch { return "Error loading weather advice."; }
};
