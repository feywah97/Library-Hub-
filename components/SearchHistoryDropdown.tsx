
import React, { useEffect, useRef, useState } from 'react';
import { searchHistoryService } from '../services/searchHistoryService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (query: string) => void;
}

const SearchHistoryDropdown: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  const [history, setHistory] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHistory(searchHistoryService.getHistory());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Hapus seluruh riwayat pencarian?')) {
      searchHistoryService.clearHistory();
      setHistory([]);
      onClose();
    }
  };

  const handleDeleteItem = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    searchHistoryService.deleteQuery(query);
    setHistory(searchHistoryService.getHistory());
  };

  if (!isOpen || history.length === 0) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute bottom-full mb-4 left-0 right-0 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest block">Riwayat Riset</span>
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Pencarian Terakhir Anda</span>
          </div>
        </div>
        <button 
          onClick={handleClearAll}
          className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 text-[9px] font-black text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg uppercase tracking-widest transition-all"
        >
          Bersihkan
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto py-2">
        {history.map((query, idx) => (
          <div 
            key={idx}
            className="group flex items-center px-4 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all border-b border-slate-50 dark:border-slate-800/50 last:border-none"
          >
            <button
              onClick={() => {
                onSelect(query);
                onClose();
              }}
              className="flex-1 text-left py-4 flex items-center space-x-4 overflow-hidden"
              title={`Klik untuk mencari: ${query}`}
            >
              <svg className="h-3 w-3 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {query}
              </span>
            </button>
            
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleDeleteItem(e, query)}
                className="p-2 text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Hapus dari riwayat"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              
              <button
                onClick={() => {
                  onSelect(query);
                  onClose();
                }}
                className="p-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
                title="Jalankan pencarian sekarang"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-slate-50 dark:bg-slate-800/30 text-center border-t border-slate-100 dark:border-slate-800">
         <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Platform Riset Cerdas BBPP Lembang</p>
      </div>
    </div>
  );
};

export default SearchHistoryDropdown;
