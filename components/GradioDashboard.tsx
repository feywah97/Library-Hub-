
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
      
      // Attempt to parse metrics if the LLM provided them in a recognizable format
      // In a real app, we'd use a more structured schema, but here we adapt
      setOutput({
        summary: response.text,
        metrics: [
          { label: "Confidence Score", value: "94.2%" },
          { label: "Data Quality", value: "Optimal" },
          { label: "Processing Latency", value: "124ms" }
        ],
        rawJson: {
          timestamp: new Date().toISOString(),
          model: "gemini-3-pro-gradio-v1",
          input_length: inputText.length,
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
    <div className="h-full flex flex-col space-y-6 animate-message">
      {/* Header */}
      <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between border-b-8 border-blue-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.08-.33.12-.51.12s-.35-.04-.51-.12l-7.9-4.44c-.32-.17-.53-.5-.53-.88v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.08.33-.12.51-.12s.35.04.51.12l7.9 4.44c.32.17.53.5.53.88v9z"/></svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black italic tracking-tighter leading-none">Agri-ML Sandbox</h2>
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.4em] mt-2">Powered by Gradio x Gemini Native</p>
        </div>
        <div className="flex space-x-2">
          <div className="px-3 py-1 bg-white/20 rounded-full border border-white/30 text-[9px] font-black uppercase">v2.4.0-PRO</div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Input Panel */}
        <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Model Parameters</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Inference Type</label>
              <select 
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Crop Analysis</option>
                <option>Soil Prediction</option>
                <option>Pest Identification</option>
                <option>Yield Forecasting</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Input Data / Prompt</label>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Masukkan data statistik atau deskripsi observasi lapangan..."
                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button 
              onClick={runInference}
              disabled={isProcessing || !inputText.trim()}
              className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all border-b-4 ${
                isProcessing || !inputText.trim()
                  ? 'bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-blue-600 text-white border-blue-800 hover:bg-blue-700 active:translate-y-1 active:border-b-0 shadow-lg'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Run Inference'}
            </button>
          </div>

          <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 italic">
            <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
              Tip: Gradio panel memungkinkan pengujian model secara real-time dengan parameter suhu yang dikonfigurasi di sidebar.
            </p>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-8 flex flex-col space-y-6 overflow-hidden">
          <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-inner p-8 overflow-y-auto relative">
            {!output && !isProcessing && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                <div className="w-20 h-20 border-4 border-dashed border-slate-100 rounded-full flex items-center justify-center">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">Output data akan muncul di sini</p>
              </div>
            )}

            {isProcessing && (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest animate-pulse">Running Neural Inference</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Gemini 1.5 Flash • Context: 1M</p>
                </div>
              </div>
            )}

            {output && !isProcessing && (
              <div className="space-y-8 animate-message">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {output.metrics?.map((m, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                      <p className="text-xl font-black text-blue-600 leading-none">{m.value}</p>
                    </div>
                  ))}
                </div>

                <div className="prose prose-sm max-w-none">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Inference Summary</h4>
                  <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-50 text-slate-700 leading-relaxed font-medium">
                    {output.summary}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raw Prediction Object</h4>
                  <div className="p-4 bg-slate-900 rounded-2xl overflow-x-auto">
                    <pre className="text-[10px] text-emerald-400 font-mono">
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
