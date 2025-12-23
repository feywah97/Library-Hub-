
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onSuggestionClick?: (text: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSuggestionClick }) => {
  const isAssistant = message.role === 'assistant';
  const isExpert = message.mode === 'expert';
  const isJournal = message.mode === 'journal';
  const isPython = message.mode === 'python';
  const isGradio = message.mode === 'gradio';

  const renderContent = (content: string) => {
    // Regex for various agricultural resources and assistance
    const pdfRegex = /(https?:\/\/[^\s,()]+\.pdf(?:[?#][^\s,()]*)?)/gi;
    const waRegex = /(https?:\/\/wa\.me\/6283827954312(?:[?#][^\s,()]*)?)/gi;
    const repoRegex = /(https?:\/\/repository\.pertanian\.go\.id(?:[?#][^\s,()]*)?)/gi;
    const epubRegex = /(https?:\/\/epublikasi\.pertanian\.go\.id(?:[?#][^\s,()]*)?)/gi;
    const scholarRegex = /(https?:\/\/scholar\.google\.com(?:[?#][^\s,()]*)?)/gi;
    const generalUrlRegex = /(https?:\/\/[^\s,()]+)/gi;

    const combinedRegex = /(https?:\/\/[^\s,()]+\.pdf(?:[?#][^\s,()]*)?|https?:\/\/wa\.me\/6283827954312(?:[?#][^\s,()]*)?|https?:\/\/repository\.pertanian\.go\.id(?:[?#][^\s,()]*)?|https?:\/\/epublikasi\.pertanian\.go\.id(?:[?#][^\s,()]*)?|https?:\/\/scholar\.google\.com(?:[?#][^\s,()]*)?|https?:\/\/[^\s,()]+)/gi;
    
    // Split content and replace matches with interactive UI elements
    const parts = content.split(combinedRegex);
    
    return parts.map((part, index) => {
      if (!part) return null;

      if (part.match(waRegex)) {
        const defaultText = encodeURIComponent("Halo Pustakawan BBPP Lembang, saya ingin bertanya tentang koleksi perpustakaan...");
        const finalUrl = part.includes('text=') ? part : `https://wa.me/6283827954312?text=${defaultText}`;
        
        return (
          <div key={index} className="my-4 p-5 bg-emerald-50 border-2 border-emerald-200 rounded-3xl flex items-center justify-between group hover:bg-emerald-100/50 transition-all shadow-md">
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="bg-[#25D366] p-3 rounded-2xl text-white shadow-lg">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.808 1.565 5.405l-.992 3.613 3.655-.959c.001 0 .001 0 0 0zm10.034-7.447c-.273-.136-1.615-.797-1.865-.888-.251-.091-.432-.136-.615.136-.182.273-.706.888-.865 1.07-.159.182-.319.205-.592.068-.273-.136-1.151-.424-2.193-1.353-.81-.722-1.357-1.614-1.516-1.886-.159-.273-.017-.42.12-.556.123-.122.273-.318.41-.477.136-.159.182-.273.273-.454.091-.182.045-.341-.023-.477-.068-.136-.615-1.477-.842-2.023-.222-.532-.445-.459-.615-.468-.159-.009-.341-.01-.523-.01s-.477.068-.728.341c-.25.273-.955.932-.955 2.273s.977 2.636 1.114 2.818c.136.182 1.92 2.932 4.653 4.114.65.281 1.157.449 1.551.574.653.207 1.248.178 1.717.108.523-.078 1.615-.659 1.842-1.295.227-.636.227-1.182.159-1.295-.068-.113-.25-.181-.523-.317z"/>
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-emerald-900 truncate uppercase tracking-tighter">Bantuan WhatsApp</p>
                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest italic">Pustakawan BBPP Lembang</p>
              </div>
            </div>
            <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="ml-4 px-5 py-2 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#128C7E] transition-all shadow-lg">Hubungi</a>
          </div>
        );
      }

      if (part.match(pdfRegex)) {
        return (
          <div key={index} className="my-4 p-5 bg-red-50 border border-red-100 rounded-3xl flex items-center justify-between group shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="bg-red-600 p-2 rounded-xl text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <div className="overflow-hidden max-w-[150px] sm:max-w-[300px]">
                <p className="text-xs font-black text-red-900 truncate">Document.pdf</p>
                <p className="text-[9px] text-red-600 font-bold uppercase tracking-widest">Digital PDF Asset</p>
              </div>
            </div>
            <a href={part} target="_blank" rel="noopener noreferrer" className="ml-4 p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </a>
          </div>
        );
      }
      
      const isOfficial = part.match(repoRegex) || part.match(epubRegex);
      if (isOfficial) {
        return (
          <div key={index} className="my-4 p-5 bg-emerald-50 border-2 border-emerald-100 rounded-3xl flex items-center justify-between group shadow-md">
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="bg-emerald-700 p-3 rounded-2xl text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div>
                <p className="text-xs font-black text-emerald-900 truncate uppercase">Official Research</p>
                <p className="text-[10px] text-emerald-700 font-bold italic truncate">Repository Kementan</p>
              </div>
            </div>
            <a href={part} target="_blank" rel="noopener noreferrer" className="ml-4 px-4 py-2 bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-800 transition-all">Akses</a>
          </div>
        );
      }

      if (part.match(generalUrlRegex)) {
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline hover:text-emerald-900 transition-colors break-all">{part}</a>;
      }

      return <span key={index}>{part}</span>;
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    alert("Teks berhasil disalin!");
  };

  return (
    <div className={`flex w-full mb-10 animate-message ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[90%] md:max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${
          isAssistant 
            ? (isExpert ? 'bg-emerald-950 border-yellow-400' : isJournal ? 'bg-blue-900 border-blue-400' : isPython ? 'bg-indigo-900 border-indigo-400' : 'bg-emerald-700 border-white') + ' text-white mr-4 border-2 shadow-xl' 
            : 'bg-slate-200 text-slate-600 ml-4'
        }`}>
          {isAssistant ? (
            isPython ? <span className="text-2xl">🐍</span> : 
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          ) : (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          )}
        </div>
        
        <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
          {isAssistant && (
             <div className="flex items-center space-x-2 mb-2 px-2">
                <span className={`text-[9px] font-black text-white px-3 py-1 rounded-full border shadow-md uppercase tracking-widest italic ${
                  isExpert ? 'bg-emerald-950 border-yellow-500' : isJournal ? 'bg-blue-900 border-blue-400' : isPython ? 'bg-indigo-900 border-indigo-400' : 'bg-emerald-800'
                }`}>
                  {isExpert ? 'Expert Node' : isJournal ? 'Scholar Node' : isPython ? 'AI Engineer Node' : 'Assistant Node'}
                </span>
                <button onClick={copyToClipboard} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-all">Salin</button>
             </div>
          )}
          
          <div className={`px-8 py-6 rounded-[2.5rem] shadow-xl border transition-all ${
            isAssistant 
              ? (isExpert ? 'bg-white border-emerald-100' : isJournal ? 'bg-blue-50/40 border-blue-100' : isPython ? 'bg-slate-900 border-indigo-500 text-indigo-50' : 'bg-emerald-50/50 border-emerald-100') + ' rounded-tl-none text-slate-800' 
              : 'bg-emerald-700 text-white border-emerald-600 rounded-tr-none'
          }`}>
            <div className={`prose max-w-none prose-sm font-medium ${isPython ? 'prose-invert' : 'prose-emerald'}`}>
              <div className="whitespace-pre-wrap leading-relaxed">{renderContent(message.content)}</div>
            </div>
          </div>
          
          {isAssistant && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="px-4 py-2 text-[10px] font-black rounded-xl border bg-white border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-all italic active:scale-95 shadow-sm"
                >
                  <span className="mr-1 text-emerald-400">#</span>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center space-x-2 opacity-50">
            <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • BBPP LEMBANG
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
