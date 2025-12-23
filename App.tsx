
import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import PatronRegistrationModal from './components/PatronRegistrationModal';
import AdvancedSearchModal from './components/AdvancedSearchModal';
import StatisticsModal from './components/StatisticsModal';
import { Message, Patron, SearchFilters, SearchMode } from './types';
import { chatWithGemini } from './services/geminiService';
import { patronService } from './services/patronService';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<SearchMode>('expert');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Selamat datang di **BBPP Lembang Research Hub**. Silakan pilih mode di navigasi atas untuk memulai riset Anda.',
      timestamp: new Date(),
      suggestions: ["Pelajari Mode Expert", "Tentang Perpustakaan"]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
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

      const chatResponse = await chatWithGemini(messageText, history, activeMode);

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
        content: "Maaf, terjadi kendala teknis. Mohon ulangi kembali.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setActiveMode('expert'); 
    let queryParts = [];
    if (filters.penulis) queryParts.push(`PENULIS: "${filters.penulis}"`);
    if (filters.tahun) queryParts.push(`TAHUN: ${filters.tahun}`);
    if (filters.topik) queryParts.push(`TOPIK: "${filters.topik}"`);
    
    const advancedQuery = `[ADVANCED RESEARCH] Jalankan kueri riset dengan parameter: ${queryParts.join(' AND ')}. Berikan laporan formal mendalam.`;
    handleSend(advancedQuery);
  };

  return (
    <div className="flex h-screen bg-emerald-50/30 overflow-hidden text-slate-800">
      <PatronRegistrationModal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} onSuccess={(patron) => setCurrentUser(patron)} />
      <AdvancedSearchModal isOpen={isAdvancedSearchOpen} onClose={() => setIsAdvancedSearchOpen(false)} onSearch={handleAdvancedSearch} />
      <StatisticsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} />

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 bg-white border-r border-emerald-100">
        <div className="p-8 border-b border-emerald-100 flex flex-col items-center bg-[#1B5E20]">
          <div className="relative mb-6 flex flex-col items-center text-center">
             <div className="text-3xl font-black text-white italic tracking-tighter drop-shadow-md">BBPP LEMBANG</div>
             <div className="text-sm font-black text-yellow-400 uppercase tracking-[0.2em] mt-1">Library Hub</div>
          </div>
          <p className="text-[10px] text-white/70 uppercase font-black tracking-widest px-4 py-1.5 bg-white/10 rounded-full border border-white/20">Digital Knowledge Center</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          <div className="px-2">
            <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-4 border-l-4 border-yellow-400 pl-3">Quick Navigation</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setIsStatsModalOpen(true)}
                className="w-full text-left p-4 rounded-2xl text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-all flex items-center justify-between border border-emerald-50"
              >
                <span>Visualisasi Tren</span>
                <span>📊</span>
              </button>
              <button 
                onClick={() => setIsRegModalOpen(true)}
                className="w-full text-left p-4 rounded-2xl text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-all flex items-center justify-between border border-emerald-50"
              >
                <span>Status Keanggotaan</span>
                <span>👤</span>
              </button>
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Saran Topik Riset</h4>
            <div className="flex flex-wrap gap-2">
              {['Hidroponik', 'Melon', 'Padi Gogo', 'Pasca Panen'].map(tag => (
                <button key={tag} onClick={() => handleSend(`Informasi tentang ${tag}`)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold hover:border-emerald-500 hover:text-emerald-700 transition-all">#{tag}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-emerald-50 bg-emerald-50/20 text-center">
           {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-sm">{currentUser.nama[0]}</div>
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-black truncate">{currentUser.nama}</p>
                  <button onClick={() => patronService.logout()} className="text-[8px] text-red-500 font-black uppercase">Logout</button>
                </div>
              </div>
           ) : (
             <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase italic">BBPP Lembang Library v2.5</p>
           )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl relative">
        {/* Navigation Bar */}
        <nav className="z-20 bg-white border-b border-emerald-100 px-4 md:px-8 flex items-center justify-between h-16 shrink-0 sticky top-0">
          <div className="flex space-x-1 h-full overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveMode('regular')}
              className={`px-4 md:px-6 h-full flex items-center space-x-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeMode === 'regular' ? 'text-emerald-600 border-emerald-600 bg-emerald-50/50' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <span className="text-lg">💬</span>
              <span className="hidden sm:inline">Pencarian Biasa</span>
              <span className="sm:hidden">Biasa</span>
            </button>
            <button 
              onClick={() => setActiveMode('expert')}
              className={`px-4 md:px-6 h-full flex items-center space-x-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeMode === 'expert' ? 'text-[#1B5E20] border-[#1B5E20] bg-emerald-50' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <span className="text-lg">🔬</span>
              <span className="hidden sm:inline">Expert Research Assistant</span>
              <span className="sm:hidden">Expert</span>
            </button>
            <button 
              onClick={() => setActiveMode('journal')}
              className={`px-4 md:px-6 h-full flex items-center space-x-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeMode === 'journal' ? 'text-blue-700 border-blue-700 bg-blue-50' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <span className="text-lg">📚</span>
              <span>Jurnal/Modul</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4 ml-4">
            {activeMode === 'expert' && (
              <button 
                onClick={() => setIsAdvancedSearchOpen(true)}
                className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-emerald-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg border-b-4 border-emerald-950 active:translate-y-1 active:border-b-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Filters</span>
              </button>
            )}
            <div className="hidden sm:block h-4 w-px bg-slate-200"></div>
            <div className="hidden sm:flex items-center space-x-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth">
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onSuggestionClick={handleSend} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-8 animate-message">
                <div className="bg-white border-2 border-emerald-100 rounded-3xl px-6 py-5 shadow-xl flex items-center space-x-5">
                  <div className="flex space-x-2">
                    <div className={`w-2 h-2 rounded-full animate-bounce ${activeMode === 'expert' ? 'bg-[#1B5E20]' : activeMode === 'journal' ? 'bg-blue-600' : 'bg-emerald-400'}`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s] ${activeMode === 'expert' ? 'bg-[#1B5E20]' : activeMode === 'journal' ? 'bg-blue-600' : 'bg-emerald-400'}`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s] ${activeMode === 'expert' ? 'bg-[#1B5E20]' : activeMode === 'journal' ? 'bg-blue-600' : 'bg-emerald-400'}`}></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {activeMode === 'expert' ? 'Expert Engine: Deep Thinking...' : activeMode === 'journal' ? 'Scanning Scholarly Databases...' : 'Mencari jawaban...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-8 border-t border-emerald-100 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] p-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 shadow-inner">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder={
                  activeMode === 'expert' ? "Ketik kueri Boolean (Padi AND Organik)..." : 
                  activeMode === 'journal' ? "Cari jurnal/modul (contoh: Jurnal Hidroponik)..." : 
                  "Tanyakan sesuatu tentang perpustakaan..."
                }
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-5 resize-none max-h-32 text-slate-800 font-medium"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`p-4 rounded-[1.8rem] transition-all ${
                  input.trim() && !isLoading 
                    ? (activeMode === 'expert' ? 'bg-emerald-900 shadow-emerald-200' : activeMode === 'journal' ? 'bg-blue-700 shadow-blue-200' : 'bg-emerald-600 shadow-emerald-100') + ' text-white shadow-xl hover:scale-105 active:scale-95' 
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row justify-between items-center px-6 gap-2">
               <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic text-center">
                  Mode: {
                    activeMode === 'expert' ? 'Expert Research Assistant' : 
                    activeMode === 'journal' ? 'Jurnal & Modul (Google Scholar)' : 
                    'Pencarian Biasa'
                  }
               </p>
               <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">
                 {activeMode === 'journal' ? 'SCHOLAR SEARCH ACTIVE' : 'GROUNDING: ON'}
               </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
