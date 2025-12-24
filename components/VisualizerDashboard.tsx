
import React, { useState, useEffect } from 'react';
import { generateDeepVisual, getSemanticIntent, generateImagen, getAgriculturalPromptSuggestions } from '../services/geminiService';
import { VisualResult, AspectRatio, ImageStyle } from '../types';
import { useDebounce } from '../hooks/useDebounce';

const VisualizerDashboard: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const debouncedPrompt = useDebounce(prompt, 500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [images, setImages] = useState<VisualResult[]>([]);
  const [error, setError] = useState('');
  const [liveIntentTags, setLiveIntentTags] = useState<string[]>([]);
  const [isAnalyzingIntent, setIsAnalyzingIntent] = useState(false);
  
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Generation Settings
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('16:9');
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('photorealistic');
  const [activeTab, setActiveTab] = useState<'research' | 'render'>('research');

  useEffect(() => {
    let isMounted = true;
    const fetchIntent = async () => {
      if (debouncedPrompt.length > 5) {
        setIsAnalyzingIntent(true);
        const tags = await getSemanticIntent(debouncedPrompt);
        if (isMounted) {
          setLiveIntentTags(tags);
          setIsAnalyzingIntent(false);
        }
      } else {
        setLiveIntentTags([]);
      }
    };
    
    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);
      const suggestions = await getAgriculturalPromptSuggestions(debouncedPrompt);
      if (isMounted) {
        setPromptSuggestions(suggestions);
        setIsLoadingSuggestions(false);
      }
    };

    fetchIntent();
    fetchSuggestions();
    
    return () => { isMounted = false; };
  }, [debouncedPrompt]);

  const handleSemanticGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');
    setCurrentStep('Mengaktifkan Semantic Engine...');
    
    try {
      const result = await generateDeepVisual(prompt, (step) => setCurrentStep(step));
      const newResult: VisualResult = {
        url: result.imageUrl,
        prompt: prompt,
        insight: result.insight,
        timestamp: new Date(),
        semanticTags: result.semanticTags
      };
      setImages(prev => [newResult, ...prev]);
      setPrompt('');
      setLiveIntentTags([]);
    } catch (err) {
      setError('Analisis Semantik gagal. Periksa koneksi atau kueri Anda.');
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const handleProfessionalRender = async (customPrompt?: string, style: ImageStyle = selectedStyle, ratio: AspectRatio = selectedRatio) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim()) return;
    
    // Check if AI Studio key selection is needed
    if (typeof window.aistudio !== 'undefined') {
       const hasKey = await window.aistudio.hasSelectedApiKey();
       if (!hasKey) {
          const confirm = window.confirm("Render Masterpiece membutuhkan API Key berbayar untuk kualitas 8K. Apakah Anda ingin memilih API Key sekarang?");
          if (confirm) {
             await window.aistudio.openSelectKey();
          } else {
             return;
          }
       }
    }

    setIsGenerating(true);
    setError('');
    setCurrentStep('Inisialisasi Imagen 4 Pipeline...');
    
    try {
      const imageUrl = await generateImagen(targetPrompt, style, ratio);
      const newResult: VisualResult = {
        url: imageUrl,
        prompt: targetPrompt,
        insight: `Render profesional menggunakan model Imagen 4.0 dengan gaya ${style.replace('_', ' ')}.`,
        timestamp: new Date(),
        semanticTags: liveIntentTags.length > 0 ? liveIntentTags : ['Masterpiece', 'Imagen', 'Render'],
        style: style,
        ratio: ratio
      };
      setImages(prev => [newResult, ...prev]);
      if (!customPrompt) setPrompt('');
      setLiveIntentTags([]);
    } catch (err: any) {
      if (err.message?.includes('entity was not found')) {
         setError("Project API Key tidak valid. Silakan pilih API Key dari project berbayar.");
         if (typeof window.aistudio !== 'undefined') await window.aistudio.openSelectKey();
      } else {
         setError('Gagal merender Masterpiece. Pastikan kueri mematuhi kebijakan konten.');
      }
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const handleQuickRender = () => {
    handleProfessionalRender(prompt, 'photorealistic', '16:9');
  };

  const handleAddSuggestion = (text: string) => {
    setPrompt(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return text;
      if (trimmed.endsWith(',') || trimmed.endsWith('.')) return `${trimmed} ${text}`;
      return `${trimmed}, ${text}`;
    });
  };

  const styles: { id: ImageStyle; label: string; icon: string }[] = [
    { id: 'photorealistic', label: 'Realistic', icon: '📸' },
    { id: 'scientific_diagram', label: 'Diagram', icon: '📊' },
    { id: 'digital_art', label: 'Modern Art', icon: '⚡' },
    { id: 'botanical_illustration', label: 'Botanical', icon: '🌿' },
    { id: 'vintage_plate', label: 'Vintage', icon: '📜' },
    { id: 'satellite', label: 'Satellite', icon: '🛰️' }
  ];

  return (
    <div className="h-full flex flex-col space-y-6 animate-message overflow-y-auto pb-20 p-4 lg:p-8">
      {/* Header */}
      <div className="bg-slate-900 dark:bg-black p-8 lg:p-10 rounded-[2.5rem] text-white shadow-2xl border-b-8 border-emerald-500 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-8 opacity-20">
           <svg className="w-40 h-40 animate-float" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
             <span className="px-3 py-1 bg-emerald-500 text-slate-900 text-[8px] font-black uppercase rounded-full tracking-widest">Vision Lab</span>
             <span className="px-3 py-1 bg-white/10 text-white text-[8px] font-black uppercase rounded-full tracking-widest">Masterpiece Render Active</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black italic tracking-tighter leading-none">Agri-Vision Semantic Hub</h2>
          <div className="mt-8 flex bg-white/10 p-1 rounded-2xl w-fit border border-white/10 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('research')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'research' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              Semantic Research
            </button>
            <button 
              onClick={() => setActiveTab('render')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'render' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              Masterpiece Render
            </button>
          </div>
        </div>
      </div>

      {/* Settings & Input */}
      <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-colors">
        
        {activeTab === 'render' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Ratio Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Aspect Ratio</label>
              <div className="flex flex-wrap gap-2">
                {(['1:1', '16:9', '4:3', '9:16', '3:4'] as AspectRatio[]).map(r => (
                  <button 
                    key={r}
                    onClick={() => setSelectedRatio(r)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${selectedRatio === r ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 dark:text-slate-500'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block ml-1">Visual Style</label>
              <div className="grid grid-cols-3 gap-2">
                {styles.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${selectedStyle === s.id ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500' : 'bg-slate-50 dark:bg-slate-800 border-transparent'}`}
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span className={`text-[8px] font-black uppercase mt-1 tracking-tighter ${selectedStyle === s.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {activeTab === 'research' ? 'Semantic Research Query' : 'Masterpiece Prompt'}
            </label>
            {(liveIntentTags.length > 0 || isAnalyzingIntent) && (
              <div className="flex items-center space-x-2">
                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Intent:</span>
                {isAnalyzingIntent ? <span className="text-[8px] animate-pulse">...</span> : 
                  liveIntentTags.map((t, idx) => <span key={idx} className="text-[8px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">#{t}</span>)
                }
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative flex flex-col space-y-3">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeTab === 'research' ? "Jelaskan topik riset Anda untuk analisis semantik..." : "Visual masterpiece apa yang ingin Anda ciptakan?"}
                className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/20 focus:border-emerald-500 resize-none h-28 transition-all dark:text-slate-100"
              />
              
              {/* Semantic Expansion Suggestions */}
              {activeTab === 'research' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saran Ekspansi Semantik:</p>
                    {isLoadingSuggestions && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAddSuggestion(suggestion)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[9px] font-bold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all shadow-sm flex items-center space-x-2 group"
                      >
                        <span className="text-emerald-500 group-hover:scale-125 transition-transform">+</span>
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleQuickRender}
                  disabled={isGenerating || !prompt.trim()}
                  className={`flex-1 py-3 px-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border-b-4 flex items-center justify-center space-x-2 ${
                    isGenerating || !prompt.trim()
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-900 text-white border-black hover:bg-slate-800 shadow-lg'
                  }`}
                >
                  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Quick HD Render (16:9 Photorealistic)</span>
                </button>
              </div>
            </div>
            
            <button 
              onClick={activeTab === 'research' ? handleSemanticGenerate : handleProfessionalRender}
              disabled={isGenerating || !prompt.trim()}
              className={`sm:w-64 py-4 rounded-3xl font-black text-xs lg:text-sm uppercase tracking-widest transition-all border-b-8 flex flex-col items-center justify-center space-y-2 ${
                isGenerating || !prompt.trim()
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700'
                  : 'bg-emerald-700 text-white border-emerald-900 hover:bg-emerald-800 active:translate-y-2 active:border-b-0 shadow-2xl group'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="mt-2 text-[10px]">{currentStep}</span>
                </>
              ) : (
                <>
                  <svg className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {activeTab === 'research' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    )}
                  </svg>
                  <span>{activeTab === 'research' ? 'Analyze Meaning' : 'Render Masterpiece'}</span>
                </>
              )}
            </button>
          </div>
          {error && <p className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 animate-shake">{error}</p>}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-10">
        <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.3em]">Visual Research Artifacts</h3>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{images.length} Knowledge Nodes</span>
        </div>

        {images.length === 0 && !isGenerating && (
          <div className="p-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
             <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-10 w-10 text-slate-200 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <p className="text-[11px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Gunakan mode Render untuk hasil visual terbaik</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-12">
          {images.map((img, i) => (
            <div key={i} className="group flex flex-col lg:flex-row bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 animate-message">
              <div className="lg:w-2/3 relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img src={img.url} alt={img.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-6 left-6 flex space-x-2">
                   {img.style && <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[8px] font-black rounded-full uppercase border border-white/20">{img.style.replace('_', ' ')}</span>}
                   {img.ratio && <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[8px] font-black rounded-full uppercase border border-white/20">{img.ratio}</span>}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                  <a href={img.url} download={`agri_vision_${i}.png`} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-2xl flex items-center space-x-3">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Download HD Masterpiece</span>
                  </a>
                </div>
              </div>

              <div className="lg:w-1/3 p-8 lg:p-10 flex flex-col justify-between bg-slate-50 dark:bg-slate-800/50 border-l border-slate-100 dark:border-slate-800">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">{img.style ? 'Imagen 4 Render' : 'Semantic Research'}</span>
                     <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">{img.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="space-y-3">
                     <h4 className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase">Artifact Prompt:</h4>
                     <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic truncate">"{img.prompt}"</p>
                     <div className="flex flex-wrap gap-2 pt-1">
                        {img.semanticTags.map((tag, tIdx) => (
                          <span key={tIdx} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">#{tag}</span>
                        ))}
                     </div>
                  </div>

                  <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                     <h4 className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase mb-3 flex items-center">
                        <svg className="h-3 w-3 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        Context Insight:
                     </h4>
                     <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic line-clamp-4">
                       {img.insight}
                     </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                   <div className="w-8 h-8 bg-emerald-700 dark:bg-emerald-800 rounded-xl flex items-center justify-center text-[10px] text-white font-black shadow-md">AI</div>
                   <div>
                      <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none">Visual Engine</p>
                      <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mt-1 tracking-tighter">BBPPLembang Research Node</p>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisualizerDashboard;
