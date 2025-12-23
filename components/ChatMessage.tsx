
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
  const isGradio = message.mode === 'gradio';

  const renderContent = (content: string) => {
    const pdfRegex = /(https?:\/\/[^\s,()]+\.pdf(?:[?#][^\s,()]*)?)/gi;
    const waRegex = /(https?:\/\/wa\.me\/6283827954312(?:[?#][^\s,()]*)?)/gi;
    const repoRegex = /(https?:\/\/repository\.pertanian\.go\.id(?:[?#][^\s,()]*)?)/gi;
    const epubRegex = /(https?:\/\/epublikasi\.pertanian\.go\.id(?:[?#][^\s,()]*)?)/gi;
    const scholarRegex = /(https?:\/\/scholar\.google\.com(?:[?#][^\s,()]*)?)/gi;
    const generalUrlRegex = /(https?:\/\/[^\s,()]+)/gi;

    const combinedRegex = /(https?:\/\/[^\s,()]+\.pdf(?:[?#][^\s,()]*)?|https?:\/\/wa\.me\/6283827954312(?:[?#][^\s,()]*)?|https?:\/\/repository\.pertanian\.go\.id(?:[?#][^\s,()]*)?|https?:\/\/epublikasi\.pertanian\.go\.id(?:[?#][^\s,()]*)?|https?:\/\/scholar\.google\.com(?:[?#][^\s,()]*)?|https?:\/\/[^\s,()]+)/gi;
    
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
                <p className="text-xs font-black text-emerald-900 truncate uppercase tracking-tighter">Bantuan Langsung</p>
                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest italic">Pustakawan BBPP Lembang</p>
              </div>
            </div>
            <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="ml-4 px-5 py-2.5 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#128C7E] transition-all border-b-4 border-emerald-900 shadow-lg flex items-center space-x-2">
              <span>Hubungi Pustakawan (WhatsApp)</span>
            </a>
          </div>
        );
      }

      if (part.match(pdfRegex)) {
        const fileName = part.split('/').pop()?.split('?')[0]?.replace(/_/g, ' ') || 'Dokumen PDF';
        return (
          <div key={index} className="my-4 p-5 bg-red-50/30 border border-red-100 rounded-3xl flex items-center justify-between group hover:bg-red-50 transition-all shadow-sm">
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="bg-red-600 p-3 rounded-2xl text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-red-900 truncate uppercase tracking-tighter">{fileName}</p>
                <p className="text-[9px] text-red-600 font-bold uppercase tracking-widest">Digital PDF Asset</p>
              </div>
            </div>
            <a href={part} target="_blank" rel="noopener noreferrer" className="ml-4 p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </a>
          </div>
        );
      }
      
      const isOfficial = part.match(repoRegex) || part.match(epubRegex);
      if (isOfficial) {
        return (
          <div key={index} className="my-4 p-5 bg-emerald-50 border-2 border-emerald-100 rounded-3xl flex items-center justify-between group hover:bg-emerald-100/50 transition-all shadow-md">
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="bg-emerald-700 p-3 rounded-2xl text-white shadow-xl">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-black text-emerald-900 truncate uppercase tracking-tighter">Official Research Data</p>
                  <span className="bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Verified</span>
                </div>
                <p className="text-[10px] text-emerald-700 font-bold italic truncate">{part.includes('repository') ? 'Repositori Pertanian' : 'e-Publikasi Digital'}</p>
              </div>
            </div>
            <a href={part} target="_blank" rel="noopener noreferrer" className="ml-4 px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-800 transition-all border-b-4 border-emerald-950 shadow-lg">Buka</a>
          </div>
        );
      }

      if (part.match(scholarRegex)) {
        return (
          <div key={index} className="my-4 p-5 bg-blue-50 border-2 border-blue-100 rounded-3xl flex items-center justify-between group hover:bg-blue-100/50 transition-all shadow-md">
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="bg-blue-800 p-3 rounded-2xl text-white shadow-xl">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-blue-900 truncate uppercase tracking-tighter">Google Scholar</p>
                <p className="text-[9px] text-blue-700 font-bold uppercase tracking-widest italic">Literatur Akademik</p>
              </div>
            </div>
            <a href={part} target="_blank" rel="noopener noreferrer" className="ml-4 px-6 py-2.5 bg-blue-800 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-900 transition-all border-b-4 border-blue-950 shadow-lg">Scholar</a>
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
    alert("Hasil riset berhasil disalin!");
  };

  return (
    <div className={`flex w-full mb-10 animate-message ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[90%] md:max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 h-16 w-16 rounded-3xl flex items-center justify-center transition-all ${
          isAssistant 
            ? (isExpert ? 'bg-emerald-950 border-yellow-400' : isJournal ? 'bg-blue-900 border-blue-400' : 'bg-emerald-700 border-white') + ' text-white mr-6 border-2 shadow-2xl scale-105' 
            : 'bg-slate-200 text-slate-600 ml-6'
        }`}>
          {isAssistant ? (
            <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          ) : (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          )}
        </div>
        
        <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
          {isAssistant && (
             <div className="flex items-center space-x-3 mb-3 px-2">
                <span className={`text-[10px] font-black text-white px-4 py-1.5 rounded-full border shadow-xl uppercase tracking-[0.2em] italic ${
                  isExpert ? 'bg-emerald-950 border-yellow-500' : isJournal ? 'bg-blue-900 border-blue-400' : 'bg-emerald-800'
                }`}>
                  {isExpert ? 'Expert Node' : isJournal ? 'Scholar Node' : 'Assistant Node'}
                </span>
                <button onClick={copyToClipboard} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-all flex items-center">
                   <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                   Salin Teks
                </button>
             </div>
          )}
          
          <div className={`px-10 py-8 rounded-[3rem] shadow-2xl border-2 transition-all ${
            isAssistant 
              ? (isExpert ? 'bg-white border-emerald-100' : isJournal ? 'bg-blue-50/40 border-blue-100' : 'bg-emerald-50/50 border-emerald-100') + ' rounded-tl-none text-slate-800' 
              : 'bg-emerald-700 text-white border-emerald-600 rounded-tr-none shadow-emerald-100'
          }`}>
            <div className="prose prose-emerald max-w-none prose-sm font-medium">
              <div className="whitespace-pre-wrap leading-relaxed">{renderContent(message.content)}</div>
            </div>
          </div>
          
          {isAssistant && message.groundingSources && (
            <div className="mt-10 w-full animate-message">
              <div className="flex items-center space-x-3 mb-6 px-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 ring-8 ring-emerald-50"></div>
                <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-widest italic">Research Grounding Output</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {message.groundingSources.map((source, idx) => {
                  const isAgricultural = source.uri.includes('pertanian.go.id');
                  return (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`flex flex-col p-6 border-2 rounded-[2.5rem] transition-all group hover:shadow-2xl active:scale-95 shadow-sm ${
                        isAgricultural ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-100 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform ${
                          isAgricultural ? 'bg-emerald-700 text-white' : 'bg-blue-50 text-blue-600'
                        }`}>
                           <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </div>
                        {isAgricultural && (
                          <span className="bg-emerald-700 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Verified Official</span>
                        )}
                      </div>
                      <div className="flex-1">
                         <p className={`text-xs font-black uppercase tracking-tight leading-tight ${isAgricultural ? 'text-emerald-900' : 'text-slate-800'}`}>
                           {source.title}
                         </p>
                         <p className="text-[9px] font-bold text-slate-400 truncate mt-2 font-mono">
                           {source.uri}
                         </p>
                      </div>
                      <div className="mt-6 flex items-center text-[9px] font-black uppercase tracking-widest text-emerald-700 group-hover:translate-x-1 transition-transform">
                        <span>Kunjungi Sumber</span>
                        <svg className="h-3 w-3 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {isAssistant && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {message.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="px-6 py-3 text-[11px] font-black rounded-2xl border bg-white border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 hover:shadow-xl transition-all italic active:scale-95 shadow-sm"
                >
                  <span className="mr-2 text-emerald-400">#</span>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center mt-6 space-x-3 opacity-30 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • BBPP LEMBANG RESEARCH HUB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
