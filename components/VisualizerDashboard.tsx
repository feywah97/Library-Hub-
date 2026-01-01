
import React, { useState, useEffect, useRef, useMemo } from 'react';
// Removed 'enhancePromptForImage' as it is not exported from geminiService and not used in this component.
import { generateDeepVisual, getSemanticIntent, generateImagen, getAgriculturalPromptSuggestions, upscaleImage, analyzeImage, editImageAgricultural } from '../services/geminiService';
import { VisualResult, AspectRatio, ImageStyle, AIModel } from '../types';
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
  const debouncedPrompt = useDebounce(prompt, 800); // Slightly longer for suggestion engine
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [images, setImages] = useState<VisualResult[]>([]);
  const [error, setError] = useState('');
  const [liveIntentTags, setLiveIntentTags] = useState<string[]>([]);
  const [isAnalyzingIntent, setIsAnalyzingIntent] = useState(false);
  const [upscalingIndex, setUpscalingIndex] = useState<number | null>(null);
  
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

  // Load app defaults from localStorage or use built-in defaults
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
    return saved ? Number(saved) : appDefaults.quantity;
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

  // Dynamic Suggestion & Intent Engine
  useEffect(() => {
    let isMounted = true;
    
    const updateSuggestions = async () => {
      if (isGenerating || isAnalyzing) return;
      
      setIsLoadingSuggestions(true);
      try {
        const suggestions = await getAgriculturalPromptSuggestions(String(debouncedPrompt || ''));
        if (isMounted) {
          setPromptSuggestions(suggestions);
        }
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
        setUploadedFile({
          base64,
          mimeType: file.type,
          preview: reader.result as string
        });
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

  const handleSemanticGenerate = async () => {
    const targetPrompt = String(prompt || '');
    if (!targetPrompt.trim()) return;
    setIsGenerating(true);
    setError('');
    setCurrentStep('Mengaktifkan Semantic Engine...');
    try {
      const result = await generateDeepVisual(targetPrompt, selectedStyle, selectedRatio, quantity, (step) => setCurrentStep(step));
      const newResults: VisualResult[] = result.imageUrls.map((url, index) => ({
        url: url,
        prompt: targetPrompt,
        insight: result.insight + (quantity > 1 ? ` (Variasi ${index + 1})` : ''),
        timestamp: new Date(),
        semanticTags: result.semanticTags,
        model: 'gemini_vision',
        style: selectedStyle,
        ratio: selectedRatio,
        rating: null
      }));
      setImages(prev => [...newResults, ...prev].slice(0, MAX_HISTORY_ITEMS));
      setPrompt('');
      setLiveIntentTags([]);
    } catch (err: any) {
      setError(err.message || "Gagal render semantik.");
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const handleProfessionalRender = async (customPrompt?: string | React.MouseEvent, style: ImageStyle = selectedStyle, ratio: AspectRatio = selectedRatio) => {
    // Determine the source prompt and ensure it's a string
    const rawInput = typeof customPrompt === 'string' ? customPrompt : prompt;
    const targetPrompt = String(rawInput || '');
    
    if (!targetPrompt.trim()) return;
    
    setIsGenerating(true);
    setError('');
    setCurrentStep(uploadedFile ? 'Memproses Image-to-Image...' : 'Inisialisasi Imagen 4 Pipeline...');
    try {
      let imageUrls: string[] = [];
      if (uploadedFile) {
        imageUrls = await editImageAgricultural(uploadedFile.base64, uploadedFile.mimeType, targetPrompt, style, quantity);
      } else {
        imageUrls = await generateImagen(targetPrompt, style, ratio, quantity);
      }
      if (!imageUrls || imageUrls.length === 0) throw new Error("Penyedia AI tidak mengembalikan data gambar.");
      const newResults: VisualResult[] = imageUrls.map((url, index) => ({
        url: url,
        prompt: targetPrompt,
        insight: uploadedFile 
          ? `Render berbasis referensi gambar unggahan dengan instruksi: ${targetPrompt}` 
          : `Render profesional menggunakan model Imagen 4.0 dengan gaya ${style.replace('_', ' ')}.${quantity > 1 ? ` (Artifact ${index + 1})` : ''}`,
        timestamp: new Date(),
        semanticTags: (liveIntentTags && liveIntentTags.length > 0) ? liveIntentTags : ['Masterpiece', 'Visual-Context', 'Render'],
        style: style,
        ratio: ratio,
        model: uploadedFile ? 'gemini_vision' : 'imagen_4',
        rating: null
      }));
      setImages(prev => [...newResults, ...prev].slice(0, MAX_HISTORY_ITEMS));
      if (typeof customPrompt !== 'string') setPrompt('');
      setLiveIntentTags([]);
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
    return images.filter(img => {
      const searchMatch = !archiveSearch || 
        String(img.prompt || '').toLowerCase().includes(archiveSearch.toLowerCase()) ||
        String(img.insight || '').toLowerCase().includes(archiveSearch.toLowerCase());
      const ratioMatch = filterRatio === 'all' || img.ratio === filterRatio;
      const styleMatch = filterStyle === 'all' || img.style === filterStyle;
      const modelMatch = filterModel === 'all' || img.model === filterModel;
      return searchMatch && ratioMatch && styleMatch && modelMatch;
    });
  }, [images, archiveSearch, filterRatio, filterStyle, filterModel]);

  const isFilterActive = filterRatio !== 'all' || filterStyle !== 'all' || filterModel !== 'all' || archiveSearch !== '';

  const selectedModelData = useMemo(() => models.find(m => m.id === selectedModel), [models, selectedModel]);

  const handleResetFilters = () => {
    setFilterRatio('all');
    setFilterStyle('all');
    setFilterModel('all');
    setArchiveSearch('');
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-message overflow-y-auto pb-20 p-4 lg:p-8 transition-colors duration-500">
      {/* Header Panel */}
      <div className="bg-slate-900 dark:bg-black p-8 lg:p-10 rounded-[2.5rem] text-white shadow-2xl border-b-8 border-emerald-500 relative overflow-hidden shrink-0 animate-message">
        <div className="absolute top-0 right-0 p-8 opacity-20">
           <svg className="w-40 h-40 animate-float" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 mb-4">
               <span className="px-3 py-1 bg-emerald-500 text-slate-900 text-[8px] font-black uppercase rounded-full tracking-widest animate-pulse">Vision Lab</span>
               <span className="px-3 py-1 bg-white/10 text-white text-[8px] font-black uppercase rounded-full tracking-widest">Diagnostic Station</span>
            </div>
            <div className="flex space-x-2">
               <button 
                onClick={handleSaveDefaults}
                className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all active:scale-90 flex items-center space-x-2 ${showDefaultSuccess ? 'bg-emerald-500 text-white' : 'bg-white/5 hover:bg-white/20 text-white/40 hover:text-white'}`}
              >
                {showDefaultSuccess ? '✅ Defaults Saved' : '💾 Set as App Defaults'}
              </button>
              <button 
                onClick={handleResetPreferences}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/20 text-white/40 hover:text-white text-[8px] font-black uppercase rounded-full tracking-widest transition-all active:scale-90"
              >
                Reset UI
              </button>
            </div>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black italic tracking-tighter leading-none">Agri-Vision Visualizer</h2>
          <p className="mt-4 text-white/60 text-xs font-medium max-w-lg leading-relaxed uppercase tracking-widest">Eksplorasi visual konsep riset menggunakan Imagen 4.0 & Contextual Vision.</p>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 transition-all duration-500 hover:shadow-2xl animate-message [animation-delay:0.1s]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Inference Model & Reference */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Inference Engine Selection</label>
            <div className="space-y-3 relative" ref={modelRef}>
              <button 
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className={`w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-black transition-all hover:border-emerald-500 focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-950/20 active:scale-[0.98]`}
              >
                <div className="flex items-center space-x-3 transition-transform group-hover:scale-105">
                  <span className="text-lg">{selectedModelData?.icon}</span>
                  <span className="dark:text-slate-100">{selectedModelData?.label}</span>
                </div>
                <svg className={`h-4 w-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[40] animate-in fade-in slide-in-from-top-2 duration-300">
                  {models.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setIsModelDropdownOpen(false); }}
                      className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center space-x-3 border-b last:border-none active:scale-[0.98] ${selectedModel === m.id ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800' : 'border-slate-50 dark:border-slate-800'}`}
                    >
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

            {/* Default Model Specs Panel */}
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

            <div className="relative mt-2">
              {uploadedFile ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-emerald-500 group animate-in zoom-in duration-300 shadow-lg">
                  <img src={uploadedFile.preview} alt="Upload Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <button onClick={handleClearUpload} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500 transition-all active:scale-90 z-10"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/10 transition-all group active:scale-[0.98]"
                >
                  <svg className="h-6 w-6 text-slate-300 group-hover:text-emerald-500 transition-all mb-1 group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4-4m4 4v12" /></svg>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest transition-colors group-hover:text-emerald-600">Image-to-Image Ref</span>
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
          </div>

          {/* Aspect Ratio Config */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Aspect Ratio Defaults</label>
            <div className="grid grid-cols-2 gap-3">
              {ratios.map(r => (
                <button 
                  key={r.id}
                  onClick={() => setSelectedRatio(r.id)}
                  className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedRatio === r.id ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                >
                  <div className={`shrink-0 bg-slate-200 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600 transition-all ${
                    r.id === '1:1' ? 'w-4 h-4' : 
                    r.id === '16:9' ? 'w-6 h-3' : 
                    r.id === '4:3' ? 'w-5 h-4' : 
                    r.id === '9:16' ? 'w-3 h-6' : 
                    r.id === '3:4' ? 'w-4 h-5' : 'w-4 h-4'
                  }`}></div>
                  <div className="text-left overflow-hidden">
                    <p className={`text-[10px] font-black uppercase ${selectedRatio === r.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{r.label}</p>
                    <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold truncate tracking-tight">{r.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Configuration */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Image Style Preset</label>
            <div className="grid grid-cols-2 gap-3">
              {styles.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${selectedStyle === s.id ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                >
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

        {/* Interaction Panel (Prompt Builder) */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 animate-message">
               <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Concept Engineering</label>
               <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  Batch: {quantity}x
               </span>
            </div>
            
            <div className="flex items-center space-x-1 animate-message">
              {[1, 2, 3, 4].map(num => (
                <button 
                  key={num} 
                  onClick={() => setQuantity(num)} 
                  className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all active:scale-90 ${quantity === num ? 'bg-slate-900 text-white scale-110 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-4 animate-message [animation-delay:0.2s]">
              <div className="relative group">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Deskripsikan visi visual Anda di sini..."
                  className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-950/20 focus:border-emerald-500 resize-none h-32 dark:text-slate-100 transition-all shadow-inner hover:bg-white dark:hover:bg-slate-900"
                />
              </div>

              {/* Suggestions */}
              <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap gap-2">
                  {(promptSuggestions.length > 0 ? promptSuggestions : ["Analisis Tanah", "Hidroponik", "Smart Greenhouse", "Irigasi Tetes", "Drone Mapping"]).map((s, idx) => (
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
            
            <div className="flex flex-col space-y-3 sm:w-64 animate-message [animation-delay:0.3s]">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || isAnalyzing || (!String(prompt || '').trim() && !uploadedFile)}
                className={`w-full py-4 rounded-3xl font-black text-xs lg:text-sm uppercase tracking-widest transition-all border-b-8 flex flex-col items-center justify-center space-y-3 shadow-xl active:translate-y-2 active:border-b-0 ${
                  (isGenerating || isAnalyzing || (!String(prompt || '').trim() && !uploadedFile))
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800'
                    : 'bg-emerald-700 text-white border-emerald-900 hover:bg-emerald-800 active:scale-[0.98]'
                }`}
              >
                {(isGenerating || isAnalyzing) ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="mt-2 text-[10px] uppercase font-black animate-pulse">{currentStep || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl transition-transform group-hover:scale-110">{selectedModel === 'imagen_4' ? '💎' : '🧠'}</span>
                    <span>Generate {quantity}x</span>
                  </>
                )}
              </button>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 transition-all hover:bg-emerald-100/50">
                 <p className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-center">
                   Current Config: {selectedRatio} • {selectedStyle.replace('_', ' ')}
                 </p>
              </div>
            </div>
          </div>
          {error && <p className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900/30 animate-in slide-in-from-top-2 shadow-sm duration-500">{error}</p>}
        </div>
      </div>

      {/* Analytics Section */}
      <VisualizerAnalytics images={images} />

      {/* History Archive */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b-2 border-slate-100 dark:border-slate-800 pb-6 transition-colors duration-500 animate-message">
          <div className="flex items-center space-x-6">
             <div className="flex items-center space-x-3">
               <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.3em]">Knowledge Archive</h3>
               <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-400 dark:text-slate-500 transition-all hover:bg-slate-200">{filteredImages.length}/{images.length} Nodes</span>
             </div>
             <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all active:scale-90 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button 
                  onClick={() => setViewMode('detailed')}
                  className={`p-1.5 rounded-lg transition-all active:scale-90 ${viewMode === 'detailed' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Detailed View"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                </button>
             </div>
          </div>

          <div className="flex flex-1 items-center space-x-4 max-w-2xl relative">
             <div className="relative flex-1 group">
                <input 
                  type="text" 
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder="Cari kata kunci..."
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-10 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                />
                <svg className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-transform group-focus-within:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             
             {/* Filter Toggle Button */}
             <button 
               onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
               className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl border transition-all active:scale-95 ${isFilterActive || isFilterPanelOpen ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-300'}`}
             >
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
               <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter</span>
             </button>

             {/* Expanded Filter Panel */}
             {isFilterPanelOpen && (
               <div className="absolute top-full right-0 mt-3 w-72 sm:w-96 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 z-[50] p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archive Filtering</p>
                    <button onClick={handleResetFilters} className="text-[9px] font-black text-emerald-600 hover:text-emerald-500 uppercase tracking-widest active:scale-90 transition-transform">Reset All</button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">By Aspect Ratio</label>
                      <select 
                        value={filterRatio}
                        onChange={(e) => setFilterRatio(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
                      >
                        <option value="all">All Ratios</option>
                        {ratios.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">By Image Style</label>
                      <select 
                        value={filterStyle}
                        onChange={(e) => setFilterStyle(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
                      >
                        <option value="all">All Styles</option>
                        {styles.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">By AI Model</label>
                      <select 
                        value={filterModel}
                        onChange={(e) => setFilterModel(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-200"
                      >
                        <option value="all">All Models</option>
                        {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsFilterPanelOpen(false)}
                    className="w-full py-3 bg-slate-900 dark:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                  >
                    Apply Filters
                  </button>
               </div>
             )}
          </div>
        </div>

        {/* Results Body */}
        {filteredImages.length === 0 ? (
          <div className="p-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800 transition-all animate-message">
             <p className="text-[11px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
               {images.length === 0 ? "Masukkan prompt untuk memulai arsip" : "Tidak ada hasil yang sesuai dengan filter aktif"}
             </p>
             {isFilterActive && (
               <button onClick={handleResetFilters} className="mt-4 px-6 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">Clear All Filters</button>
             )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-message">
             {filteredImages.map((img, i) => (
               <div key={i} style={{ animationDelay: `${i * 0.05}s` }} className="group relative aspect-square bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-500 cursor-pointer card-hover">
                  <div className="w-full h-full" onClick={() => handleRestoreSettings(img)}>
                    <LazyImage src={img.url} alt={String(img.prompt || '')} className="w-full h-full" />
                  </div>
                  
                  {/* Rating Overlay */}
                  <div className="absolute bottom-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRateImage(img.timestamp, 'up'); }}
                      className={`p-1.5 rounded-lg backdrop-blur-md transition-all active:scale-75 ${img.rating === 'up' ? 'bg-emerald-500 text-white scale-110' : 'bg-white/80 dark:bg-black/80 text-slate-600 dark:text-slate-400 hover:text-emerald-500'}`}
                    >
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRateImage(img.timestamp, 'down'); }}
                      className={`p-1.5 rounded-lg backdrop-blur-md transition-all active:scale-75 ${img.rating === 'down' ? 'bg-red-500 text-white scale-110' : 'bg-white/80 dark:bg-black/80 text-slate-600 dark:text-slate-400 hover:text-red-500'}`}
                    >
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z"/></svg>
                    </button>
                  </div>

                  <div className="absolute top-3 left-3 flex gap-1 pointer-events-none transition-transform group-hover:scale-110">
                     <span className={`text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase transition-colors ${img.isAnalysis ? 'bg-blue-600 text-white shadow-sm' : 'bg-black/60 text-white'}`}>
                       {img.isAnalysis ? '🔬' : img.model === 'imagen_4' ? '💎' : '🧠'}
                     </span>
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
                  <div className="lg:w-2/3 relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer" onClick={() => handleRestoreSettings(img)}>
                    <LazyImage src={img.url} alt={displayPrompt} className="w-full h-full transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10 transition-transform group-hover:scale-105">
                      <span className={`px-3 py-1 text-white text-[8px] font-black rounded-full uppercase border border-white/20 shadow-lg ${isAnalysis ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                        {isAnalysis ? 'Diagnostic' : (img.model?.replace('_', ' ') || 'AI Render')}
                      </span>
                    </div>
                  </div>
                  <div className={`lg:w-1/3 p-8 lg:p-10 flex flex-col justify-between border-l transition-all duration-500 ${isAnalysis ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <span className={`text-[8px] font-bold uppercase tracking-widest transition-opacity group-hover:opacity-100 ${isAnalysis ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{img.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                         
                         {/* Rating Actions */}
                         <div className="flex space-x-2 transition-transform group-hover:scale-110">
                           <button 
                             onClick={() => handleRateImage(img.timestamp, 'up')}
                             className={`p-2 rounded-xl transition-all active:scale-75 ${img.rating === 'up' ? 'bg-emerald-500 text-white scale-110 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-700 hover:text-emerald-500 shadow-sm'}`}
                             title="Kurasi: Berguna"
                           >
                             <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg>
                           </button>
                           <button 
                             onClick={() => handleRateImage(img.timestamp, 'down')}
                             className={`p-2 rounded-xl transition-all active:scale-75 ${img.rating === 'down' ? 'bg-red-500 text-white scale-110 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-700 hover:text-red-500 shadow-sm'}`}
                             title="Kurasi: Tidak Berguna"
                           >
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
                    {img.ratio && img.style && (
                      <div className="mt-6 flex flex-wrap gap-2 transition-transform group-hover:translate-y-[-2px]">
                        <span className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[7px] font-black uppercase text-slate-500 transition-colors hover:bg-slate-50">{img.ratio}</span>
                        <span className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[7px] font-black uppercase text-slate-500 transition-colors hover:bg-slate-50">{img.style}</span>
                      </div>
                    )}
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
