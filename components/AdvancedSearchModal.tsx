
import React, { useState } from 'react';
import { SearchFilters } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
}

const AdvancedSearchModal: React.FC<Props> = ({ isOpen, onClose, onSearch }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    penulis: '',
    tahun: '',
    topik: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
    onClose();
    // Reset filters after search
    setFilters({ penulis: '', tahun: '', topik: '' });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900/30">
        <div className="bg-[#2D9C6B] dark:bg-emerald-800 p-6 text-white border-b-4 border-yellow-400">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black italic tracking-tighter">Pencarian Lanjutan</h3>
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Filter Koleksi Digital & Buku Teks</p>
            </div>
            <button onClick={onClose} aria-label="Tutup Modul" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest px-1">Penulis / Pengarang</label>
              <input 
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all dark:text-slate-100"
                placeholder="Contoh: Slamet Susanto"
                value={filters.penulis}
                onChange={e => setFilters({...filters, penulis: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest px-1">Tahun Terbit</label>
              <input 
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all dark:text-slate-100"
                placeholder="Contoh: 2022"
                value={filters.tahun}
                onChange={e => setFilters({...filters, tahun: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest px-1">Topik Spesifik</label>
            <input 
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all dark:text-slate-100"
              placeholder="Contoh: Hidroponik, Mekanisasi, Jeruk..."
              value={filters.topik}
              onChange={e => setFilters({...filters, topik: e.target.value})}
            />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold leading-relaxed">
              <span className="text-yellow-600 mr-1">ℹ️</span> 
              Sistem akan memfilter koleksi BBPP Lembang dan mencocokkan metadata yang tersedia di Repositori Kementerian Pertanian.
            </p>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[#2D9C6B] dark:bg-emerald-700 text-white font-black rounded-xl shadow-lg hover:bg-[#1B5E20] dark:hover:bg-emerald-600 transition-all border-b-4 border-yellow-500 active:translate-y-1 active:border-b-0 flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>TERAPKAN FILTER PENCARIAN</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdvancedSearchModal;
