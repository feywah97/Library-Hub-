
import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import PatronRegistrationModal from './components/PatronRegistrationModal';
import AdvancedSearchModal from './components/AdvancedSearchModal';
import StatisticsModal from './components/StatisticsModal';
import AdminPatronsModal from './components/AdminPatronsModal';
import LiveVoiceSearch from './components/LiveVoiceSearch';
import GradioDashboard from './components/GradioDashboard';
import { Message, Patron, SearchFilters, SearchMode, AISettings, DeploymentStatus } from './types';
import { chatWithGemini } from './services/geminiService';
import { patronService } from './services/patronService';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<SearchMode>('expert');
  const [deployment] = useState<DeploymentStatus>({
    isLive: true,
    version: "1.0.0-stable",
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
      content: '# 🚀 Deployment Success\nSistem **BBPP Lembang Research Hub** kini berstatus **LIVE**. Semua modul pencarian (Repositori, Scholar, & Gradio) telah terintegrasi sepenuhnya.',
      timestamp: new Date(),
      suggestions: ["Riset Strategis Padi", "Cari Jurnal Hidroponik", "Open Gradio Dashboard"]
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
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      <PatronRegistrationModal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} onSuccess={(patron) => setCurrentUser(patron)} />
      <AdvancedSearchModal isOpen={isAdvancedSearchOpen} onClose={() => setIsAdvancedSearchOpen(false)} onSearch={(f) => handleSend(`[ADVANCED] Penulis: ${f.penulis}, Tahun: ${f.tahun}, Topik: ${f.topik}`)} />
      <StatisticsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} />
      <AdminPatronsModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />

      {/* Sidebar - Deployed Branding */}
      <aside className={`flex flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-500 ${activeMode === 'gradio' || activeMode === 'voice' ? 'w-96' : 'w-80'} hidden lg:flex relative z-30`}>
        <div className="p-6 border-b border-slate-100 flex flex-col items-center bg-[#1B5E20] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-20">
             <div className="w-24 h-24 border-4 border-white rounded-full"></div>
          </div>
          <div className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg leading-none">BBPP LEMBANG</div>
          <div className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2">Research Dashboard</div>
          <div className="mt-4 px-3 py-1 bg-white/10 rounded-full border border-white/20 flex items-center space-x-2">
             <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
             <span className="text-[9px] font-black text-white uppercase tracking-widest">Server: Online</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Research Utility</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => setIsStatsModalOpen(true)} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-all border border-slate-100">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📊</span>
                  <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-800">Visual Tren</span>
                </div>
                <svg className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              
              <button onClick={copyShareLink} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all border border-slate-100">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🔗</span>
                  <span className="text-xs font-bold text-slate-600 group-hover:text-blue-800">Bagikan Hub</span>
                </div>
                <svg className="h-4 w-4 text-slate-300 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-red-500 pl-3">Backend & Admin</h3>
            <button 
              onClick={() => setIsAdminModalOpen(true)} 
              className="w-full flex items-center space-x-3 p-4 bg-red-50/50 rounded-2xl hover:bg-red-50 transition-all border border-red-100 group shadow-sm"
            >
              <div className="p-2 bg-red-100 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-red-800 uppercase leading-none">Panel Admin</p>
                <p className="text-[8px] font-bold text-red-400 uppercase mt-1">Kelola Keanggotaan</p>
              </div>
            </button>
          </div>

          {(activeMode === 'gradio' || activeMode === 'voice') && (
            <div className="space-y-6 animate-message">
              <h3 className="text-[10px] font-black text-blue-800 uppercase tracking-widest border-l-4 border-blue-500 pl-3">AI Configurator</h3>
              <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-6">
                <div>
                  <label className="flex justify-between text-[9px] font-black text-blue-600 uppercase mb-3">
                    <span>Creativity (Temp)</span>
                    <span>{aiSettings.temperature}</span>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={aiSettings.temperature} 
                    onChange={e => setAiSettings({...aiSettings, temperature: parseFloat(e.target.value)})}
                    className="w-full accent-blue-600 h-1 bg-blue-200 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="flex justify-between text-[9px] font-black text-blue-600 uppercase mb-3">
                    <span>Top P</span>
                    <span>{aiSettings.topP}</span>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={aiSettings.topP} 
                    onChange={e => setAiSettings({...aiSettings, topP: parseFloat(e.target.value)})}
                    className="w-full accent-blue-600 h-1 bg-blue-200 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="flex justify-between text-[9px] font-black text-blue-600 uppercase mb-3">
                    <span>Research Power</span>
                    <span>{Math.round(aiSettings.thinkingBudget / 1024)}K</span>
                  </label>
                  <input 
                    type="range" min="0" max="32768" step="1024" 
                    value={aiSettings.thinkingBudget} 
                    onChange={e => setAiSettings({...aiSettings, thinkingBudget: parseInt(e.target.value)})}
                    className="w-full accent-blue-600 h-1 bg-blue-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
           <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Version Build</span>
                <span className="text-[8px] font-black text-emerald-600 uppercase">{deployment.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Environment</span>
                <span className="text-[8px] font-black text-blue-600 uppercase">Production</span>
              </div>
           </div>
           {currentUser ? (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white font-black text-[10px]">{currentUser.nama[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black truncate text-slate-700">{currentUser.nama}</p>
                  <button onClick={() => patronService.logout()} className="text-[7px] text-red-500 font-black uppercase hover:underline">Sign Out</button>
                </div>
              </div>
           ) : (
              <button onClick={() => setIsRegModalOpen(true)} className="w-full py-3 bg-[#1B5E20] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-900 transition-all border-b-4 border-emerald-950 shadow-lg">Sign In Patron</button>
           )}
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <nav className="z-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between h-16 shrink-0 shadow-sm">
          <div className="flex space-x-1 h-full overflow-x-auto scrollbar-hide">
            {[
              { id: 'regular', label: 'Chat', icon: '💬' },
              { id: 'expert', label: 'Riset Ahli', icon: '🔬' },
              { id: 'journal', label: 'Jurnal', icon: '📚' },
              { id: 'voice', label: 'Suara', icon: '🎙️' },
              { id: 'gradio', label: 'Gradio Panel', icon: '⚡' }
            ].map(mode => (
              <button 
                key={mode.id}
                onClick={() => setActiveMode(mode.id as SearchMode)}
                className={`px-4 md:px-6 h-full flex items-center space-x-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeMode === mode.id ? 'text-emerald-700 border-emerald-700 bg-emerald-50/30' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                <span className="text-lg">{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="text-[8px] font-black text-slate-400 uppercase">Uptime Status</span>
                <span className="text-[10px] font-black text-emerald-600">{deployment.uptime}</span>
             </div>
             <button 
                onClick={() => setIsAdvancedSearchOpen(true)} 
                aria-label="Cari Koleksi Digital"
                className="p-2.5 bg-slate-100 rounded-xl hover:bg-emerald-100 text-slate-600 transition-all border border-slate-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
             </button>
          </div>
        </nav>

        <div ref={scrollRef} className={`flex-1 overflow-y-auto px-4 md:px-8 py-8 scroll-smooth ${activeMode === 'gradio' || activeMode === 'voice' ? 'bg-blue-50/10' : 'bg-slate-50/20'}`}>
          <div className="max-w-4xl mx-auto pb-12 h-full">
            {activeMode === 'voice' ? (
              <LiveVoiceSearch isActive={activeMode === 'voice'} />
            ) : activeMode === 'gradio' ? (
              <GradioDashboard settings={aiSettings} />
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} onSuggestionClick={handleSend} />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-8 animate-message">
                    <div className="bg-white border-2 border-emerald-100 rounded-[2.5rem] px-8 py-6 shadow-2xl flex items-center space-x-6">
                      <div className="flex space-x-3">
                        <div className="w-2.5 h-2.5 rounded-full animate-bounce bg-emerald-600"></div>
                        <div className="w-2.5 h-2.5 rounded-full animate-bounce [animation-delay:0.2s] bg-emerald-600"></div>
                        <div className="w-2.5 h-2.5 rounded-full animate-bounce [animation-delay:0.4s] bg-emerald-600"></div>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800">
                        Engine {activeMode.toUpperCase()} Active
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {activeMode !== 'voice' && activeMode !== 'gradio' && (
          <div className="p-4 md:p-8 bg-white border-t border-slate-200 relative z-10">
            <div className="max-w-4xl mx-auto relative">
              <div className="relative flex items-end border-2 rounded-[3rem] p-4 transition-all duration-500 shadow-2xl bg-slate-50 border-slate-100 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-8 focus-within:ring-emerald-50">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Mulai riset Anda di sini..."
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-base py-3 px-6 resize-none max-h-40 text-slate-800 font-semibold"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  aria-label="Kirim kueri riset"
                  className={`p-5 rounded-full transition-all flex-shrink-0 ${
                    input.trim() && !isLoading 
                      ? 'bg-emerald-700 text-white shadow-2xl hover:scale-110 active:scale-95 hover:bg-emerald-800' 
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <svg className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
              </div>
              <div className="absolute -top-3 left-10">
                 <span className="bg-emerald-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white shadow-md">Stable Node</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
