
import React from 'react';
import LendingTrendChart from './LendingTrendChart';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const StatisticsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 animate-in fade-in zoom-in duration-300">
        <div className="bg-[#2D9C6B] p-6 text-white border-b-4 border-yellow-400">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black italic tracking-tighter">Statistik Perpustakaan</h3>
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Laporan Tren Peminjaman Koleksi</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Tutup Modul" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8">
          <LendingTrendChart />
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Peminjaman', value: '1,248', desc: 'Tahun 2024' },
              { label: 'Kategori Terpopuler', value: 'Pertanian', desc: '54% Kontribusi' },
              { label: 'Pemustaka Aktif', value: '312', desc: 'Bulan ini' }
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 tracking-tighter italic leading-none">{stat.value}</p>
                <p className="text-[9px] text-slate-400 mt-1 font-bold">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-bold italic">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 text-[10px] font-black text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            CETAK LAPORAN
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal;
