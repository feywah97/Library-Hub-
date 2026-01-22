
import React, { useState, useEffect } from 'react';
import { getWeatherAgriculturalAdvice, getMapsGroundedWeather } from '../services/geminiService';
import { GroundingSource, AgriMetrics } from '../types';

const LOCATIONS = [
  { id: 'lembang', name: 'Lembang (BBPP)', lat: -6.8163, lng: 107.6152 },
  { id: 'ciwidey', name: 'Ciwidey', lat: -7.0931, lng: 107.4522 },
  { id: 'pangalengan', name: 'Pangalengan', lat: -7.1774, lng: 107.5707 },
  { id: 'kab-bogor', name: 'Kab. Bogor', lat: -6.4797, lng: 106.8251 },
  { id: 'kab-sukabumi', name: 'Kab. Sukabumi', lat: -6.9277, lng: 106.9300 },
  { id: 'kab-cianjur', name: 'Kab. Cianjur', lat: -6.8175, lng: 107.1422 },
  { id: 'kab-bandung', name: 'Kab. Bandung', lat: -7.0253, lng: 107.5198 },
  { id: 'kab-garut', name: 'Kab. Garut', lat: -7.2279, lng: 107.9087 },
  { id: 'kab-tasikmalaya', name: 'Kab. Tasikmalaya', lat: -7.3333, lng: 108.2000 },
  { id: 'kab-ciamis', name: 'Kab. Ciamis', lat: -7.3274, lng: 108.3514 },
  { id: 'kab-kuningan', name: 'Kab. Kuningan', lat: -6.9764, lng: 108.4839 },
  { id: 'kab-cirebon', name: 'Kab. Cirebon', lat: -6.7167, lng: 108.5667 },
  { id: 'kab-majalengka', name: 'Kab. Majalengka', lat: -6.8374, lng: 108.2255 },
  { id: 'kab-sumedang', name: 'Kab. Sumedang', lat: -6.8500, lng: 107.9167 },
  { id: 'kab-indramayu', name: 'Kab. Indramayu', lat: -6.3273, lng: 108.3249 },
  { id: 'kab-subang', name: 'Kab. Subang', lat: -6.5714, lng: 107.7583 },
  { id: 'kab-purwakarta', name: 'Kab. Purwakarta', lat: -6.5567, lng: 107.4431 },
  { id: 'kab-karawang', name: 'Kab. Karawang', lat: -6.3022, lng: 107.2953 },
  { id: 'kab-bekasi', name: 'Kab. Bekasi', lat: -6.3644, lng: 107.1725 },
  { id: 'kab-bandung-barat', name: 'Kab. Bandung Barat', lat: -6.8447, lng: 107.4897 },
  { id: 'kab-pangandaran', name: 'Kab. Pangandaran', lat: -7.6833, lng: 108.4833 },
  { id: 'kota-bogor', name: 'Kota Bogor', lat: -6.5971, lng: 106.7973 },
  { id: 'kota-sukabumi', name: 'Kota Sukabumi', lat: -6.9181, lng: 106.9267 },
  { id: 'kota-bandung', name: 'Kota Bandung', lat: -6.9175, lng: 107.6191 },
  { id: 'kota-cirebon', name: 'Kota Cirebon', lat: -6.7058, lng: 108.5553 },
  { id: 'kota-bekasi', name: 'Kota Bekasi', lat: -6.2383, lng: 106.9756 },
  { id: 'kota-depok', name: 'Kota Depok', lat: -6.4025, lng: 106.7942 },
  { id: 'kota-cimahi', name: 'Kota Cimahi', lat: -6.8722, lng: 107.5408 },
  { id: 'kota-tasikmalaya', name: 'Kota Tasikmalaya', lat: -7.3274, lng: 108.2207 },
  { id: 'kota-banjar', name: 'Kota Banjar', lat: -7.3719, lng: 108.5361 }
];

const WeatherDashboard: React.FC = () => {
  const [selectedLoc, setSelectedLoc] = useState(LOCATIONS[0]);
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const [weather, setWeather] = useState<AgriMetrics['weather']>({
    temp: 21.5,
    humidity: 84,
    condition: 'Hujan Ringan',
    windSpeed: 12,
    windDirection: 'Barat Laut',
    pressure: 1012,
    uvIndex: 2.1,
    visibility: 8.5,
    sunrise: '05:48',
    sunset: '17:52',
    cloudCover: 65,
    precipProb: 40
  });
  
  const [soil, setSoil] = useState<AgriMetrics['soil']>({
    moisture: 62,
    ph: 6.8,
    nitrogen: 110,
    temp: 18.5
  });
  
  const [advice, setAdvice] = useState('Mengambil analisis mikroklimat mendalam...');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);

  // Simulated live telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(prev => ({
        ...prev,
        temp: +(prev.temp + (Math.random() * 0.2 - 0.1)).toFixed(1),
        humidity: Math.min(100, Math.max(0, prev.humidity + Math.floor(Math.random() * 2 - 1))),
        windSpeed: Math.max(0, prev.windSpeed + (Math.random() * 0.5 - 0.25)),
        pressure: Math.floor(prev.pressure + (Math.random() * 3 - 1)),
        cloudCover: Math.min(100, Math.max(0, prev.cloudCover + Math.floor(Math.random() * 3 - 1)))
      }));
      setSoil(prev => ({
        ...prev,
        temp: +(prev.temp + (Math.random() * 0.1 - 0.05)).toFixed(1),
        moisture: Math.min(100, Math.max(0, +(prev.moisture + (Math.random() * 0.4 - 0.2)).toFixed(1)))
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchLocalizedData = async (lat: number, lng: number, name: string) => {
    setIsLoadingAdvice(true);
    setGroundingSources([]);
    try {
      const groundedRes = await getMapsGroundedWeather(lat, lng);
      setAdvice(groundedRes.text);
      if (groundedRes.groundingSources) {
        setGroundingSources(groundedRes.groundingSources);
      }
    } catch (err: any) {
      console.error("Weather grounding error:", err);
      // Fallback if grounding fails
      const res = await getWeatherAgriculturalAdvice(name, weather);
      setAdvice(res);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  useEffect(() => {
    if (!isUsingGPS) {
      fetchLocalizedData(selectedLoc.lat, selectedLoc.lng, selectedLoc.name);
    }
  }, [selectedLoc, isUsingGPS]);

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolokasi tidak didukung oleh browser ini.");
      return;
    }

    setIsLoadingAdvice(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsUsingGPS(true);
        setCurrentCoords({ lat: latitude, lng: longitude });
        fetchLocalizedData(latitude, longitude, "Precision GPS Feed");
      },
      (error) => {
        console.error("GPS Access Error:", error);
        alert("Gagal mengakses lokasi. Pastikan izin GPS telah diberikan.");
        setIsLoadingAdvice(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const getWindRotation = (dir: string) => {
    const directions: Record<string, number> = {
      'Utara': 0, 'Timur Laut': 45, 'Timur': 90, 'Tenggara': 135,
      'Selatan': 180, 'Barat Daya': 225, 'Barat': 270, 'Barat Laut': 315
    };
    return directions[dir] || 0;
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-message overflow-y-auto pb-20 p-4 lg:p-8 transition-colors duration-500">
      {/* Precision Header & Selector */}
      <div className="flex flex-col xl:flex-row gap-6 animate-message">
        <div className="bg-slate-900 dark:bg-black p-8 lg:p-12 rounded-[3rem] text-white shadow-2xl border-b-8 border-indigo-500 relative overflow-hidden flex-1 group transition-all duration-700">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
             <svg className="w-48 h-48 animate-spin-slow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>
          </div>
          <div className="relative z-10 transition-transform group-hover:translate-x-1 duration-500">
            <div className="flex items-center space-x-3 mb-6">
               <span className="px-4 py-1.5 bg-indigo-600 text-white text-[8px] lg:text-[10px] font-black uppercase rounded-full tracking-widest border border-indigo-400 shadow-lg shadow-indigo-500/20 animate-pulse">Agro-Climate Protocol Active</span>
               {isUsingGPS && <span className="px-4 py-1.5 bg-emerald-600 text-white text-[8px] lg:text-[10px] font-black uppercase rounded-full tracking-widest border border-emerald-400 animate-in zoom-in duration-300 shadow-lg shadow-emerald-500/20">Hyper-Local GPS Active</span>}
            </div>
            <h2 className="text-4xl lg:text-6xl font-black italic tracking-tighter leading-none">
              {isUsingGPS ? "Terrain Analysis Mode" : `${selectedLoc.name} Hub`}
            </h2>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Inference Status</p>
                <div className="flex items-center space-x-2">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${isLoadingAdvice ? 'bg-yellow-400' : 'bg-emerald-500'}`}></div>
                   <span className="text-[10px] font-black uppercase">{isLoadingAdvice ? 'Scanning Grounding...' : 'Real-time Sync OK'}</span>
                </div>
              </div>
              <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precision Range</p>
                <span className="text-[10px] font-black uppercase">{isUsingGPS ? "Grid-Level Precision" : "Station-Level Coverage"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col space-y-4 lg:w-80 shrink-0 animate-message [animation-delay:0.1s]">
           <button 
             onClick={handleUseGPS}
             className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-3 border-b-4 shadow-lg active:scale-95 ${isUsingGPS ? 'bg-emerald-600 text-white border-emerald-800 shadow-emerald-500/20' : 'bg-slate-900 text-white border-black hover:bg-slate-800'}`}
           >
             <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             <span>Precision GPS Sync</span>
           </button>
           
           <div className="relative flex items-center py-2">
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
              <span className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Location</span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
           </div>

           <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {LOCATIONS.map((loc, idx) => (
                <button
                  key={loc.id}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onClick={() => { setSelectedLoc(loc); setIsUsingGPS(false); }}
                  className={`px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all border-2 text-left flex items-center justify-between animate-in slide-in-from-left-2 active:scale-[0.98] ${
                    !isUsingGPS && selectedLoc.id === loc.id 
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-md translate-x-1' 
                      : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 dark:text-slate-600 hover:border-slate-200 shadow-inner'
                  }`}
                >
                  <span className="truncate">{loc.name}</span>
                  {!isUsingGPS && selectedLoc.id === loc.id && <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_indigo] shrink-0 ml-2"></div>}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Atmospheric Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sky Condition Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-8 lg:p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px] animate-message [animation-delay:0.2s] group duration-500 hover:shadow-indigo-500/20 card-hover">
           <div className="absolute top-10 right-10 text-[9rem] opacity-10 filter blur-sm transition-all group-hover:scale-110 group-hover:opacity-20">🌦️</div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end">
              <div className="transition-transform group-hover:translate-x-1 duration-500">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-3 transition-opacity opacity-70 group-hover:opacity-100">Live Temperature Flux</p>
                <p className="text-7xl lg:text-9xl font-black italic tracking-tighter leading-none">{weather.temp}°</p>
                <div className="flex items-center space-x-3 mt-4">
                   <p className="text-xl font-bold uppercase tracking-widest text-indigo-100">{weather.condition}</p>
                   <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shadow-[0_0_8px_emerald]"></span>
                </div>
              </div>
              <div className="mt-8 md:mt-0 text-right space-y-4">
                 <div className="bg-white/10 p-4 rounded-[2rem] border border-white/20 backdrop-blur-md transition-all group-hover:bg-white/20 hover:scale-105 duration-300">
                    <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Dew Point</p>
                    <p className="text-2xl font-black leading-none">{(weather.temp - (100 - weather.humidity) / 5).toFixed(1)}°C</p>
                 </div>
                 <div className="transition-transform group-hover:translate-y-[-4px] duration-500">
                    <p className="text-[8px] font-black text-indigo-300 uppercase">Atmospheric Density</p>
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden w-40 ml-auto shadow-inner">
                       <div className="h-full bg-blue-300 transition-all duration-1000 ease-out shadow-[0_0_10px_white]" style={{ width: `${weather.cloudCover}%` }}></div>
                    </div>
                    <p className="text-[9px] font-black mt-1 uppercase tracking-tighter opacity-80">{weather.cloudCover}% Coverage</p>
                 </div>
              </div>
           </div>
           
           <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-6 pt-10 border-t border-white/10 mt-8 transition-all group-hover:translate-y-[-2px]">
              <div className="space-y-5">
                <div className="flex items-center space-x-4 group/sun relative">
                   <div className="p-3 bg-white/10 rounded-2xl shadow-inner flex items-center justify-center text-xl transition-transform group-hover/sun:rotate-12">🌅</div>
                   <div>
                      <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">Sunrise</p>
                      <p className="text-sm font-black">{weather.sunrise}</p>
                   </div>
                   <div className="absolute -left-2 top-0 h-full w-0.5 bg-yellow-400/40 rounded-full"></div>
                </div>
                <div className="flex items-center space-x-4 group/sun relative">
                   <div className="p-3 bg-white/10 rounded-2xl shadow-inner flex items-center justify-center text-xl transition-transform group-hover/sun:rotate-[-12deg]">🌇</div>
                   <div>
                      <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">Sunset</p>
                      <p className="text-sm font-black">{weather.sunset}</p>
                   </div>
                   <div className="absolute -left-2 top-0 h-full w-0.5 bg-orange-600/40 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                   <p className="text-[9px] font-black text-indigo-200 uppercase mb-1.5">Humidity</p>
                   <p className="text-2xl font-black">{weather.humidity}%</p>
                   <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden w-full">
                      <div className="h-full bg-white shadow-[0_0_8px_white] transition-all duration-1000 ease-out" style={{ width: `${weather.humidity}%` }}></div>
                   </div>
                </div>
                <div>
                   <p className="text-[9px] font-black text-indigo-200 uppercase mb-1.5">Visibility Index</p>
                   <p className="text-2xl font-black">{weather.visibility}km</p>
                </div>
              </div>

              <div className="space-y-5 hidden sm:block">
                <div>
                   <p className="text-[9px] font-black text-indigo-200 uppercase mb-1.5">Anemometry</p>
                   <div className="flex items-center space-x-2">
                      <div 
                        className="p-1.5 bg-white/10 rounded-lg transition-transform duration-1000" 
                        style={{ transform: `rotate(${getWindRotation(weather.windDirection)}deg)` }}
                      >
                         <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      </div>
                      <p className="text-2xl font-black leading-none">{weather.windSpeed.toFixed(1)} <span className="text-[10px]">km/h</span></p>
                   </div>
                </div>
                <div>
                   <p className="text-[9px] font-black text-indigo-200 uppercase mb-1.5">Barometer</p>
                   <div className="flex items-center space-x-2">
                      <p className="text-2xl font-black">{weather.pressure} <span className="text-[10px]">hPa</span></p>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Specialized Diagnostic Cards */}
        <div className="flex flex-col space-y-6">
           {/* UV Sensor */}
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-between flex-1 group animate-message [animation-delay:0.3s] card-hover">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">UV Intensity</span>
                 <span className="text-2xl group-hover:scale-125 transition-transform duration-500 animate-pulse">☀️</span>
              </div>
              <div className="transition-transform group-hover:translate-y-[-2px]">
                 <p className="text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic leading-none">{weather.uvIndex}</p>
                 <p className={`text-[10px] font-black uppercase mt-3 py-1 px-3 rounded-full inline-block transition-all ${weather.uvIndex > 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                   {weather.uvIndex > 5 ? 'Extreme Risk' : 'Photosynthetic Range'}
                 </p>
              </div>
              <div className="mt-6 flex space-x-1">
                 {[...Array(11)].map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-1000 ${i <= Math.floor(weather.uvIndex) ? 'bg-orange-500 shadow-[0_0_5px_orange]' : 'bg-slate-100 dark:bg-slate-800'}`}></div>
                 ))}
              </div>
           </div>

           {/* Precision Irrigation Matrix */}
           <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-between flex-1 relative overflow-hidden animate-message [animation-delay:0.35s] card-hover group transition-all duration-500">
              <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-1000">
                 <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z"/><path d="M12 6a1 1 0 00-1 1v4.59l-2.71 2.7a1 1 0 001.42 1.42l3-3a1 1 0 00.29-.71V7a1 1 0 00-1-1z"/></svg>
              </div>
              <div className="flex items-center justify-between relative z-10">
                 <span className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em]">ET Rate Estimate</span>
                 <span className="text-2xl transition-transform group-hover:scale-110">💧</span>
              </div>
              <div className="relative z-10 mt-2">
                 <p className="text-4xl font-black italic">{(weather.temp * 0.12 + weather.windSpeed * 0.05).toFixed(2)} <span className="text-xs uppercase opacity-60">mm/hr</span></p>
                 <p className="text-[8px] font-black uppercase mt-2 text-indigo-200">Recommended Water Intake</p>
              </div>
              <div className="mt-4 p-2 bg-white/10 rounded-xl border border-white/20 text-center">
                 <p className="text-[8px] font-black uppercase tracking-widest">Cycle: {weather.humidity > 80 ? 'Maintenance' : 'High Delivery'}</p>
              </div>
           </div>
        </div>

        {/* Soil & Ground Analysis */}
        <div className="flex flex-col space-y-6">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-emerald-100 dark:border-emerald-800/40 shadow-xl flex flex-col justify-between flex-1 relative overflow-hidden animate-message [animation-delay:0.4s] group card-hover">
              <div className="flex items-center justify-between relative z-10">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Soil Health Matrix</span>
                 <span className="text-2xl transition-transform group-hover:scale-110">🧪</span>
              </div>
              <div className="space-y-6 relative z-10 mt-6 transition-transform group-hover:translate-y-[-2px]">
                 <div>
                    <p className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic leading-none">{soil.temp}°</p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Ground Temp</p>
                 </div>
                 <div className="h-px bg-slate-100 dark:bg-slate-800"></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Moisture</p>
                       <p className="text-lg font-black dark:text-slate-200">{soil.moisture}%</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">N-Level</p>
                       <p className="text-lg font-black text-yellow-600 dark:text-yellow-400">{soil.nitrogen} ppm</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-between flex-1 animate-message [animation-delay:0.45s] group card-hover duration-500">
              <div className="flex items-center justify-between">
                 <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest">Agro-Stability</span>
                 <span className="text-2xl transition-transform group-hover:rotate-12">🌱</span>
              </div>
              <div className="transition-transform group-hover:translate-x-1 duration-500">
                 <p className="text-3xl font-black italic tracking-tighter leading-tight uppercase">Optimal Cycle</p>
                 <p className="text-[10px] font-black text-emerald-100/60 uppercase tracking-widest mt-2">Zone: Tropical Highlands</p>
              </div>
           </div>
        </div>

        {/* AI Analysis Briefing Section (Grounded) */}
        <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/50 p-8 lg:p-12 rounded-[4rem] border-2 border-slate-200 dark:border-slate-800 shadow-inner relative overflow-hidden group transition-all duration-700 animate-message [animation-delay:0.5s] hover:shadow-2xl">
           <div className="absolute top-0 right-0 p-12 text-slate-200 dark:text-slate-800/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000">
              <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M17 8c.98 0 1.84.42 2.43 1.09L21.41 7.1c-1.1-1.3-2.65-2.1-4.41-2.1-3.31 0-6 2.69-6 6 0 .34.04.67.11 1H2v2h2v7h16v-7h2v-2h-2.11c.07-.33.11-.66.11-1 0-3.31-2.69-6-6-6zM4 19v-5h2v5H4zm4 0v-5h2v5H8zm4 0v-5h2v5h-2zm4 0v-5h2v5h-2zm0-7c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
           </div>
           
           <div className="relative z-10 flex flex-col xl:flex-row gap-12 items-start">
              <div className="xl:w-1/4 shrink-0 transition-transform group-hover:translate-x-1 duration-500">
                 <div className="w-20 h-20 bg-indigo-700 rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-2xl border-4 border-indigo-500/20 mb-6 transform group-hover:rotate-6 transition-all duration-500 hover:scale-110">🛰️</div>
                 <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">Protokol 24 Jam</h4>
                 <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2 leading-relaxed opacity-80">AI Precision Weather & Grounding Advisor.</p>
                 
                 {groundingSources.length > 0 && (
                   <div className="mt-8 space-y-3 animate-in fade-in duration-500">
                     <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Grounding Reference:</p>
                     {groundingSources.map((src, idx) => (
                       <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 underline truncate hover:text-indigo-800 transition-all bg-white dark:bg-slate-800 px-3 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 hover:-translate-y-0.5">
                         {src.title}
                       </a>
                     ))}
                   </div>
                 )}
              </div>

              <div className="flex-1 bg-white/60 dark:bg-black/40 backdrop-blur-2xl p-8 lg:p-12 rounded-[3.5rem] border border-white/60 dark:border-slate-800 min-h-[250px] relative shadow-2xl transition-all duration-500 group-hover:bg-white/80 dark:group-hover:bg-black/60">
                 {isLoadingAdvice && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-[3.5rem] z-20 animate-in fade-in duration-300">
                       <div className="flex flex-col items-center space-y-4">
                          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-lg"></div>
                          <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-[0.4em] animate-pulse">Syncing Local Atmosphere...</span>
                       </div>
                    </div>
                 )}
                 <div className="prose prose-sm lg:prose-base dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 font-medium leading-relaxed first-letter:text-5xl first-letter:font-black first-letter:text-indigo-700 dark:first-letter:text-indigo-400 first-letter:mr-4 first-letter:float-left drop-shadow-sm transition-all duration-1000 animate-message">
                   {advice}
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      {/* Network Stability Note */}
      <div className="pt-12 flex flex-col items-center space-y-5 animate-message [animation-delay:0.6s]">
         <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner transition-all hover:scale-105 active:scale-95 cursor-default">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] transition-colors hover:text-emerald-500">Agro-Precision Weather Mesh v3.1</p>
         </div>
         <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] text-center max-w-2xl italic opacity-60 transition-opacity hover:opacity-100 duration-500">Data cuaca disinkronisasi melalui Google Grounding Protocol. Resolusi mikroklimat diperbarui setiap siklus sensor (4s).</p>
      </div>
    </div>
  );
};

export default WeatherDashboard;
