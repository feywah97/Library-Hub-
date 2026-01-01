
export type Role = 'user' | 'assistant';
export type SearchMode = 'regular' | 'expert' | 'journal' | 'gradio' | 'voice' | 'python' | 'visualizer' | 'metrics' | 'weather' | 'sni';

export type AspectRatio = '1:1' | '16:9' | '4:3' | '9:16' | '3:4';
export type ImageStyle = 'photorealistic' | 'scientific_diagram' | 'digital_art' | 'botanical_illustration' | 'vintage_plate' | 'satellite';
export type AIModel = 'imagen_4' | 'gemini_vision';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatResponse {
  text: string;
  suggestions: string[];
  groundingSources?: GroundingSource[];
  imageUrl?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  mode?: SearchMode;
  suggestions?: string[];
  groundingSources?: GroundingSource[];
  imageUrl?: string;
}

export interface AISettings {
  temperature: number;
  thinkingBudget: number;
  topP: number;
}

export interface Patron {
  id: string;
  nama: string;
  email: string;
  noIdentitas: string;
  instansi: string;
  kategori: 'Umum' | 'Mahasiswa' | 'Peneliti' | 'Petani';
  tanggalDaftar: string;
  role: 'user' | 'admin';
}

export interface SearchFilters {
  penulis: string;
  tahun: string;
  topik: string;
}

export interface MonthlyLending {
  month: string;
  pertanian: number;
  hortikultura: number;
}

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface DeploymentStatus {
  isLive: boolean;
  version: string;
  uptime: string;
}

export interface VisualResult {
  url: string;
  prompt: string;
  insight: string;
  timestamp: Date;
  semanticTags: string[];
  style?: ImageStyle;
  ratio?: AspectRatio;
  model?: AIModel;
  isUpscaled?: boolean;
  isAnalysis?: boolean;
  rating?: 'up' | 'down' | null;
}

export type NotificationType = 'system' | 'announcement' | 'update';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface AgriMetrics {
  weather: {
    temp: number;
    humidity: number;
    condition: string;
    windSpeed: number;
    windDirection: string;
    pressure: number;
    uvIndex: number;
    visibility: number;
    sunrise: string;
    sunset: string;
    cloudCover: number;
    precipProb: number;
  };
  soil: {
    moisture: number;
    ph: number;
    nitrogen: number;
    temp: number;
  };
  market: {
    padi: number;
    cabai: number;
    tomat: number;
  };
}
