
import React from 'react';
import { LENDING_TREND_DATA } from '../constants';

const LendingTrendChart: React.FC = () => {
  const maxValue = Math.max(...LENDING_TREND_DATA.flatMap(d => [d.pertanian, d.hortikultura]));
  
  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-emerald-100 shadow-inner">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest italic">Visualisasi Tren 12 Bulan Terakhir</h4>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-[#2D9C6B] rounded-sm"></div>
            <span className="text-[10px] font-bold text-slate-500">Pertanian</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
            <span className="text-[10px] font-bold text-slate-500">Hortikultura</span>
          </div>
        </div>
      </div>

      <div className="relative h-64 flex items-end justify-between space-x-1 md:space-x-2 px-2 border-b-2 border-emerald-100">
        {/* Y-Axis Labels */}
        <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between text-[8px] font-bold text-slate-400 pointer-events-none">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue / 2)}</span>
          <span>0</span>
        </div>

        {/* Bars */}
        {LENDING_TREND_DATA.map((data, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
            <div className="flex items-end space-x-0.5 md:space-x-1 h-full">
              {/* Pertanian Bar */}
              <div 
                className="w-2 md:w-4 bg-[#2D9C6B] rounded-t-sm transition-all duration-500 hover:brightness-110 cursor-pointer relative group/bar"
                style={{ height: `${(data.pertanian / maxValue) * 100}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-800 text-white text-[8px] px-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {data.pertanian}
                </div>
              </div>
              {/* Hortikultura Bar */}
              <div 
                className="w-2 md:w-4 bg-yellow-400 rounded-t-sm transition-all duration-500 hover:brightness-110 cursor-pointer relative group/bar"
                style={{ height: `${(data.hortikultura / maxValue) * 100}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-600 text-white text-[8px] px-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {data.hortikultura}
                </div>
              </div>
            </div>
            <span className="mt-2 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
              {data.month}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
        <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
          <span className="font-black text-emerald-600">Analisis:</span> Puncak peminjaman terjadi pada bulan <span className="font-black">November</span> dengan dominasi kategori Pertanian Umum, mencerminkan tingginya antusiasme pelatihan pada akhir tahun anggaran.
        </p>
      </div>
    </div>
  );
};

export default LendingTrendChart;
