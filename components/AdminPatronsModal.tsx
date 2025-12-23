
import React, { useState, useEffect, useRef } from 'react';
import { patronService } from '../services/patronService';
import { Patron } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPatronsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [patrons, setPatrons] = useState<Patron[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPatrons(patronService.getAllPatrons());
    }
  }, [isOpen]);

  // Handle clicks outside of suggestion box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data anggota ini secara permanen?')) {
      patronService.deletePatron(id);
      setPatrons(patronService.getAllPatrons());
    }
  };

  // Simple fuzzy-like filtering
  const getFilteredPatrons = (term: string) => {
    const lowerTerm = term.toLowerCase();
    return patrons.filter(p => 
      p.nama.toLowerCase().includes(lowerTerm) || 
      p.email.toLowerCase().includes(lowerTerm) ||
      p.instansi.toLowerCase().includes(lowerTerm) ||
      p.noIdentitas.toLowerCase().includes(lowerTerm)
    );
  };

  const filteredPatrons = getFilteredPatrons(searchTerm);
  const suggestions = searchTerm.length >= 2 ? getFilteredPatrons(searchTerm).slice(0, 5) : [];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-5xl h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-emerald-100 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        {/* Header Panel */}
        <div className="bg-[#1B5E20] p-8 text-white flex justify-between items-center border-b-4 border-yellow-400 shrink-0">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white/10 rounded-[2rem] border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter leading-none">Database Keanggotaan</h2>
              <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-[0.3em] mt-2">Sistem Informasi Manajemen Pemustaka BBPP Lembang</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 relative" ref={suggestionRef}>
            <div className="relative">
              <input 
                type="text"
                placeholder="Cari anggota..."
                className="bg-white/10 border border-white/20 rounded-full py-2.5 px-10 text-xs focus:bg-white focus:text-slate-800 outline-none transition-all w-72 placeholder:text-white/50 shadow-inner"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saran Pemustaka</p>
                  </div>
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSearchTerm(p.nama);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors flex items-center space-x-3 border-b border-slate-50 last:border-none"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-black">
                        {p.nama[0]}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-slate-700 truncate">{p.nama}</p>
                        <p className="text-[9px] text-slate-400 truncate uppercase tracking-tighter">{p.instansi}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button onClick={onClose} aria-label="Tutup Modul" className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 overflow-auto p-8">
          {filteredPatrons.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest italic">Data pemustaka tidak ditemukan</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                >
                  Bersihkan Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-[2rem] shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pemustaka</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Kategori</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identitas & Instansi</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Terdaftar</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPatrons.map((patron) => (
                    <tr key={patron.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-black text-xs shadow-inner">
                            {patron.nama[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 leading-none">{patron.nama}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1.5">{patron.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          patron.kategori === 'Peneliti' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                          patron.kategori === 'Mahasiswa' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          patron.kategori === 'Petani' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {patron.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[10px] font-black text-slate-600">{patron.noIdentitas}</p>
                        <p className="text-[10px] text-slate-400 font-bold italic">{patron.instansi}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[10px] font-bold text-slate-500">
                          {new Date(patron.tanggalDaftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => handleDelete(patron.id)}
                          aria-label="Hapus Anggota"
                          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:shadow-sm"
                          title="Hapus Anggota"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Panel */}
        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
             <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total: {patrons.length} Anggota Terdaftar</p>
          </div>
          <button 
            onClick={() => {
              const data = JSON.stringify(patrons, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `database_anggota_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:border-emerald-500 hover:text-emerald-700 transition-all shadow-sm active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Ekspor Data JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPatronsModal;
