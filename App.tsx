
import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import PatronRegistrationModal from './components/PatronRegistrationModal';
import AdvancedSearchModal from './components/AdvancedSearchModal';
import StatisticsModal from './components/StatisticsModal';
import AdminPatronsModal from './components/AdminPatronsModal';
import SystemStatusModal from './components/SystemStatusModal';
import SearchHistoryDropdown from './components/SearchHistoryDropdown';
import LiveVoiceSearch from './components/LiveVoiceSearch';
import GradioDashboard from './components/GradioDashboard';
import VisualizerDashboard from './components/VisualizerDashboard';
import AgriMetricsDashboard from './components/AgriMetricsDashboard';
import WeatherDashboard from './components/WeatherDashboard';
import ThemeToggle from './components/ThemeToggle';
import NotificationCenter from './components/NotificationCenter';
import { Message, Patron, SearchMode, AISettings, DeploymentStatus, Notification } from './types';
import { chatWithGemini, getSmartSearchSuggestions } from './services/geminiService';
import { patronService } from './services/patronService';
import { searchHistoryService } from './services/searchHistoryService';
import { notificationService } from './services/notificationService';
import { metadata } from './metadata';
import { useDebounce } from './hooks/useDebounce';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<SearchMode>('expert');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [deployment] = useState<DeploymentStatus>({
    isLive: metadata.deployment.status === 'active',
    version: metadata.version,
    uptime: "99.9%"
  });

  const [aiSettings, setAiSettings] = useState<AISettings>({
    temperature: 0.3,
    thinkingBudget: 24000,
    topP: 0.95
  });
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `# 🚀 Deployment Success\nSistem **BBPP Lembang Research Hub** kini berstatus **LIVE**. \n\nSemua modul pencarian (Repositori, Scholar, Standar Nasional Indonesia, & Python AI) telah terintegrasi sepenuhnya dengan modul riset mendalam. \n\nVersi Sistem: \`${metadata.version}\``,
      timestamp: new Date(),
      suggestions: ["Riset SNI Alat Mesin Pertanian", "Cari Jurnal Hidroponik", "SNI Keamanan Pangan Buah"]
    }
  ]);
  
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 800); // Increased debounce to reduce quota pressure
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<Patron | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const notifs = notificationService.getNotifications();
    setUnreadNotifCount(notifs.filter(n => !n.isRead).length);
  }, [isNotifOpen]);

  useEffect(() => {
    let isMounted = true;
    const fetchSuggestions = async () => {
      // Don't fetch if generating or input is too short
      if (debouncedInput.length >= 4 && !isLoading) {
        setIsLoadingSuggestions(true);
        try {
          const suggestions = await getSmartSearchSuggestions(debouncedInput, activeMode);
          if (isMounted) {
            setSmartSuggestions(suggestions);
          }
        } catch (err) {
          console.warn("Caught suggestion fetch error in UI, but handled in service");
        } finally {
          if (isMounted) setIsLoadingSuggestions(false);
        }
      } else {
        setSmartSuggestions([]);
      }
    };
    fetchSuggestions();
    return () => { isMounted = false; };
  }, [debouncedInput, activeMode]);

  useEffect(() => {
    const user = patronService.getCurrentUser();
    if (user) setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (customMessage?: string) => {
    const messageText = customMessage || input;
    if (!messageText.trim() || isLoading) return;

    setMessages(prev => prev.map(m => m.role === 'assistant' ? { ...m, suggestions: [] } : m));
    setSmartSuggestions([]);
    setIsHistoryOpen(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);

    searchHistoryService.saveQuery(messageText);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const chatResponse = await chatWithGemini(
        messageText, 
        history, 
        activeMode,
        activeMode === 'gradio' ? aiSettings : undefined
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: chatResponse.text,
        timestamp: new Date(),
        mode: activeMode,
        suggestions: chatResponse.suggestions,
        groundingSources: chatResponse.groundingSources
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat engine error:", err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Maaf, terjadi gangguan pada server deployment. Mohon periksa koneksi Anda.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-500">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center bg-[#1B5E20] relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-2 opacity-20">
           <div className="w-24 h-24 border-4 border-white rounded-full animate-pulse-slow"></div>
        </div>
        <div className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg leading-none uppercase">BBPP LEMBANG</div>
        <div className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2 italic">Research Hub AI</div>
        <div className="mt-4 px-3 py-1 bg-white/10 rounded-full border border-white/20 flex items-center space-x-2">
           <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
           <span className="text-[9px] font-black text-white uppercase tracking-widest">System: Live</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-8 scrollbar-hide">
        {currentUser?.role === 'admin' && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest border-l-4 border-indigo-500 pl-3">Administrator Control</h3>
            <button 
              onClick={() => { setIsAdminModalOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full group flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-100 dark:border-indigo-900/50 shadow-sm active:scale-95"
            >
              <div className="flex items-center space-x-3 transition-transform group-hover:translate-x-1">
                <span className="text-xl">🔐</span>
                <div className="text-left">
                  <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-200 uppercase">Database Anggota</p>
                  <p className="text-[8px] font-bold text-indigo-500 dark:text-indigo-400 uppercase">Manage Patrons</p>
                </div>
              </div>
              <svg className="h-4 w-4 text-indigo-300 group-hover:text-indigo-600 dark:text-indigo-700 dark:group-hover:text-indigo-400 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2V6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </button>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Research Utility</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => { setIsStatsModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-slate-100 dark:border-slate-800 active:scale-[0.98]">
              <div className="flex items-center space-x-3 transition-transform group-hover:translate-x-1">
                <span className="text-xl">📊</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">Tren Peminjaman</span>
              </div>
              <svg className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={() => { setIsSystemModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-slate-100 dark:border-slate-800 active:scale-[0.98]">
              <div className="flex items-center space-x-3 transition-transform group-hover:translate-x-1">
                <span className="text-xl">📡</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">Status Sistem</span>
              </div>
              <svg className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Search Modules</h3>
          <div className="flex flex-col gap-2">
            {(['regular', 'expert', 'journal', 'sni', 'python', 'gradio', 'visualizer', 'metrics', 'weather', 'voice'] as SearchMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { setActiveMode(mode); setIsMobileMenuOpen(false); }}
                className={`flex items-center space-x-3 p-4 rounded-2xl transition-all border-2 active:scale-95 group/mode ${
                  activeMode === mode 
                    ? mode === 'visualizer' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-500 text-orange-900 dark:text-orange-200 shadow-sm' : 
                      mode === 'weather' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm' :
                      mode === 'metrics' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500 text-yellow-900 dark:text-yellow-200 shadow-sm' : 
                      mode === 'sni' ? 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-900 dark:text-red-200 shadow-sm' :
                      'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm' 
                    : 'bg-white dark:bg-slate-800/30 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-100 dark:hover:border-slate-700'
                }`}
              >
                <span className="text-xl transition-transform group-hover/mode:scale-125 group-hover/mode:rotate-6">
                  {mode === 'regular' ? '🤖' : mode === 'expert' ? '🔍' : mode === 'journal' ? '📚' : mode === 'python' ? '🐍' : mode === 'gradio' ? '⚡' : mode === 'visualizer' ? '🎨' : mode === 'metrics' ? '📈' : mode === 'weather' ? '🌦️' : mode === 'voice' ? '🎙️' : '📜'}
                </span>
                <div className="text-left transition-all group-hover/mode:translate-x-1">
                  <p className="text-[11px] font-black uppercase tracking-tight">
                    {mode === 'sni' ? 'Standar Nasional (SNI)' : mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
                  </p>
                  <p className="text-[8px] font-bold opacity-60 uppercase">
                    {mode === 'regular' ? 'General AI' : mode === 'expert' ? 'Technical Research' : mode === 'journal' ? 'Academic Sources' : mode === 'python' ? 'AI Python Engineer' : mode === 'gradio' ? 'ML Inference' : mode === 'visualizer' ? 'Data Vision' : mode === 'metrics' ? 'Agri-Metrics' : mode === 'weather' ? 'Weather Hub' : mode === 'voice' ? 'Live Voice' : 'Deep BSN Research'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 lg:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
        {currentUser ? (
          <div className="flex items-center space-x-4 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group/user transition-all hover:border-emerald-500/30">
             {currentUser.role === 'admin' && (
               <div className="absolute top-0 right-0 bg-yellow-400 text-[6px] font-black px-2 py-0.5 uppercase tracking-widest rotate-45 translate-x-3 -translate-y-0 shadow-sm transition-transform group-hover/user:scale-110">ADMIN</div>
             )}
             <div className={`w-8 h-8 lg:w-10 lg:h-10 transition-transform group-hover/user:scale-110 ${currentUser.role === 'admin' ? 'bg-indigo-700' : 'bg-emerald-700'} text-white rounded-xl flex items-center justify-center font-black text-xs lg:text-base`}>
               {currentUser.nama[0]}
             </div>
             <div className="overflow-hidden">
               <p className="text-[10px] lg:text-xs font-black text-slate-800 dark:text-slate-200 truncate">{currentUser.nama}</p>
               <button onClick={() => patronService.logout()} className="text-[8px] lg:text-[9px] font-bold text-red-500 uppercase tracking-widest hover:underline transition-opacity group-hover/user:opacity-100">Keluar</button>
             </div>
          </div>
        ) : (
          <button 
            onClick={() => { setIsRegModalOpen(true); setIsMobileMenuOpen(false); }}
            className="w-full py-4 bg-[#1B5E20] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border-b-4 border-yellow-500 hover:brightness-110 active:translate-y-1 active:border-b-0 transition-all shadow-md active:scale-[0.98]"
          >
            Registrasi Pemustaka
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-200 w-full relative transition-colors duration-500">
      <PatronRegistrationModal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} onSuccess={(patron) => setCurrentUser(patron)} />
      <AdvancedSearchModal isOpen={isAdvancedSearchOpen} onClose={() => setIsAdvancedSearchOpen(false)} onSearch={(f) => handleSend(`[ADVANCED] Penulis: ${f.penulis}, Tahun: ${f.tahun}, Topik: ${f.topik}`)} />
      <StatisticsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} />
      <SystemStatusModal isOpen={isSystemModalOpen} onClose={() => setIsSystemModalOpen(false)} />
      
      {currentUser?.role === 'admin' && (
        <AdminPatronsModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
      )}

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-500 opacity-100 animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl lg:shadow-xl transition-transform duration-500 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-72 lg:w-80 shrink-0`}>
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col relative bg-white dark:bg-slate-950 overflow-hidden transition-colors duration-500">
        <header className="h-16 lg:h-20 border-b border-slate-100 dark:border-slate-900 px-4 lg:px-8 flex items-center justify-between bg-white dark:bg-slate-950 shrink-0 relative z-20 shadow-sm transition-colors duration-500">
           <div className="flex items-center space-x-3 lg:space-x-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 lg:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all active:scale-90"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
              <div className={`w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-500'}`}></div>
              <button 
                onClick={() => setIsSystemModalOpen(true)}
                className="text-left group active:scale-95 transition-transform"
              >
                <h2 className="text-[11px] lg:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest truncate max-w-[120px] md:max-w-none group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{activeMode === 'sni' ? 'Standar Nasional Indonesia' : activeMode} Research Hub</h2>
                <p className="text-[8px] lg:text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight lg:tracking-[0.2em] italic shrink-0 transition-opacity group-hover:opacity-100">Active Knowledge Node</p>
              </button>
           </div>
           
           <div className="flex items-center space-x-2 lg:space-x-6">
             <div className="relative">
               <button 
                 onClick={() => setIsNotifOpen(!isNotifOpen)}
                 className={`p-2 lg:p-3 rounded-xl lg:rounded-2xl transition-all active:scale-90 relative ${isNotifOpen ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
               >
                 <svg className="h-5 w-5 lg:h-6 lg:w-6 transition-transform hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                 </svg>
                 {unreadNotifCount > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-4 w-4 lg:h-5 lg:w-5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-4 w-4 lg:h-5 lg:w-5 bg-emerald-500 items-center justify-center text-[7px] lg:text-[8px] font-black text-white">{unreadNotifCount}</span>
                   </span>
                 )}
               </button>
               <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
             </div>

             <ThemeToggle isDarkMode={isDarkMode} toggle={() => setIsDarkMode(!isDarkMode)} />

             <button onClick={() => setIsAdvancedSearchOpen(true)} className="p-2 lg:px-4 lg:py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm">
               <span className="hidden lg:inline">Filter</span>
               <svg className="h-4 w-4 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
             </button>
             
             <div 
               className="flex flex-col items-end shrink-0 pl-1 lg:pl-0 cursor-pointer group/version transition-transform active:scale-95"
               onClick={() => setIsSystemModalOpen(true)}
             >
               <div className="flex items-center space-x-1 mb-0.5">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-[7px] lg:text-[9px] font-black text-slate-800 dark:text-slate-200 leading-none uppercase tracking-tighter group-hover/version:text-emerald-700 dark:group-hover/version:text-emerald-400 transition-colors">v{metadata.version}</p>
               </div>
               <div className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-100 dark:border-emerald-900/50 group-hover/version:bg-emerald-100 dark:group-hover/version:bg-emerald-900/50 transition-all group-hover/version:scale-105">
                  <p className="text-[6px] lg:text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter leading-none">Production Live</p>
               </div>
             </div>
           </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col relative">
          {activeMode === 'voice' ? (
            <LiveVoiceSearch isActive={true} />
          ) : activeMode === 'gradio' ? (
            <div className="p-4 lg:p-8 h-full overflow-hidden">
              <GradioDashboard settings={aiSettings} />
            </div>
          ) : activeMode === 'visualizer' ? (
            <VisualizerDashboard />
          ) : activeMode === 'metrics' ? (
            <AgriMetricsDashboard />
          ) : activeMode === 'weather' ? (
            <WeatherDashboard />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 lg:space-y-8 scroll-smooth" ref={scrollRef}>
                 {messages.map((msg, i) => (
                   <div key={msg.id} style={{ animationDelay: `${i * 0.1}s` }}>
                     <ChatMessage message={msg} onSuggestionClick={(text) => handleSend(text)} />
                   </div>
                 ))}
                 {isLoading && (
                   <div className="flex items-center space-x-3 text-slate-400 dark:text-slate-500 p-4 animate-message">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] ml-2">Menyiapkan...</span>
                   </div>
                 )}
              </div>

              <div className="p-4 lg:p-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 shrink-0 relative z-20 transition-colors duration-500">
                <div className="max-w-4xl mx-auto flex flex-col space-y-2 relative">
                  {(smartSuggestions.length > 0 || isLoadingSuggestions) && !isLoading && (
                    <div className="flex flex-wrap gap-2 px-4 animate-in fade-in slide-in-from-bottom-2 mb-2 duration-300">
                      <div className="w-full flex items-center justify-between mb-1 ml-1">
                        <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saran Pencarian Cerdas:</p>
                        {isLoadingSuggestions && (
                           <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"></div>
                              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                           </div>
                        )}
                      </div>
                      {smartSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(suggestion)}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-sm active:scale-90"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="relative group">
                    <SearchHistoryDropdown 
                      isOpen={isHistoryOpen} 
                      onClose={() => setIsHistoryOpen(false)} 
                      onSelect={(query) => {
                        setInput(query);
                        handleSend(query);
                      }} 
                    />
                    
                    <div className="flex items-end space-x-2 lg:space-x-4 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl lg:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-50 dark:focus-within:ring-emerald-950/30 transition-all duration-300">
                      <button 
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all active:scale-90 ${isHistoryOpen ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm'}`}
                        title="Riwayat Pencarian"
                      >
                        <svg className="h-5 w-5 lg:h-6 lg:w-6 transition-transform hover:rotate-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={activeMode === 'python' ? "Script Python..." : activeMode === 'sni' ? "Cari Standar Nasional Indonesia (Contoh: SNI Alsintan)..." : "Ketik riset Anda..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-3 lg:py-4 px-3 lg:px-6 resize-none max-h-32 lg:max-h-40 min-h-[48px] placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-100 transition-colors"
                        rows={1}
                      />
                      
                      <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all shadow-lg active:scale-90 ${
                          !input.trim() || isLoading 
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600' 
                            : 'bg-[#1B5E20] text-white hover:brightness-110'
                        }`}
                      >
                        <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="lg:hidden h-14 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 flex items-center justify-around px-4 shrink-0 z-30 transition-colors duration-500">
          <button onClick={() => setActiveMode('expert')} className={`flex flex-col items-center space-y-1 active:scale-90 transition-all ${activeMode === 'expert' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-[8px] font-black uppercase">Search</span>
          </button>
          <button onClick={() => setActiveMode('weather')} className={`flex flex-col items-center space-y-1 active:scale-90 transition-all ${activeMode === 'weather' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>
            <span className="text-lg leading-none">🌦️</span>
            <span className="text-[8px] font-black uppercase">Weather</span>
          </button>
          <button onClick={() => setActiveMode('metrics')} className={`flex flex-col items-center space-y-1 active:scale-90 transition-all ${activeMode === 'metrics' ? 'text-yellow-700 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-600'}`}>
            <span className="text-lg leading-none">📈</span>
            <span className="text-[8px] font-black uppercase">Metrics</span>
          </button>
          <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-600 active:scale-90 transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span className="text-[8px] font-black uppercase">Menu</span>
          </button>
        </div>
      </main>
      
      <footer className="fixed bottom-2 right-4 z-[60] hidden md:flex items-center space-x-2 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
         <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[7px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter transition-colors">
           System Engine v{metadata.version}
         </div>
      </footer>
    </div>
  );
};

export default App;
