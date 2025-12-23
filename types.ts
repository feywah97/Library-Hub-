
export type Role = 'user' | 'assistant';
export type SearchMode = 'regular' | 'expert' | 'journal' | 'gradio' | 'voice';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatResponse {
  text: string;
  suggestions: string[];
  groundingSources?: GroundingSource[];
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  mode?: SearchMode;
  suggestions?: string[];
  groundingSources?: GroundingSource[];
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
