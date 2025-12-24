
export type Role = 'user' | 'assistant';
export type SearchMode = 'regular' | 'expert' | 'journal' | 'gradio' | 'voice' | 'python' | 'visualizer';

export type AspectRatio = '1:1' | '16:9' | '4:3' | '9:16' | '3:4';
export type ImageStyle = 'photorealistic' | 'scientific_diagram' | 'digital_art' | 'botanical_illustration' | 'vintage_plate' | 'satellite';

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
}
