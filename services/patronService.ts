
import { Patron } from '../types';

const STORAGE_KEY = 'agripustaka_patrons';
const SESSION_KEY = 'agripustaka_current_user';

export const patronService = {
  // Simulasi Backend API untuk pendaftaran
  register: async (data: Omit<Patron, 'id' | 'tanggalDaftar'>): Promise<{ success: boolean; message: string; data?: Patron }> => {
    // Simulasi delay jaringan
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const existing = patronService.getAllPatrons();
      
      // Validasi email unik (simulasi constraints database)
      if (existing.some(p => p.email === data.email)) {
        return { success: false, message: 'Email sudah terdaftar dalam sistem.' };
      }

      const newPatron: Patron = {
        ...data,
        id: `PAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        tanggalDaftar: new Date().toISOString()
      };

      const updated = [...existing, newPatron];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // Auto-login setelah daftar
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
    
    // Jika user yang login dihapus, force logout
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
    window.location.reload(); // Refresh untuk update UI
  }
};
