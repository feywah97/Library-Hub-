
import React, { useState } from 'react';
import { patronService } from '../services/patronService';
import { Patron } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patron: Patron) => void;
}

const PatronRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    noIdentitas: '',
    instansi: '',
    kategori: 'Umum' as Patron['kategori']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const result = await patronService.register(formData);
    
    if (result.success && result.data) {
      onSuccess(result.data);
      onClose();
    } else {
      setError(result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md transition-opacity">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-emerald-100">
        <div className="bg-[#2D9C6B] p-8 text-white relative border-b-4 border-yellow-400">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex flex-col mb-2">
            <div className="text-xl font-black text-white drop-shadow-[0_1.5px_0_rgba(244,208,63,1)] tracking-tighter italic leading-none">
                BBPP LEMBANG
            </div>
            <div className="text-2xl font-black text-[#1B5E20] drop-shadow-[0_1.5px_0_rgba(244,208,63,1)] tracking-tighter italic leading-tight mt-[-2px]">
                BPPSDMP
            </div>
          </div>
          <p className="text-emerald-50 text-[10px] font-black uppercase tracking-widest mt-2">Registrasi Pemustaka Digital</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-2xl flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-1.5a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-1">Nama Lengkap</label>
            <input 
              required
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-[#2D9C6B] transition-all outline-none text-sm font-medium"
              placeholder="Sesuai kartu identitas"
              value={formData.nama}
              onChange={e => setFormData({...formData, nama: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-1">Email</label>
              <input 
                required
                type="email"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-[#2D9C6B] transition-all outline-none text-sm font-medium"
                placeholder="email@aktif.id"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-1">Status</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-[#2D9C6B] transition-all outline-none text-sm font-black appearance-none"
                value={formData.kategori}
                onChange={e => setFormData({...formData, kategori: e.target.value as any})}
              >
                <option value="Umum">Umum</option>
                <option value="Mahasiswa">Mahasiswa</option>
                <option value="Peneliti">Peneliti / Pegawai</option>
                <option value="Petani">Petani / Praktisi</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-1">NIK / No. Identitas</label>
            <input 
              required
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-[#2D9C6B] transition-all outline-none text-sm font-medium"
              placeholder="KTP / KTM / NIP"
              value={formData.noIdentitas}
              onChange={e => setFormData({...formData, noIdentitas: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-1">Instansi Asal</label>
            <input 
              required
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-[#2D9C6B] transition-all outline-none text-sm font-medium"
              placeholder="Unit Kerja / Sekolah / Kampus"
              value={formData.instansi}
              onChange={e => setFormData({...formData, instansi: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 mt-4 bg-[#2D9C6B] text-white font-black rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center space-x-3 group border-b-4 border-yellow-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#1B5E20] hover:scale-[1.02] active:scale-95'}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <>
                <span>KIRIM DATA</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
          
          <p className="text-center text-[9px] text-slate-400 font-bold italic">
            Balai Besar Pelatihan Pertanian Lembang - Kementerian Pertanian RI
          </p>
        </form>
      </div>
    </div>
  );
};

export default PatronRegistrationModal;
