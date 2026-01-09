
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { generateDeepVisual, getSemanticIntent, generateImagen, getAgriculturalPromptSuggestions, upscaleImage, analyzeImage, editImageAgricultural } from '../services/geminiService';
import { VisualResult, AspectRatio, ImageStyle, AIModel, AgriMetrics } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import VisualizerAnalytics from './VisualizerAnalytics';

const STORAGE_KEY_HISTORY = 'agrivision_visual_history_v2';
const STORAGE_KEY_DEFAULTS = 'agrivision_visual_defaults_v1';
const MAX_HISTORY_ITEMS = 50; 

const KEY_RATIO = 'agrivision_pref_ratio';
const KEY_STYLE = 'agrivision_pref_style';
const KEY_MODEL = 'agrivision_pref_model';
const KEY_QTY = 'agrivision_pref_qty';
const KEY_VIEW_MODE = 'agrivision_pref_view_mode';

const LazyImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative w-full h-full bg-slate-100 dark:bg-slate-800 overflow-hidden ${className}`}>
      {isVisible ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-1000 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-sm'
          }`}
        />
      ) : null}
      
      {(!isLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 animate-shimmer">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

const VisualizerDashboard: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const debouncedPrompt = useDebounce(prompt, 800);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [images, setImages] = useState<VisualResult[]>([]);
  const [error, setError] = useState('');
  const [liveIntentTags, setLiveIntentTags] = useState<string[]>([]);
  const [isAnalyzingIntent, setIsAnalyzingIntent] = useState(false);
  
  const [envWeather, setEnvWeather] = useState<AgriMetrics['weather']>({
    temp: 24.2,
    humidity: 78,
    condition: 'Cerah Berawan',
    windSpeed: 10.4,
    windDirection: 'Timur Laut',
    pressure: 1011,
    uvIndex: 4.2,
    visibility: 10,
    sunrise: '05:46',
    sunset: '17:54',
    cloudCover: 30,
    precipProb: 5
  });

  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<{ base64: string, mimeType: string, preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [archiveSearch, setArchiveSearch] = useState('');
  const [filterRatio, setFilterRatio] = useState<AspectRatio | 'all'>('all');
  const [filterStyle, setFilterStyle] = useState<ImageStyle | 'all'>('all');
  const [filterModel, setFilterModel] = useState<AIModel | 'all'>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'detailed'>(() => {
    return (localStorage.getItem(KEY_VIEW_MODE) as 'grid' | 'detailed') || 'detailed';
  });

  const models = useMemo(() => [
    { 
      id: 'imagen_4' as AIModel, 
      label: 'Imagen 4.0', 
      description: 'Output visual masterpiece 8K.', 
      icon: '💎',
      defaults: { res: 'Masterpiece 8K', proc: 'Neural Render', focus: 'Visual Fidelity' }
    },
    { 
      id: 'gemini_vision' as AIModel, 
      label: 'Gemini Vision', 
      description: 'Analisis konteks & Semantic Research.', 
      icon: '🧠',
      defaults: { res: 'Standard 2K', proc: 'Semantic Research', focus: 'Accuracy' }
    }
  ], []);

  const appDefaults = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DEFAULTS);
    return saved ? JSON.parse(saved) : { ratio: '16:9', style: 'photorealistic', model: 'imagen_4', quantity: 1 };
  }, []);

  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(() => {
    return (localStorage.getItem(KEY_RATIO) as AspectRatio) || appDefaults.ratio;
  });
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(() => {
    return (localStorage.getItem(KEY_STYLE) as ImageStyle) || appDefaults.style;
  });
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    return (localStorage.getItem(KEY_MODEL) as AIModel) || appDefaults.model;
  });
  const [quantity, setQuantity] = useState<number>(() => {
    const saved = localStorage.getItem(KEY_QTY);
    return saved ? Number(saved) : (appDefaults.quantity || 1);
  });

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [showDefaultSuccess, setShowDefaultSuccess] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(KEY_RATIO, selectedRatio); }, [selectedRatio]);
  useEffect(() => { localStorage.setItem(KEY_STYLE, selectedStyle); }, [selectedStyle]);
  useEffect(() => { localStorage.setItem(KEY_MODEL, selectedModel); }, [selectedModel]);
  useEffect(() => { localStorage.setItem(KEY_QTY, quantity.toString()); }, [quantity]);
  useEffect(() => { localStorage.setItem(KEY_VIEW_MODE, viewMode); }, [viewMode]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setImages(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error("Failed to load visual history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(images.slice(0, MAX_HISTORY_ITEMS)));
    }
  }, [images]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEnvWeather(prev => ({
        ...prev,
        temp: +(prev.temp + (Math.random() * 0.4 - 0.2)).toFixed(1),
        humidity: Math.min(100, Math.max(0, prev.humidity + Math.floor(Math.random() * 3 - 1))),
        windSpeed: +(prev.windSpeed + (Math.random() * 0.6 - 0.3)).toFixed(1),
        pressure: prev.pressure + (Math.random() > 0.5 ? 1 : -1)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const updateSuggestions = async () => {
      if (isGenerating || isAnalyzing) return;
      setIsLoadingSuggestions(true);
      try {
        const suggestions = await getAgriculturalPromptSuggestions(String(debouncedPrompt || ''), selectedModel === 'gemini_vision');
        if (isMounted) setPromptSuggestions(suggestions);
      } catch (err) {
        console.warn("Suggestions fetch failed", err);
      } finally {
        if (isMounted) setIsLoadingSuggestions(false);
      }
    };
    const updateIntent = async () => {
      const currentPrompt = String(debouncedPrompt || '');
      if (currentPrompt.length > 8) {
        setIsAnalyzingIntent(true);
        try {
          const tags = await getSemanticIntent(currentPrompt);
          if (isMounted) setLiveIntentTags(tags);
        } catch (err) {
          console.warn("Intent analysis failed", err);
        } finally {
          if (isMounted) setIsAnalyzingIntent(false);
        }
      } else if (currentPrompt.length === 0) {
        setLiveIntentTags([]);
      }
    };
    updateSuggestions();
    updateIntent();
    return () => { isMounted = false; };
  }, [debouncedPrompt, selectedModel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadedFile({ base64, mimeType: file.type, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearUpload = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
  };

  const handleSaveDefaults = () => {
    const newDefaults = { ratio: selectedRatio, style: selectedStyle, model: selectedModel, quantity };
    localStorage.setItem(STORAGE_KEY_DEFAULTS, JSON.stringify(newDefaults));
    setShowDefaultSuccess(true);
    setTimeout(() => setShowDefaultSuccess(false), 3000);
  };

  const handleResetPreferences = () => {
    if (window.confirm("Kembalikan pengaturan visualisasi ke default pabrik?")) {
      setSelectedRatio('16:9');
      setSelectedStyle('photorealistic');
      setSelectedModel('imagen_4');
      setQuantity(1);
    }
  };

  const handleSemanticGenerate = async (customPrompt?: string, style: ImageStyle = selectedStyle, ratio: AspectRatio = selectedRatio, batchQuantity: number = quantity) => {
    const targetPrompt = customPrompt || String(prompt || '');
    if (!targetPrompt.trim()) return;
    setIsGenerating(true);
    setError('');
    setCurrentStep('Mengaktifkan Semantic Engine...');
    try {
      const result = await generateDeepVisual(targetPrompt, style, ratio, batchQuantity, (step) => setCurrentStep(step));
      const newResults: VisualResult[] = result.imageUrls.map((url, index) => ({
        url: url,
        prompt: targetPrompt,
        insight: result.insight + (batchQuantity > 1 ? ` (Variasi ${index + 1})` : ''),
        timestamp: new Date(),
        semanticTags: result.semanticTags,
        model: 'gemini_vision',
        style: style,
        ratio: ratio,
        rating: null
      }));
      setImages(prev => [...newResults, ...prev].slice(0, MAX_HISTORY_ITEMS));
      if (!customPrompt) {
        setPrompt('');
        setLiveIntentTags([]);
      }
    } catch (err: any) {
      setError(err.message || "Gagal render semantik.");
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const handleProfessionalRender = async (customPrompt?: string, style: ImageStyle = selectedStyle, ratio: AspectRatio = selectedRatio, batchQuantity: number = quantity) => {
    const targetPrompt = customPrompt || String(prompt || '');
    if (!targetPrompt.trim()) return;
    setIsGenerating(true);
    setError('');
    setCurrentStep(uploadedFile ? 'Memproses Image-to-Image...' : 'Inisialisasi Imagen 4 Pipeline...');
    try {
      let imageUrls: string[] = [];
      if (uploadedFile) {
        imageUrls = await editImageAgricultural(uploadedFile.base64, uploadedFile.mimeType, targetPrompt, style, batchQuantity);
      } else {
        imageUrls = await generateImagen(targetPrompt, style, ratio, batchQuantity);
      }
      if (!imageUrls || imageUrls.length === 0) throw new Error("Penyedia AI tidak mengembalikan data gambar.");
      const newResults: VisualResult[] = imageUrls.map((url, index) => ({
        url: url,
        prompt: targetPrompt,
        insight: uploadedFile 
          ? `Render berbasis referensi gambar unggahan dengan instruksi: ${targetPrompt}` 
          : `Render profesional menggunakan model Imagen 4.0 dengan gaya ${style.replace('_', ' ')}.${batchQuantity > 1 ? ` (Artifact ${index + 1})` : ''}`,
        timestamp: new Date(),
        semanticTags: (liveIntentTags && liveIntentTags.length > 0) ? liveIntentTags : ['Masterpiece', 'Visual-Context', 'Render'],
        style: style,
        ratio: ratio,
        model: uploadedFile ? 'gemini_vision' : 'imagen_4',
        rating: null
      }));
      setImages(prev => [...newResults, ...prev].slice(0, MAX_HISTORY_ITEMS));
      if (!customPrompt) {
        setPrompt('');
        setLiveIntentTags([]);
      }
      handleClearUpload();
    } catch (err: any) {
      setError(err.message || "Gagal render Imagen.");
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const handleGenerate = () => {
    const currentPrompt = String(prompt || '');
    if (uploadedFile) {
      if (currentPrompt.trim()) handleProfessionalRender(currentPrompt);
      else handleAnalyzeUpload();
    } else if (selectedModel === 'imagen_4') {
      handleProfessionalRender(currentPrompt);
    } else {
      handleSemanticGenerate();
    }
  };

  const handleRegenerate = async (img: VisualResult) => {
    const p = img.prompt;
    const s = img.style || selectedStyle;
    const r = img.ratio || selectedRatio;
    const m = img.model || selectedModel;
    
    // Sync UI state for user context
    setPrompt(p);
    setSelectedStyle(s);
    setSelectedRatio(r);
    setSelectedModel(m);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (m === 'imagen_4') {
      await handleProfessionalRender(p, s, r, quantity);
    } else {
      await handleSemanticGenerate(p, s, r, quantity);
    }
  };

  const handleAnalyzeUpload = async () => {
    if (!uploadedFile || isAnalyzing) return;
    setIsAnalyzing(true);
    setError('');
    try {
      const { insight, suggestions } = await analyzeImage(uploadedFile.base64, uploadedFile.mimeType);
      const result: VisualResult = {
        url: uploadedFile.preview,
        prompt: "Analisis Citra Lapangan",
        insight: insight,
        timestamp: new Date(),
        semanticTags: suggestions,
        model: 'gemini_vision',
        isAnalysis: true,
        rating: null
      };
      setImages(prev => [result, ...prev].slice(0, MAX_HISTORY_ITEMS));
      handleClearUpload();
    } catch (err: any) {
      setError(err.message || "Gagal analisis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRestoreSettings = (img: VisualResult) => {
    const restoredPrompt = String(img.prompt || '');
    setPrompt(restoredPrompt);
    if (img.style) setSelectedStyle(img.style);
    if (img.ratio) setSelectedRatio(img.ratio);
    if (img.model) setSelectedModel(img.model);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddSuggestion = (text: string) => {
    setPrompt(prev => {
      const current = String(prev || '');
      const trimmed = current.trim();
      if (trimmed.toLowerCase().includes(String(text).toLowerCase())) return current;
      if (!trimmed) return text;
      const lastChar = trimmed.slice(-1);
      if (lastChar === ',' || lastChar === '.') return `${trimmed} ${text}`;
      return `${trimmed}, ${text}`;
    });
  };

  const handleRateImage = (timestamp: Date, rating: 'up' | 'down') => {
    setImages(prev => prev.map(img => {
      if (img.timestamp.getTime() === timestamp.getTime()) {
        return { ...img, rating: img.rating === rating ? null : rating };
      }
      return img;
    }));
  };

  const styles: { id: ImageStyle; label: string; icon: string; description: string }[] = [
    { id: 'photorealistic', label: 'Realistic', icon: '📸', description: 'Fotografi sinematik resolusi tinggi.' },
    { id: 'scientific_diagram', label: 'Diagram', icon: '📊', description: 'Diagram teknis bersih.' },
    { id: 'digital_art', label: 'Modern Art', icon: '⚡', description: 'Seni digital modern.' },
    { id: 'botanical_illustration', label: 'Botanical', icon: '🌿', description: 'Ilustrasi botani cat air.' },
    { id: 'vintage_plate', label: 'Vintage', icon: '📜', description: 'Estetika litografi ilmiah.' },
    { id: 'satellite', label: 'Satellite', icon: '🛰️', description: 'Citra satelit farm mapping.' }
  ];

  const ratios: { id: AspectRatio; label: string; description: string }[] = [
    { id: '1:1', label: '1:1', description: 'Persegi' },
    { id: '16:9', label: '16:9', description: 'Widescreen' },
    { id: '4:3', label: '4:3', description: 'Klasik' },
    { id: '9:16', label: '9:16', description: 'Mobile Vertical' },
    { id: '3:4', label: '3:4', description: 'Potret Standar' }
  ];

  const filteredImages = useMemo(() => {
    const searchLower = archiveSearch.toLowerCase();
    return images.filter(img => {
      const searchMatch = !archiveSearch || 
        String(img.prompt || '').toLowerCase().includes(searchLower) ||
        String(img.insight || '').toLowerCase().includes(searchLower) ||
        (img.semanticTags || []).some(tag => tag.toLowerCase().includes(searchLower));
      const ratioMatch = filterRatio === 'all' || img.ratio === filterRatio;
      const styleMatch = filterStyle === 'all' || img.style === filterStyle;
      const modelMatch = filterModel === 'all' || img.model === filterModel;
      return searchMatch && ratioMatch && styleMatch && modelMatch;
    });
  }, [images, archiveSearch, filterRatio, filterStyle, filterModel]);

  const isFilterActive = filterRatio !== 'all' || filterStyle !== 'all' || filterModel !== 'all' || archiveSearch !== '';
  const selectedModelData = useMemo(() => models.find(m => m.id === selectedModel), [models, selectedModel]);
  const handleResetFilters = () => {
    setFilterRatio('all'); setFilterStyle('all'); setFilterModel('all'); setArchiveSearch('');
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-message overflow-y-auto pb-20 p-4 lg:p-8 transition-colors duration-500">
      {/* Header Panel */}
      <div className="bg-slate-900 dark:bg-black p-8 lg:p-10 rounded-[2.5rem] text-white shadow-2xl border-b-8 border-emerald-500 relative overflow-hidden shrink-0 animate-message">
        <div className="absolute top-0 right-0 p-8 opacity-20">
           <svg className="w-40 h-40 animate-float" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                 <span className="px-3 py-1 bg-emerald-500 text-slate-900 text-[8px] font-black uppercase rounded-full tracking-widest animate-pulse">Vision Lab</span>
                 <span className="px-3 py-1 bg-white/10 text-white text-[8px] font-black uppercase rounded-full tracking-widest">Diagnostic Station</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black italic tracking-tighter leading-none">Agri-Vision Visualizer</h2>
              <p className="mt-4 text-white/60 text-xs font-medium max-w-lg leading-relaxed uppercase tracking-widest">Eksplorasi visual konsep riset menggunakan Imagen 4.0 & Contextual Vision.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 flex flex-col space-y-4 min-w-[280px] animate-in slide-in-from-right-4 duration-700">
               <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center space-x-2">
                     <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                     <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Ground Context</p>
                  </div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-tighter">Live Telemetry</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Atmosphere</p>
                     <p className="text-xl font-black italic">{envWeather.temp}° <span className="text-[8px] font-bold opacity-60 ml-1">{envWeather.humidity}% Hum</span></p>
                  </div>
                  <div className="space-y-1 text-right">
                     <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Wind Vector</p>
                     <p className="text-sm font-black truncate">{envWeather.windSpeed} km/h {envWeather.windDirection[0]}</p>
                  </div>
               </div>
               <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-3">
                     <div className="flex items-center space-x-1.5">
                        <span className="text-[10px]">🌅</span>
                        <span className="text-[9px] font-bold text-white/80">{envWeather.sunrise}</span>
                     </div>
                     <div className="flex items-center space-x-1.5">
                        <span className="text-[10px]">🌇</span>
                        <span className="text-[9px] font-bold text-white/80">{envWeather.sunset}</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Barometer</p>
                     <p className="text-[10px] font-black text-indigo-400">{envWeather.pressure} hPa</p>
                  </div>
               </div>
            </div>
          </div>
          <div className="mt-8 flex space-x-2 border-t border-white/5 pt-6">
               <button onClick={handleSaveDefaults} className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all active:scale-90 flex items-center space-x-2 ${showDefaultSuccess ? 'bg-emerald-500 text-white' : 'bg-white/5 hover:bg-white/20 text-white/40 hover:text-white'}`}>
                {showDefaultSuccess ? '✅ Defaults Saved' : '💾 Set as App Defaults'}
              </button>
              <button onClick={handleResetPreferences} className="px-3 py-1.5 bg-white/5 hover:bg-white/20 text-white/40 hover:text-white text-[8px] font-black uppercase rounded-full tracking-widest transition-all active:scale-90">Reset UI</button>
          </div>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 transition-all duration-500 hover:shadow-2xl animate-message [animation-delay:0.1s]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Inference Engine Selection</label>
            <div className="space-y-3 relative" ref={modelRef}>
              <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} className={`w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-black transition-all hover:border-emerald-500 focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-950/20 active:scale-[0.98]`}>
                <div className="flex items-center space-x-3 transition-transform group-hover:scale-105">
                  <span className="text-lg">{selectedModelData?.icon}</span>
                  <span className="dark:text-slate-100">{selectedModelData?.label}</span>
                </div>
                <svg className={`h-4 w-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[40] animate-in fade-in slide-in-from-top-2 duration-300">
                  {models.map(m => (
                    <button key={m.id} onClick={() => { setSelectedModel(m.id); setIsModelDropdownOpen(false); }} className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center space-x-3 border-b last:border-none active:scale-[0.98] ${selectedModel === m.id ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800' : 'border-slate-50 dark:border-slate-800'}`}>
                      <span className="text-xl transition-transform group-hover:scale-125">{m.icon}</span>
                      <div>
                        <p className={`text-[11px] font-black uppercase ${selectedModel === m.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>{m.label}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{m.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Resolution</p>
                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate">{selectedModelData?.defaults.res}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Process</p>
                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate">{selectedModelData?.defaults.proc}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Focus</p>
                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate">{selectedModelData?.defaults.focus}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Aspect Ratio Defaults</label>
            <div className="grid grid-cols-2 gap-3">
              {ratios.map(r => (
                <button key={r.id} onClick={() => setSelectedRatio(r.id)} className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedRatio === r.id ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}>
                  <div className={`shrink-0 bg-slate-200 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600 transition-all ${r.id === '1:1' ? 'w-4 h-4' : r.id === '16:9' ? 'w-6 h-3' : r.id === '4:3' ? 'w-5 h-4' : r.id === '9:16' ? 'w-3 h-6' : r.id === '3:4' ? 'w-4 h-5' : 'w-4 h-4'}`}></div>
                  <div className="text-left overflow-hidden">
                    <p className={`text-[10px] font-black uppercase ${selectedRatio === r.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{r.label}</p>
                    <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold truncate tracking-tight">{r.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Image Style Preset</label>
            <div className="grid grid-cols-2 gap-3">
              {styles.map(s => (
                <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedStyle === s.id ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}>
                  <span className="text-lg transition-transform group-hover:scale-125">{s.icon}</span>
                  <div className="text-left overflow-hidden">
                    <p className={`text-[10px] font-black uppercase ${selectedStyle === s.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{s.label}</p>
                    <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold truncate tracking-tight">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Improved Quantity Selector Section */}
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-1">
               <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                  <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Inference Batch Size</label>
               </div>
               <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase italic pl-3.5">Hasilkan beberapa variasi visual sekaligus untuk perbandingan analisis riset.</p>
            </div>
            
            <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
              {[1, 2, 3, 4, 6, 8].map(num => (
                <button 
                  key={num} 
                  onClick={() => setQuantity(num)} 
                  className={`relative w-12 h-10 rounded-xl text-[11px] font-black transition-all flex items-center justify-center group/qty ${
                    quantity === num 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-110 z-10' 
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  {num}x
                  {quantity === num && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 mt-4">
            <div className="flex-1 space-y-4 animate-message [animation-delay:0.2s]">
              {/* Prompt Engineering Guide */}
              <div className="flex flex-wrap gap-4 px-2">
                <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                   <span className="text-emerald-500">Subject:</span> What is the focus?
                </div>
                <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                   <span className="text-emerald-500">Env:</span> Lab, field, or satellite?
                </div>
                <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                   <span className="text-emerald-500">Light:</span> Cinematic, sunlight, or macro?
                </div>
                <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                   <span className="text-emerald-500">Detail:</span> 8k, sharp, or blueprint?
                </div>
              </div>

              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Macro 8k shot of chili plant leaf showing stomata structure, cinematic laboratory lighting, high scientific detail..."
                className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-950/20 focus:border-emerald-500 resize-none h-32 dark:text-slate-100 transition-all shadow-inner hover:bg-white dark:hover:bg-slate-900"
              />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Inference Prompt Assistance</h4>
                  </div>
                  {isLoadingSuggestions && (
                    <div className="flex space-x-1 animate-in fade-in duration-300">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 min-h-[80px] flex items-center">
                  <div className="flex flex-wrap gap-2">
                    {(promptSuggestions.length > 0 ? promptSuggestions : ["Analisis Tanah", "Hidroponik", "Smart Greenhouse", "Irigasi Tetes", "Teknologi Benih", "Alsintan Modern"]).map((s, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleAddSuggestion(String(s))} 
                        className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all shadow-sm flex items-center group active:scale-95"
                      >
                        <span className="text-emerald-500 mr-1.5 transition-transform group-hover:scale-125">+</span>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3 sm:w-72 animate-message [animation-delay:0.3s]">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || isAnalyzing || (!String(prompt || '').trim() && !uploadedFile)}
                className={`w-full py-6 rounded-3xl font-black text-xs lg:text-sm uppercase tracking-[0.2em] transition-all border-b-8 flex flex-col items-center justify-center space-y-3 shadow-2xl active:translate-y-2 active:border-b-0 ${
                  (isGenerating || isAnalyzing || (!String(prompt || '').trim() && !uploadedFile))
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800'
                    : 'bg-emerald-700 text-white border-emerald-900 hover:bg-emerald-800 active:scale-[0.98]'
                }`}
              >
                {(isGenerating || isAnalyzing) ? (
                  <>
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="mt-2 text-[10px] uppercase font-black animate-pulse">{currentStep || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl transition-transform group-hover:scale-110 mb-1">{selectedModel === 'imagen_4' ? '💎' : '🧠'}</span>
                    <div className="flex flex-col items-center leading-tight">
                       <span>Render {quantity > 1 ? `Batch (${quantity}x)` : 'Visualization'}</span>
                       <span className="text-[8px] opacity-60 mt-1">{selectedModelData?.label} Engine</span>
                    </div>
                  </>
                )}
              </button>
              
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 transition-all hover:bg-emerald-100/50 text-center">
                 <div className="flex justify-between items-center px-1 mb-1">
                    <span className="text-[7px] font-black text-emerald-400 uppercase">Configuration</span>
                    <span className="text-[7px] font-black text-emerald-400 uppercase">Status: OK</span>
                 </div>
                 <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest truncate">
                   {selectedRatio} • {selectedStyle.replace('_', ' ')}
                 </p>
              </div>
            </div>
          </div>
          {error && <p className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900/30 animate-in slide-in-from-top-2 shadow-sm duration-500">{error}</p>}
        </div>
      </div>

      <VisualizerAnalytics images={images} />

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b-2 border-slate-100 dark:border-slate-800 pb-6 transition-colors duration-500 animate-message">
          <div className="flex items-center space-x-6">
             <div className="flex items-center space-x-3">
               <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.3em]">Knowledge Archive</h3>
               <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-400 dark:text-slate-500 transition-all hover:bg-slate-200">{filteredImages.length}/{images.length} Nodes</span>
             </div>
             <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all active:scale-90 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Grid View">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button onClick={() => setViewMode('detailed')} className={`p-1.5 rounded-lg transition-all active:scale-90 ${viewMode === 'detailed' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Detailed View">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                </button>
             </div>
          </div>
          <div className="flex flex-1 items-center space-x-4 max-w-2xl relative">
             <div className="relative flex-1 group">
                <input type="text" value={archiveSearch} onChange={(e) => setArchiveSearch(e.target.value)} placeholder="Cari prompt atau insight..." className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-10 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-inner" />
                <svg className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-transform group-focus-within:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                {archiveSearch && (
                  <button onClick={() => setArchiveSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all">
                    <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
             </div>
             <button onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl border transition-all active:scale-95 ${isFilterActive || isFilterPanelOpen ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-300'}`}>
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
               <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter</span>
             </button>
             {isFilterPanelOpen && (
               <div className="absolute top-full right-0 mt-3 w-72 sm:w-96 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 z-[50] p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archive Filtering</p>
                    <button onClick={handleResetFilters} className="text-[9px] font-black text-emerald-600 hover:text-emerald-500 uppercase tracking-widest active:scale-90 transition-transform">Reset All</button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">By Aspect Ratio</label>
                      <select value={filterRatio} onChange={(e) => setFilterRatio(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-200">
                        <option value="all">All Ratios</option>
                        {ratios.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">By Image Style</label>
                      <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-200">
                        <option value="all">All Styles</option>
                        {styles.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">By AI Model</label>
                      <select value={filterModel} onChange={(e) => setFilterModel(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-200">
                        <option value="all">All Models</option>
                        {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => setIsFilterPanelOpen(false)} className="w-full py-3 bg-slate-900 dark:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">Apply Filters</button>
               </div>
             )}
          </div>
        </div>

        {/* Filter Pills */}
        {isFilterActive && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
            {filterRatio !== 'all' && (
              <button onClick={() => setFilterRatio('all')} className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all">
                <span>Ratio: {filterRatio}</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            {filterStyle !== 'all' && (
              <button onClick={() => setFilterStyle('all')} className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all">
                <span>Style: {filterStyle}</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            {filterModel !== 'all' && (
              <button onClick={() => setFilterModel('all')} className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all">
                <span>Engine: {filterModel}</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            {archiveSearch && (
              <button onClick={() => setArchiveSearch('')} className="flex items-center space-x-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all">
                <span>Term: {archiveSearch}</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            <button onClick={handleResetFilters} className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors">Reset All</button>
          </div>
        )}

        {filteredImages.length === 0 ? (
          <div className="p-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800 transition-all animate-message">
             <p className="text-[11px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{images.length === 0 ? "Masukkan prompt untuk memulai arsip" : "Tidak ada hasil yang sesuai dengan filter aktif"}</p>
             {isFilterActive && (
               <button onClick={handleResetFilters} className="mt-4 px-6 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">Clear All Filters</button>
             )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-message">
             {filteredImages.map((img, i) => (
               <div key={i} style={{ animationDelay: `${i * 0.05}s` }} className="group flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-500 cursor-pointer card-hover">
                  <div className="aspect-square w-full relative" onClick={() => handleRestoreSettings(img)}>
                    <LazyImage src={img.url} alt={String(img.prompt || '')} className="w-full h-full" />
                    <div className="absolute bottom-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRegenerate(img); }}
                        className="p-2 bg-emerald-600 text-white rounded-lg backdrop-blur-md transition-all active:scale-75 hover:bg-emerald-700 shadow-xl border border-white/20 flex items-center space-x-1.5"
                        title="Re-run Generation"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleRateImage(img.timestamp, 'up'); }} className={`p-1.5 rounded-lg backdrop-blur-md transition-all active:scale-75 ${img.rating === 'up' ? 'bg-emerald-500 text-white scale-110' : 'bg-white/80 dark:bg-black/80 text-slate-600 dark:text-slate-400 hover:text-emerald-500'}`}>
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg>
                      </button>
                    </div>
                    <div className="absolute top-3 left-3 flex gap-1 pointer-events-none transition-transform group-hover:scale-110 z-20">
                       <span className={`text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase transition-colors ${img.isAnalysis ? 'bg-blue-600 text-white shadow-sm' : 'bg-black/60 text-white'}`}>
                         {img.isAnalysis ? '🔬' : img.model === 'imagen_4' ? '💎' : '🧠'}
                       </span>
                    </div>
                  </div>
                  {/* Grid Caption Section */}
                  <div className="p-4 flex-1 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                     <p className="text-[9px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 italic leading-relaxed">
                        "{img.prompt}"
                     </p>
                     <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-[70%]">
                           {img.style?.replace('_', ' ')} • {img.ratio}
                        </span>
                        <span className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                           {img.model === 'imagen_4' ? 'V4.0' : 'G-VIS'}
                        </span>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12">
            {filteredImages.map((img, i) => {
              const isAnalysis = img.isAnalysis;
              const displayPrompt = String(img.prompt || '');
              return (
                <div key={i} style={{ animationDelay: `${i * 0.1}s` }} className={`group flex flex-col lg:flex-row bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border shadow-xl transition-all duration-700 animate-message card-hover ${isAnalysis ? 'border-blue-200 dark:border-blue-900/30' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="lg:w-2/3 relative flex flex-col">
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer" onClick={() => handleRestoreSettings(img)}>
                      <LazyImage src={img.url} alt={displayPrompt} className="w-full h-full transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10 transition-transform group-hover:scale-105">
                        <span className={`px-3 py-1 text-white text-[8px] font-black rounded-full uppercase border border-white/20 shadow-lg ${isAnalysis ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                          {isAnalysis ? 'Diagnostic' : (img.model?.replace('_', ' ') || 'AI Render')}
                        </span>
                      </div>
                    </div>
                    {/* Detailed view specific caption directly below image */}
                    <div className="p-4 bg-slate-900/5 dark:bg-black/20 border-t border-slate-100 dark:border-slate-800">
                       <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                         VISUAL METADATA: {img.style?.replace('_', ' ')} | {img.ratio} | ENGINE: {img.model?.toUpperCase()}
                       </p>
                    </div>
                  </div>
                  <div className={`lg:w-1/3 p-8 lg:p-10 flex flex-col justify-between border-l transition-all duration-500 ${isAnalysis ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <span className={`text-[8px] font-bold uppercase tracking-widest transition-opacity group-hover:opacity-100 ${isAnalysis ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{img.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                         <div className="flex space-x-2 transition-transform group-hover:scale-110">
                           <button 
                             onClick={() => handleRegenerate(img)}
                             className="px-3 py-2 bg-emerald-600 text-white rounded-xl transition-all active:scale-75 shadow-lg border border-emerald-500 hover:bg-emerald-700 flex items-center space-x-2"
                             title="Regenerate"
                           >
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                             <span className="text-[9px] font-black uppercase tracking-widest">RE-RUN</span>
                           </button>
                           <button onClick={() => handleRateImage(img.timestamp, 'up')} className={`p-2 rounded-xl transition-all active:scale-75 ${img.rating === 'up' ? 'bg-emerald-500 text-white scale-110 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-700 hover:text-emerald-500 shadow-sm'}`} title="Kurasi: Berguna">
                             <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg>
                           </button>
                           <button onClick={() => handleRateImage(img.timestamp, 'down')} className={`p-2 rounded-xl transition-all active:scale-75 ${img.rating === 'down' ? 'bg-red-500 text-white scale-110 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-700 hover:text-red-500 shadow-sm'}`} title="Kurasi: Tidak Berguna">
                             <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z"/></svg>
                           </button>
                         </div>
                      </div>
                      <div className="space-y-3 transition-transform group-hover:translate-x-1">
                         <h4 className={`text-xs font-black uppercase ${isAnalysis ? 'text-blue-800 dark:text-blue-300' : 'text-slate-900 dark:text-slate-200'}`}>
                           {isAnalysis ? 'Agronomic Data Node' : 'Research Visual Metadata'}
                         </h4>
                         <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic leading-relaxed">"{displayPrompt}"</p>
                      </div>
                      <div className={`p-6 bg-white dark:bg-slate-900 rounded-[2rem] border shadow-inner transition-all duration-500 group-hover:shadow-md ${isAnalysis ? 'border-blue-200 dark:border-blue-800' : 'border-slate-100 dark:border-slate-800'}`}>
                         <div className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic line-clamp-10 overflow-y-auto whitespace-pre-wrap scrollbar-hide">
                           {String(img.insight || '')}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizerDashboard;
