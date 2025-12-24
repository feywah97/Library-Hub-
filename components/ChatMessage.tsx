
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

  const renderContent = (content: string) => {
    const pdfRegex = /(https?:\/\/[^\s,()]+\.pdf(?:[?#][^\s,()]*)?)/gi;
    const waRegex = /(https?:\/\/wa\.me\/6283827954312(?:[?#][^\s,()]*)?)/gi;
    const repoRegex = /(https?:\/\/repository\.pertanian\.go\.id(?:[?#][^\s,()]*)?)/gi;
    const epubRegex = /(https?:\/\/epublikasi\.pertanian\.go\.id(?:[?#][^\s,()]*)?)/gi;
    const generalUrlRegex = /(https?:\/\/[^\s,()]+)/gi;

    const combinedRegex = /(https?:\/\/[^\s,()]+\.pdf(?:[?#][^\s,()]*)?|https?:\/\/wa\.me\/6283827954312(?:[?#][^\s,()]*)?|https?:\/\/repository\.pertanian\.go\.id(?:[?#][^\s,()]*)?|https?:\/\/epublikasi\.pertanian\.go\.id(?:[?#][^\s,()]*)?|https?:\/\/[^\s,()]+)/gi;
    
    const parts = content.split(combinedRegex);
    
    return parts.map((part, index) => {
      if (!part) return null;

      if (part.match(waRegex)) {
        const defaultText = encodeURIComponent("Halo Pustakawan BBPP Lembang...");
        const finalUrl = part.includes('text=') ? part : `https://wa.me/6283827954312?text=${defaultText}`;
        
        return (
          <div key={index} className="my-3 p-4 lg:p-5 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-900/40 rounded-2xl lg:rounded-3xl flex items-center justify-between group shadow-sm transition-colors">
            <div className="flex items-center space-x-3 lg:space-x-4 overflow-hidden">
              <div className="bg-[#25D366] p-2 lg:p-3 rounded-xl lg:rounded-2xl text-white shadow-md flex-shrink-0">
                <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.808 1.565 5.405l-.992 3.613 3.655-.959c.001 0 .001 0 0 0zm10.034-7.447c-.273-.136-1.615-.797-1.865-.888-.251-.091-.432-.136-.615.136-.182.273-.706.888-.865 1.07-.159.182-.319.205-.592.068-.273-.136-1.151-.424-2.193-1.353-.81-.722-1.357-1.614-1.516-1.886-.159-.273-.017-.42.12-.556.123-.122.273-.318.41-.477.136-.159.182-.273.273-.454.091-.182.045-.341-.023-.477-.068-.136-.615-1.477-.842-2.023-.222-.532-.445-.459-.615-.468-.159-.009-.341-.01-.523-.01s-.477.068-.728.341c-.25.273-.955.932-.955 2.273s.977 2.636 1.114 2.818c.136.182 1.92 2.932 4.653 4.114.65.281 1.157.449 1.551.574.653.207 1.248.178 1.717.108.523-.078 1.615-.659 1.842-1.295.227-.636.227-1.182.159-1.295-.068-.113-.25-.181-.523-.317z"/>
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] lg:text-xs font-black text-emerald-900 dark:text-emerald-200 truncate uppercase tracking-tighter">Bantuan WhatsApp</p>
                <p className="text-[8px] lg:text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest italic">Pustakawan</p>
              </div>
            </div>
            <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="ml-2 lg:ml-4 px-3 py-1.5 lg:px-5 lg:py-2 bg-[#25D366] text-white rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black uppercase hover:bg-[#128C7E] transition-all flex-shrink-0">Chat</a>
          </div>
        );
      }

      if (part.match(pdfRegex)) {
        return (
          <div key={index} className="my-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-center justify-between group transition-colors">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-2 rounded-lg text-white">
                <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] lg:text-xs font-black text-red-900 dark:text-red-200 truncate max-w-[120px] lg:max-w-none">Doc_Research.pdf</p>
                <p className="text-[8px] lg:text-[9px] text-red-600 dark:text-red-400 font-bold uppercase tracking-widest">Digital PDF</p>
              </div>
            </div>
            <a href={part} target="_blank" rel="noopener noreferrer" className="ml-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex-shrink-0">
              <svg className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </a>
          </div>
        );
      }
      
      const isOfficial = part.match(repoRegex) || part.match(epubRegex);
      if (isOfficial) {
        return (
          <div key={index} className="my-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex items-center justify-between group shadow-sm transition-colors">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="bg-emerald-700 p-2 lg:p-3 rounded-xl text-white flex-shrink-0">
                <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] lg:text-xs font-black text-emerald-900 dark:text-emerald-200 truncate uppercase">Repositori Kementan</p>
                <p className="text-[8px] lg:text-[10px] text-emerald-700 dark:text-emerald-400 font-bold italic truncate">Official Document</p>
              </div>
            </div>
            <a href={part} target="_blank" rel="noopener noreferrer" className="ml-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-emerald-700 text-white rounded-lg text-[9px] lg:text-[10px] font-black uppercase hover:bg-emerald-800 transition-all flex-shrink-0">Akses</a>
          </div>
        );
      }

      if (part.match(generalUrlRegex)) {
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-400 font-bold underline hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors break-all text-xs lg:text-sm">{part}</a>;
      }

      return <span key={index}>{part}</span>;
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    alert("Berhasil disalin!");
  };

  return (
    <div className={`flex w-full mb-6 lg:mb-10 animate-message ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[95%] lg:max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 h-10 w-10 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all ${
          isAssistant 
            ? (isExpert ? 'bg-emerald-950 border-yellow-400' : isJournal ? 'bg-blue-900 border-blue-400' : isPython ? 'bg-indigo-900 border-indigo-400' : 'bg-emerald-700 border-white') + ' text-white mr-2 lg:mr-4 border shadow-md' 
            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ml-2 lg:ml-4'
        }`}>
          {isAssistant ? (
            isPython ? <span className="text-xl lg:text-2xl">🐍</span> : 
            <svg className="h-6 w-6 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          ) : (
            <svg className="h-5 w-5 lg:h-7 lg:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          )}
        </div>
        
        <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} overflow-hidden w-full`}>
          {isAssistant && (
             <div className="flex items-center space-x-2 mb-1.5 lg:mb-2 px-1">
                <span className={`text-[7px] lg:text-[9px] font-black text-white px-2 lg:px-3 py-0.5 lg:py-1 rounded-full border shadow-sm uppercase tracking-widest italic ${
                  isExpert ? 'bg-emerald-950 border-yellow-500' : isJournal ? 'bg-blue-900 border-blue-400' : isPython ? 'bg-indigo-900 border-indigo-400' : 'bg-emerald-800'
                }`}>
                  {isExpert ? 'Expert Node' : isJournal ? 'Scholar Node' : isPython ? 'AI Engineer Node' : 'Assistant Node'}
                </span>
                <button onClick={copyToClipboard} className="text-[7px] lg:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">Copy</button>
             </div>
          )}
          
          <div className={`px-4 py-3 lg:px-8 lg:py-6 rounded-2xl lg:rounded-[2.5rem] shadow-lg border transition-all w-full ${
            isAssistant 
              ? (isExpert ? 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-slate-800' : isJournal ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40' : isPython ? 'bg-slate-900 border-indigo-500 text-indigo-50' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40') + ' rounded-tl-none text-slate-800 dark:text-slate-200' 
              : 'bg-emerald-700 text-white border-emerald-600 rounded-tr-none'
          }`}>
            <div className={`prose max-w-none prose-xs lg:prose-sm font-medium ${isPython ? 'prose-invert' : 'prose-emerald'} overflow-x-auto`}>
              <div className="whitespace-pre-wrap leading-relaxed text-xs lg:text-sm">{renderContent(message.content)}</div>
            </div>

            {isAssistant && message.groundingSources && message.groundingSources.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Bibliografi Digital & Dokumen</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {message.groundingSources.map((source, idx) => {
                    const isDoc = source.uri.toLowerCase().endsWith('.pdf') || source.uri.includes('repository') || source.uri.includes('epublikasi');
                    return (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all group"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${isDoc ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {isDoc ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate group-hover:text-emerald-800 dark:group-hover:text-emerald-400">{source.title}</p>
                            <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase">{new URL(source.uri).hostname}</p>
                          </div>
                        </div>
                        <svg className="h-3 w-3 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {isAssistant && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 lg:gap-2 justify-start">
              {message.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="px-3 py-1.5 lg:px-4 lg:py-2 text-[8px] lg:text-[10px] font-black rounded-lg lg:rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all italic shadow-sm flex-shrink-0"
                >
                  <span className="mr-1 text-emerald-400">#</span>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center space-x-2 opacity-40">
            <span className="text-[7px] lg:text-[8px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • BBPP LEMBANG RESEARCH HUB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
