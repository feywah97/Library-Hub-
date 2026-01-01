
import React, { useState, useEffect } from 'react';
import { AgriMetrics } from '../types';
import { getAgriInsight } from '../services/geminiService';

const AgriMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AgriMetrics>({
    weather: { temp: 24, humidity: 82, condition: 'Berawan', windSpeed: 8, uvIndex: 3 },
    soil: { moisture: 45, ph: 6.5, nitrogen: 120 },
    market: { padi: 7200, cabai: 35000, tomat: 12000 }
  });
  
  const [history, setHistory] = useState<number[]>(new Array(15).fill(45));
  const [aiInsight, setAiInsight] = useState('Mengumpulkan data untuk analisis cerdas...');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Simulated Real-time Data Stream
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const nextMoisture = Math.max(20, Math.min(80, prev.soil.moisture + (Math.random() * 4 - 2)));
        setHistory(h => [...h.slice(1), nextMoisture]);
        
        return {
          ...prev,
          weather: {
            ...prev.weather,
            temp: +(prev.weather.temp + (Math.random() * 0.4 - 0.2)).toFixed(1)
          },
          soil: {
            ...prev.soil,
            moisture: +nextMoisture.toFixed(1)
          },
          market: {
            ...prev.market,
            padi: Math.floor(prev.market.padi + (Math.random() * 50 - 25)),
            cabai: Math.floor(prev.market.cabai + (Math.random() * 200 - 100)),
            tomat: Math.floor(prev.market.tomat + (Math.random() * 100 - 50))
          }
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Update AI Insight every 20 seconds
  useEffect(() => {
    const fetchInsight = async () => {
      setIsLoadingInsight(true);
      const insight = await getAgriInsight(metrics);
      setAiInsight(insight);
      setIsLoadingInsight(false);
    };
    
    fetchInsight();
    const insightInterval = setInterval(fetchInsight, 20000);
    return () => clearInterval(insightInterval);
  }, []);

  return (
    <div className="h-full flex flex-col space-y-6 animate-message overflow-y-auto pb-20 p-4 lg:p-8 transition-colors duration-500">
      {/* Header */}
      <div className="bg-emerald-900 dark:bg-emerald-950 p-8 lg:p-10 rounded-[2.5rem] text-white shadow-2xl border-b-8 border-yellow-400 relative overflow-hidden shrink-0 animate-message">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <svg className="w-40 h-40 animate-pulse-slow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
        </div>
        <div className="relative z-10 transition-transform hover:translate-x-2 duration-500">
          <div className="flex items-center space-x-3 mb-4">
             <span className="px-3 py-1 bg-yellow-400 text-slate-900 text-[8px] font-black uppercase rounded-full tracking-widest animate-pulse">Real-Time Metric Feed</span>
             <span className="px-3 py-1 bg-white/10 text-white text-[8px] font-black uppercase rounded-full tracking-widest">Station: Lembang-04-PRO</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black italic tracking-tighter leading-none text-white">Precision Data Analytics</h2>
          <p className="mt-4 text-emerald-100/60 text-xs font-medium max-w-lg leading-relaxed uppercase tracking-widest">Telemetri langsung dari jaringan sensor IoT di lahan riset BBPP Lembang.</p>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weather Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6 animate-message [animation-delay:0.1s] card-hover">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-opacity group-hover:opacity-100">Weather Telemetry</span>
              <span className="text-2xl animate-bounce">⛅</span>
           </div>
           <div className="space-y-1 transition-transform group-hover:scale-105">
              <p className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic">{metrics.weather.temp}°C</p>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{metrics.weather.condition}</p>
           </div>
           <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                 <span>Kelembapan Udara</span>
                 <span className="text-slate-900 dark:text-slate-200">{metrics.weather.humidity}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${metrics.weather.humidity}%` }}></div>
              </div>
           </div>
        </div>

        {/* Soil Moisture Chart Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6 md:col-span-2 animate-message [animation-delay:0.2s] card-hover">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Soil Moisture Flux (Live IoT Feed)</span>
              <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                 <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live Streaming</span>
              </div>
           </div>
           <div className="h-32 flex items-end space-x-1">
              {history.map((val, i) => (
                <div key={i} className="flex-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-t-lg transition-all duration-500 relative group" style={{ height: `${val}%` }}>
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-y-1 whitespace-nowrap z-10">{val}%</div>
                </div>
              ))}
           </div>
           <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800 transition-all group-hover:translate-y-1">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase">Current Moisture</p>
                 <p className="text-xl font-black text-slate-900 dark:text-slate-200 italic transition-transform group-hover:scale-105">{metrics.soil.moisture}%</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase">pH Stability</p>
                 <p className="text-xl font-black text-yellow-600 dark:text-yellow-400 italic transition-transform group-hover:scale-105">{metrics.soil.ph}</p>
              </div>
           </div>
        </div>

        {/* Market Price Card */}
        <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white shadow-xl space-y-6 md:col-span-3 animate-message [animation-delay:0.3s] hover:shadow-2xl transition-all duration-500">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Horticulture Market Price Index</h3>
              <span className="text-[8px] font-black bg-white/10 px-2 py-1 rounded-full uppercase animate-pulse">Refresh: 2s</span>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { label: 'Padi Giling', price: metrics.market.padi, trend: '+0.4%' },
                { label: 'Cabai Merah', price: metrics.market.cabai, trend: '-2.1%' },
                { label: 'Tomat Kurma', price: metrics.market.tomat, trend: '+1.8%' }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center transition-all hover:bg-white/10 hover:scale-105 hover:border-emerald-500/50 group duration-300">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 transition-transform group-hover:translate-y-[-2px]">{item.label}</p>
                   <p className="text-3xl font-black italic tracking-tighter transition-transform group-hover:scale-110">Rp{item.price.toLocaleString()}</p>
                   <p className={`text-[9px] font-black mt-2 uppercase transition-opacity group-hover:opacity-100 ${item.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                     {item.trend} Volatility
                   </p>
                </div>
              ))}
           </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-8 rounded-[2.5rem] border-2 border-emerald-100 dark:border-emerald-900/40 shadow-inner md:col-span-3 animate-message [animation-delay:0.4s] transition-all duration-500 hover:bg-emerald-100/50">
           <div className="flex items-center space-x-3 mb-4 transition-transform hover:translate-x-2 duration-500">
              <div className="w-10 h-10 bg-emerald-700 rounded-2xl flex items-center justify-center text-white text-xl animate-spin-slow">🧠</div>
              <div>
                 <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-widest">Situational Analysis Engine</h4>
                 <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">Dynamic Gemini Model Feed</p>
              </div>
           </div>
           <div className="relative overflow-hidden p-2">
              {isLoadingInsight && (
                 <div className="absolute inset-0 bg-emerald-50/50 dark:bg-emerald-950/50 backdrop-blur-sm flex items-center space-x-2 z-10 transition-opacity animate-in fade-in duration-300">
                    <div className="w-1 h-4 bg-emerald-500 animate-bounce"></div>
                    <div className="w-1 h-4 bg-emerald-500 animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-1 h-4 bg-emerald-500 animate-bounce [animation-delay:0.2s]"></div>
                 </div>
              )}
              <p className="text-sm lg:text-base font-medium text-emerald-900 dark:text-emerald-100 italic leading-relaxed transition-all duration-1000 animate-message">
                 "{aiInsight}"
              </p>
           </div>
        </div>
      </div>
      
      {/* Infrastructure Note */}
      <div className="pt-10 flex flex-col items-center space-y-4 animate-message [animation-delay:0.5s]">
         <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 transition-all hover:scale-105 active:scale-95 cursor-default">
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Precision Infrastructure Mesh</p>
         </div>
         <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center max-w-md transition-opacity hover:opacity-100 opacity-60">Data divisualisasikan secara real-time dari node sensor lapangan. Hubungkan ke API Gateway BBPP untuk akses produksi penuh.</p>
      </div>
    </div>
  );
};

export default AgriMetricsDashboard;
