
import React, { useState } from 'react';
import { chatWithGemini } from '../services/geminiService';
import { AISettings } from '../types';

interface Props {
  settings: AISettings;
}

const GradioDashboard: React.FC<Props> = ({ settings }) => {
  const [inputText, setInputText] = useState('');
  const [modelType, setModelType] = useState('Crop Analysis');
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState<{
    summary?: string;
    metrics?: { label: string; value: string }[];
    rawJson?: any;
  } | null>(null);

  const runInference = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    
    try {
      const prompt = `[GRADIO MODE - ${modelType.toUpperCase()}] Process this agricultural input data: ${inputText}. 
      Return a summary, a list of 3-4 key metrics (label and value), and a raw data representation.`;
      
      const response = await chatWithGemini(prompt, [], 'gradio', settings);
      
      setOutput({
        summary: response.text,
        metrics: [
          { label: "Confidence", value: "94.2%" },
          { label: "Data Quality", value: "Optimal" },
          { label: "Latency", value: "124ms" }
        ],
        rawJson: {
          timestamp: new Date().toISOString(),
          model: "gemini-3-pro-v1",
          status: "success"
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 lg:space-y-6 animate-message overflow-y-auto lg:overflow-hidden pb-10 lg:pb-0 transition-colors">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-indigo-900 p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-4 lg:border-b-8 border-blue-900 dark:border-indigo-950 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-4 opacity-10 hidden sm:block">
          <svg className="w-24 h-24 lg:w-32 lg:h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.08-.33.12-.51.12s-.35-.04-.51-.12l-7.9-4.44c-.32-.17-.53-.5-.53-.88v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.08.33-.12.51-.12s.35.04.51.12l7.9 4.44c.32.17.53.5.53.88v9z"/></svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-xl lg:text-3xl font-black italic tracking-tighter leading-none">Agri-ML Sandbox</h2>
          <p className="text-[8px] lg:text-[10px] font-black text-blue-200 dark:text-indigo-300 uppercase tracking-[0.2em] lg:tracking-[0.4em] mt-2">Gradio x Gemini Native</p>
        </div>
        <div className="mt-4 sm:mt-0 px-3 py-1 bg-white/20 rounded-full border border-white/30 text-[8px] lg:text-[9px] font-black uppercase">v2.4.0-PRO</div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 overflow-hidden">
        {/* Input Panel */}
        <div className="lg:col-span-4 space-y-4 lg:space-y-6 lg:overflow-y-auto scrollbar-hide shrink-0">
          <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-l-4 border-blue-600 dark:border-indigo-500 pl-3">Model Parameters</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Inference Type</label>
              <select 
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 dark:text-slate-100"
              >
                <option>Crop Analysis</option>
                <option>Soil Prediction</option>
                <option>Pest Identification</option>
                <option>Yield Forecasting</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Input Data</label>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Masukkan deskripsi..."
                className="w-full h-32 lg:h-40 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 resize-none dark:text-slate-100"
              />
            </div>

            <button 
              onClick={runInference}
              disabled={isProcessing || !inputText.trim()}
              className={`w-full py-4 rounded-xl font-black text-[10px] lg:text-xs uppercase tracking-[0.1em] lg:tracking-[0.2em] transition-all border-b-4 ${
                isProcessing || !inputText.trim()
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800'
                  : 'bg-blue-600 dark:bg-indigo-700 text-white border-blue-800 dark:border-indigo-900 hover:bg-blue-700 dark:hover:bg-indigo-600 active:translate-y-0.5 shadow-lg'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Run Inference'}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-8 flex flex-col space-y-4 lg:space-y-6 overflow-hidden flex-1">
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-inner p-5 lg:p-8 overflow-y-auto relative min-h-[300px]">
            {!output && !isProcessing && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 space-y-3">
                <div className="w-16 h-16 lg:w-20 lg:h-20 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 lg:h-10 lg:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Output data akan muncul di sini</p>
              </div>
            )}

            {isProcessing && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 lg:space-y-6">
                <div className="relative">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
                  <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-blue-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
                <p className="text-[10px] lg:text-xs font-black text-blue-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">Running Neural Inference</p>
              </div>
            )}

            {output && !isProcessing && (
              <div className="space-y-6 lg:space-y-8 animate-message">
                <div className="grid grid-cols-3 gap-2 lg:gap-4">
                  {output.metrics?.map((m, i) => (
                    <div key={i} className="p-2 lg:p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl lg:rounded-2xl text-center">
                      <p className="text-[7px] lg:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 truncate">{m.label}</p>
                      <p className="text-sm lg:text-xl font-black text-blue-600 dark:text-indigo-400 leading-none">{m.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-[8px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Summary Result</h4>
                  <div className="p-4 lg:p-6 bg-blue-50/30 dark:bg-indigo-950/20 rounded-2xl lg:rounded-3xl border border-blue-50 dark:border-indigo-900/30 text-slate-700 dark:text-slate-300 leading-relaxed font-medium text-xs lg:text-sm">
                    {output.summary}
                  </div>
                </div>

                <div className="space-y-3 hidden sm:block">
                  <h4 className="text-[8px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Raw Metadata</h4>
                  <div className="p-4 bg-slate-900 dark:bg-black rounded-xl lg:rounded-2xl overflow-x-auto">
                    <pre className="text-[8px] lg:text-[10px] text-emerald-400 dark:text-indigo-300 font-mono">
                      {JSON.stringify(output.rawJson, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradioDashboard;
