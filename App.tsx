
import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import PatronRegistrationModal from './components/PatronRegistrationModal';
import AdvancedSearchModal from './components/AdvancedSearchModal';
import StatisticsModal from './components/StatisticsModal';
import AdminPatronsModal from './components/AdminPatronsModal';
import LiveVoiceSearch from './components/LiveVoiceSearch';
import GradioDashboard from './components/GradioDashboard';
import { Message, Patron, SearchMode, AISettings, DeploymentStatus } from './types';
import { chatWithGemini } from './services/geminiService';
import { patronService } from './services/patronService';
import { metadata } from './metadata';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<SearchMode>('expert');
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
      content: `# 🚀 Deployment Success\nSistem **BBPP Lembang Research Hub** kini berstatus **LIVE**. Semua modul pencarian (Repositori, Scholar, & Python AI) telah terintegrasi sepenuhnya. \n\nVersi Sistem: \`${metadata.version}\``,
      timestamp: new Date(),
      suggestions: ["Buat Script Analisis Padi", "Cari Jurnal Hidroponik", "Open Gradio Dashboard"]
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Patron | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

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

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Public link copied to clipboard!");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 w-full">
      <PatronRegistrationModal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} onSuccess={(patron) => setCurrentUser(patron)} />
      <AdvancedSearchModal isOpen={isAdvancedSearchOpen} onClose={() => setIsAdvancedSearchOpen(false)} onSearch={(f) => handleSend(`[ADVANCED] Penulis: ${f.penulis}, Tahun: ${f.tahun}, Topik: ${f.topik}`)} />
      <StatisticsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} />
      <AdminPatronsModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />

      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-500 ${activeMode === 'gradio' || activeMode === 'voice' ? 'w-96' : 'w-80'} hidden lg:flex relative z-30`}>
        <div className="p-6 border-b border-slate-100 flex flex-col items-center bg-[#1B5E20] relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-2 opacity-20">
             <div className="w-24 h-24 border-4 border-white rounded-full"></div>
          </div>
          <div className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg leading-none uppercase">BBPP LEMBANG</div>
          <div className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2 italic">Research Hub AI</div>
          <div className="mt-4 px-3 py-1 bg-white/10 rounded-full border border-white/20 flex items-center space-x-2">
             <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
             <span className="text-[9px] font-black text-white uppercase tracking-widest">System: Live</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Research Utility</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => setIsStatsModalOpen(true)} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-all border border-slate-100">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📊</span>
                  <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-800">Tren Peminjaman</span>
                </div>
                <svg className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Search Modules</h3>
            <div className="flex flex-col gap-2">
              {(['regular', 'expert', 'journal', 'python', 'gradio', 'voice'] as SearchMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`flex items-center space-x-3 p-4 rounded-2xl transition-all border-2 ${
                    activeMode === mode 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md' 
                      : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">
                    {mode === 'regular' ? '🤖' : mode === 'expert' ? '🔍' : mode === 'journal' ? '📚' : mode === 'python' ? '🐍' : mode === 'gradio' ? '⚡' : '🎙️'}
                  </span>
                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase tracking-tight">{mode.charAt(0).toUpperCase() + mode.slice(1)} Mode</p>
                    <p className="text-[8px] font-bold opacity-60 uppercase">
                      {mode === 'regular' ? 'General AI' : mode === 'expert' ? 'Technical Research' : mode === 'journal' ? 'Academic Sources' : mode === 'python' ? 'AI Python Engineer' : mode === 'gradio' ? 'ML Inference' : 'Live Voice'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
          {currentUser ? (
            <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
               <div className="w-10 h-10 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-black">{currentUser.nama[0]}</div>
               <div className="overflow-hidden">
                 <p className="text-xs font-black text-slate-800 truncate">{currentUser.nama}</p>
                 <button onClick={() => patronService.logout()} className="text-[9px] font-bold text-red-500 uppercase tracking-widest hover:underline">Keluar</button>
               </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsRegModalOpen(true)}
              className="w-full py-4 bg-[#1B5E20] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border-b-4 border-yellow-500 hover:brightness-110 active:translate-y-1 active:border-b-0 transition-all"
            >
              Registrasi Pemustaka
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-white">
        {activeMode === 'voice' ? (
          <LiveVoiceSearch isActive={true} />
        ) : activeMode === 'gradio' ? (
          <div className="p-8 h-full overflow-hidden">
            <GradioDashboard settings={aiSettings} />
          </div>
        ) : (
          <>
            <header className="h-20 border-b border-slate-100 px-8 flex items-center justify-between bg-white shrink-0 relative z-20 shadow-sm">
               <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{activeMode} Research Hub</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">Active Knowledge Node</p>
                  </div>
               </div>
               <div className="flex items-center space-x-4">
                 <button onClick={() => setIsAdvancedSearchOpen(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Filter</button>
                 <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>
                 <div className="text-right hidden sm:block">
                   <p className="text-[10px] font-black text-slate-800 leading-none">V.{metadata.version}</p>
                   <p className="text-[8px] font-bold text-emerald-600 uppercase mt-1 tracking-tighter">Production</p>
                 </div>
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 scroll-smooth" ref={scrollRef}>
               {messages.map(msg => (
                 <ChatMessage key={msg.id} message={msg} onSuggestionClick={(text) => handleSend(text)} />
               ))}
               {isLoading && (
                 <div className="flex items-center space-x-3 text-slate-400 p-4 animate-pulse">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] ml-2">Menyiapkan Tanggapan...</span>
                 </div>
               )}
            </div>

            <div className="p-8 bg-white border-t border-slate-100 shrink-0 relative z-20">
              <div className="max-w-4xl mx-auto flex items-end space-x-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 shadow-inner focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-50 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={activeMode === 'python' ? "Minta skrip Python untuk analisis data..." : "Ketik kueri riset pertanian Anda..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-4 px-6 resize-none max-h-40 min-h-[56px] placeholder:text-slate-400"
                  rows={1}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={`p-4 rounded-2xl transition-all shadow-lg ${
                    !input.trim() || isLoading 
                      ? 'bg-slate-200 text-slate-400' 
                      : 'bg-[#1B5E20] text-white hover:brightness-110 active:scale-95 shadow-emerald-100'
                  }`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
