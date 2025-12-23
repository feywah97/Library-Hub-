
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

  const renderContent = (content: string) => {
    // Regex Definitions
    const pdfRegex = /(https?:\/\/[^\s]+?\.pdf)(?=[.,\s]|$)/gi;
    const waRegex = /(https?:\/\/wa\.me\/6283827954312[^\s]*?)(?=[.,\s]|$)/gi;
    const repoRegex = /(https?:\/\/repository\.pertanian\.go\.id[^\s]*?)(?=[.,\s]|$)/gi;
    const epubRegex = /(https?:\/\/epublikasi\.pertanian\.go\.id[^\s]*?)(?=[.,\s]|$)/gi;
    const scholarRegex = /(https?:\/\/scholar\.google\.com[^\s]*?)(?=[.,\s]|$)/gi;
    const generalUrlRegex = /(https?:\/\/[^\s]+)(?=[.,\s]|$)/gi;

    const combinedRegex = /(https?:\/\/[^\s]+?\.pdf|https?:\/\/wa\.me\/6283827954312[^\s]*?|https?:\/\/repository\.pertanian\.go\.id[^\s]*?|https?:\/\/epublikasi\.pertanian\.go\.id[^\s]*?|https?:\/\/scholar\.google\.com[^\s]*?|https?:\/\/[^\s]+)/gi;
    
    const parts = content.split(combinedRegex);
    
    return parts.map((part, index) => {
      if (!part) return null;

      // 1. PDF Accessory
      if (part.match(pdfRegex)) {
        const fileName = part.split('/').pop()?.split('?')[0]?.replace(/_/g, ' ') || 'Dokumen PDF';
        return (
          <div key={index} className="my-3 p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-center justify-between group/pdf hover:bg-red-100 hover:shadow-md transition-all animate-message">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex-shrink-0 bg-red-600 p-2 rounded-xl text-white shadow-lg shadow-red-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-black text-red-900 truncate uppercase tracking-tighter">{fileName}</p>
                <p className="text-[9px] text-red-700 font-bold uppercase tracking-widest">Digital Asset Access</p>
              </div>
            </div>
            <a href={part} target="_blank" rel="noopener noreferrer" className="ml-4 flex-shrink-0 bg-red-600 text-white p-2.5 rounded-xl hover:bg-red-700 transition-all border-b-2 border-red-900 active:translate-y-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        );
      }
      
      // 2. Scholar Cards
      if (part.match(scholarRegex)) {
        return (
          <div key={index} className="my-3 p-4 bg-blue-50/50 border border-blue-200 rounded-2xl flex items-center justify-between group/scholar hover:bg-blue-100 hover:shadow-md transition-all animate-message">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex-shrink-0 bg-blue-700 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-black text-blue-900 truncate uppercase tracking-tighter">Google Scholar Result</p>
                <p className="text-[9px] text-blue-700 font-bold uppercase tracking-widest italic">Scientific Literature Access</p>
              </div>
            </div>
            <a href={part} target="_blank" rel="noopener noreferrer" className="ml-4 flex-shrink-0 bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-blue-800 transition-all border-b-2 border-blue-950">
              BUKA JURNAL
            </a>
          </div>
        );
      }

      // 3. Repository & E-Publikasi Cards
      const isLibraryAsset = part.match(repoRegex) || part.match(epubRegex);
      if (isLibraryAsset) {
        const isEpub = part.match(epubRegex);
        return (
          <div key={index} className={`my-3 p-4 border rounded-2xl flex items-center justify-between group/asset animate-message transition-all ${isEpub ? 'bg-amber-50/50 border-amber-100 hover:bg-amber-100' : 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-100'}`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className={`flex-shrink-0 p-2.5 rounded-xl text-white shadow-lg ${isEpub ? 'bg-amber-600 shadow-amber-200' : 'bg-emerald-600 shadow-emerald-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className={`text-[11px] font-black truncate uppercase tracking-tighter ${isEpub ? 'text-amber-900' : 'text-emerald-900'}`}>
                  {isEpub ? 'e-Publikasi Pertanian' : 'Repositori Pertanian'}
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-widest italic ${isEpub ? 'text-amber-700' : 'text-emerald-700'}`}>Official Digital Collection</p>
              </div>
            </div>
            <a href={part} target="_blank" rel="noopener noreferrer" className={`ml-4 flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black text-white transition-all border-b-2 active:translate-y-0.5 ${isEpub ? 'bg-amber-600 hover:bg-amber-700 border-amber-900' : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-900'}`}>
              BUKA SUMBER
            </a>
          </div>
        );
      }

      // 4. WhatsApp
      if (part.match(waRegex)) {
        return (
          <div key={index} className="my-5 animate-message">
            <a 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group flex items-center justify-between w-full p-4 bg-emerald-50 border-2 border-emerald-500 rounded-3xl hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-emerald-200 active:scale-[0.97]"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 bg-emerald-500 group-hover:bg-white p-4 rounded-2xl shadow-xl transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white group-hover:text-emerald-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black uppercase tracking-widest leading-none mb-1 group-hover:text-white transition-colors">Hubungi Pustakawan (WhatsApp)</span>
                  <span className="text-[11px] font-bold opacity-70 group-hover:opacity-100 italic transition-all">Layanan Bantuan Referensi Teknis</span>
                </div>
              </div>
            </a>
          </div>
        );
      }

      if (part.match(generalUrlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-700 font-bold underline hover:text-emerald-900 transition-colors break-all underline-offset-4"
          >
            {part}
          </a>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`flex w-full mb-8 animate-message ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[90%] md:max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 h-14 w-14 rounded-[1.5rem] flex items-center justify-center transition-all ${
          isAssistant 
            ? (isExpert ? 'bg-emerald-900 border-yellow-400 rotate-[-3deg]' : isJournal ? 'bg-blue-800 border-blue-300 rotate-[-2deg]' : 'bg-emerald-600 border-white rotate-0') + ' text-white mr-4 border-2 shadow-2xl' 
            : 'bg-slate-200 text-slate-600 ml-4 rotate-[3deg]'
        }`}>
          {isAssistant ? (
            isJournal ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            ) : isExpert ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            )
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
          {isAssistant && (
            <div className="flex items-center space-x-2 mb-2 px-1">
              <span className={`text-[10px] font-black text-white px-3 py-1.5 rounded-xl border shadow-lg uppercase tracking-widest italic flex items-center ${
                isExpert ? 'bg-emerald-950 border-yellow-500' : 
                isJournal ? 'bg-blue-900 border-blue-400' : 
                'bg-emerald-700 border-emerald-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-2 animate-pulse ${isExpert ? 'bg-yellow-400' : isJournal ? 'bg-blue-200' : 'bg-white'}`}></span>
                {isExpert ? 'Expert Analysis' : isJournal ? 'Scholar Literature' : 'Asisten Perpustakaan'}
              </span>
            </div>
          )}
          
          <div className={`px-7 py-6 rounded-[2rem] shadow-2xl border-2 transition-all ${
            isAssistant 
              ? (isExpert ? 'bg-white border-emerald-100 text-slate-800' : isJournal ? 'bg-blue-50/30 border-blue-100 text-slate-800' : 'bg-emerald-50 border-emerald-100 text-slate-700') + ' rounded-tl-none' 
              : 'bg-emerald-600 text-white border-emerald-500 rounded-tr-none'
          }`}>
            <div className={`prose prose-sm max-w-none prose-emerald ${isExpert || isJournal ? 'prose-headings:font-black prose-headings:italic' : ''}`}>
              <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>
            </div>
          </div>
          
          {isAssistant && message.groundingSources && (
            <div className="mt-6 w-full animate-message">
              <div className="flex items-center space-x-3 mb-4 px-1">
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isJournal ? 'bg-blue-500 ring-blue-100 ring-4' : 'bg-yellow-400'}`}></div>
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest italic">
                  {isJournal ? 'Literatur Ilmiah Terdeteksi' : 'Sumber Grounding Terdeteksi'}
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {message.groundingSources.map((source, idx) => {
                  const isScholar = source.uri.includes('scholar.google.com');
                  return (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center p-3 bg-white border rounded-xl transition-all group shadow-sm ${isScholar ? 'border-blue-200 hover:border-blue-500' : 'border-slate-100 hover:border-yellow-400'}`}
                    >
                      <div className={`p-2 rounded-lg mr-3 ${isScholar ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isScholar ? (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                           </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414zM16.121 17.12