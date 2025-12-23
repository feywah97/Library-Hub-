
export type Role = 'user' | 'assistant';
export type SearchMode = 'regular' | 'expert' | 'journal';

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

export interface LibraryCategory {
  name: string;
  icon: string;
  description: string;
}

export interface FAQEntry {
  id: number;
  kategori: string;
  user_query: string;
  chatbot_response: string;
  penulis?: string;
  tahun?: number;
  topik?: string[];
}

export interface SearchFilters {
  penulis: string;
  tahun: string;
  topik: string;
}

export interface Patron {
  id: string;
  nama: string;
  email: string;
  noIdentitas: string;
  instansi: string;
  kategori: 'Peneliti' | 'Mahasiswa' | 'Petani' | 'Umum';
  tanggalDaftar: string;
}

export interface MonthlyLending {
  month: string;
  pertanian: number;
  hortikultura: number;
}
