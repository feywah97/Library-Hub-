
import { Patron } from '../types';

const STORAGE_KEY = 'agripustaka_patrons';
const SESSION_KEY = 'agripustaka_current_user';

export const patronService = {
  // Inisialisasi Admin Default jika belum ada
  init: () => {
    const existing = patronService.getAllPatrons();
    if (existing.length === 0) {
      const defaultAdmin: Patron = {
        id: 'ADMIN-001',
        nama: 'Administrator BBPP',
        email: 'admin@bbpp.go.id',
        noIdentitas: '19760101',
        instansi: 'BBPP Lembang',
        kategori: 'Peneliti',
        tanggalDaftar: new Date().toISOString(),
        role: 'admin'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultAdmin]));
    }
  },

  register: async (data: Omit<Patron, 'id' | 'tanggalDaftar' | 'role'>): Promise<{ success: boolean; message: string; data?: Patron }> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const existing = patronService.getAllPatrons();
      if (existing.some(p => p.email === data.email)) {
        return { success: false, message: 'Email sudah terdaftar dalam sistem.' };
      }

      // Default role adalah 'user'. Admin hanya bisa ditambahkan via database/internal.
      const newPatron: Patron = {
        ...data,
        id: `PAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        tanggalDaftar: new Date().toISOString(),
        role: 'user'
      };

      const updated = [...existing, newPatron];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(SESSION_KEY, JSON.stringify(newPatron));

      return { success: true, message: 'Pendaftaran berhasil!', data: newPatron };
    } catch (error) {
      return { success: false, message: 'Terjadi kegagalan sistem pada backend.' };
    }
  },

  getAllPatrons: (): Patron[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  deletePatron: (id: string) => {
    const existing = patronService.getAllPatrons();
    const filtered = existing.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    const currentUser = patronService.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      patronService.logout();
    }
  },

  getCurrentUser: (): Patron | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }
};

// Auto init
patronService.init();
