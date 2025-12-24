
import React from 'react';
import { metadata } from '../metadata';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SystemStatusModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const uptime = "99.98%";
  const lastDeploy = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md transition-all">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-900 dark:bg-black p-8 text-white relative border-b-8 border-emerald-500">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black italic tracking-tighter">System Intelligence Overview</h3>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em] mt-2 italic">Infrastructure & Deployment Metadata</p>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Header Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Platform Core</h4>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black rounded-full border border-emerald-100 dark:border-emerald-800 uppercase tracking-widest">Verified Hub</span>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">{metadata.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{metadata.description}</p>
            </div>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">System Version</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">v{metadata.version}</p>
              </div>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Operational Uptime</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">{uptime}</p>
              </div>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Environment</p>
              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase italic tracking-tighter">{metadata.deployment.environment}</p>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Infrastructure</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{metadata.deployment.provider}</p>
            </div>
          </div>

          {/* Health Bar */}
          <div className="space-y-3">
             <div className="flex justify-between items-center px-1">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resource Health Index</p>
                <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Status: Healthy</p>
             </div>
             <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-1">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
             </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold italic uppercase tracking-tighter">Last Synchronized: {lastDeploy}</p>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 dark:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusModal;
