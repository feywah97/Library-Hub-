
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface Props {
  isActive: boolean;
}

const LiveVoiceSearch: React.FC<Props> = ({ isActive }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcription, setTranscription] = useState<{user: string, ai: string}>({ user: '', ai: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const encode = (bytes: Uint8Array) => {
    try {
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    } catch (e) {
      console.error("Encode failure", e);
      return "";
    }
  };

  const decode = (base64: string) => {
    try {
      const binaryString = atob(base64.trim());
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes;
    } catch (e) {
      console.error("Decode failure", e);
      return new Uint8Array(0);
    }
  };

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number): Promise<AudioBuffer> {
    if (data.length === 0) return ctx.createBuffer(1, 1, sampleRate);
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  }

  const startSession = async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        throw new Error("Akses mikrofon ditolak atau tidak ditemukan.");
      }

      const apiKey = process.env.API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: 'Anda adalah asisten suara BBPP Lembang.',
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            try {
              setIsConnected(true);
              setIsConnecting(false);
              const source = audioContextRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                try {
                  const inputData = e.inputBuffer.getChannelData(0);
                  const int16 = new Int16Array(inputData.length);
                  for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                  sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
                  }).catch(err => console.error("Realtime input failed", err));
                } catch (err) { console.error("Audio process error", err); }
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current!.destination);
            } catch (err) { console.error("OnOpen setup failure", err); }
          },
          onmessage: async (message: LiveServerMessage) => {
            try {
              if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
                const base64Data = message.serverContent.modelTurn.parts[0].inlineData.data;
                const ctx = outAudioContextRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Data), ctx, 24000);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.onended = () => { sourcesRef.current.delete(source); };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }
              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
              if (message.serverContent?.inputTranscription) {
                setTranscription(prev => ({ ...prev, user: message.serverContent?.inputTranscription?.text || '' }));
              }
              if (message.serverContent?.outputTranscription) {
                setTranscription(prev => ({ ...prev, ai: prev.ai + (message.serverContent?.outputTranscription?.text || '') }));
              }
            } catch (err) { console.error("Message handling error", err); }
          },
          onclose: (e) => {
            setIsConnected(false);
            setIsConnecting(false);
            if (e.code !== 1000) setErrorMessage("Koneksi terputus.");
          },
          onerror: (e: any) => {
            console.error("Live API Error:", e);
            setIsConnecting(false);
            setIsConnected(false);
            setErrorMessage(e.message || "Kesalahan teknis pada server AI.");
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Failed to connect", err);
      setErrorMessage(err.message || "Gagal memulai sesi suara.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    setIsConnected(false);
    setTranscription({ user: '', ai: '' });
  };

  useEffect(() => {
    if (!isActive && isConnected) stopSession();
  }, [isActive, isConnected]);

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 lg:p-8 animate-message overflow-y-auto">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl lg:rounded-[3rem] shadow-2xl border border-emerald-100 dark:border-emerald-900 p-6 lg:p-12 text-center overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-6 lg:mb-10">
            <div className={`w-20 h-20 lg:w-32 lg:h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${
              errorMessage ? 'bg-red-100 dark:bg-red-900/20 border-2 border-red-500' :
              isConnected ? 'bg-emerald-600 scale-105' : isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              {errorMessage ? (
                 <svg className="h-8 w-8 lg:h-12 lg:w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
              ) : isConnected ? (
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`w-1 lg:w-1.5 bg-white rounded-full animate-bounce h-${i % 2 === 0 ? '6' : '10'}`} style={{animationDelay: `${i * 0.1}s`}}></div>
                  ))}
                </div>
              ) : (
                <svg className={`h-10 w-10 lg:h-16 lg:w-16 ${isConnecting ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
            <h2 className="mt-6 lg:mt-8 text-xl lg:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter italic">
              {errorMessage ? 'Masalah Teknis' : isConnected ? 'Suara Aktif' : isConnecting ? 'Menghubungkan...' : 'Eksplorasi Suara'}
            </h2>
            {errorMessage && (
              <p className="mt-2 text-[10px] lg:text-xs font-bold text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-950 px-4 py-1.5 rounded-full border border-red-100 dark:border-red-900">{errorMessage}</p>
            )}
          </div>
          <div className="space-y-4 mb-6 lg:mb-10 min-h-[100px] flex flex-col justify-center">
            {transcription.user && (
              <div className="p-4 lg:p-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl lg:rounded-3xl text-left animate-in slide-in-from-left-4">
                <p className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 lg:mb-2">User:</p>
                <p className="text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300 italic">"{transcription.user}"</p>
              </div>
            )}
            {transcription.ai && (
              <div className="p-4 lg:p-6 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 rounded-2xl lg:rounded-3xl text-left animate-message">
                <p className="text-[7px] lg:text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 lg:mb-2">AI:</p>
                <p className="text-xs lg:text-sm font-black text-emerald-900 dark:text-emerald-100 leading-relaxed">{transcription.ai}</p>
              </div>
            )}
          </div>
          <button
            onClick={isConnected ? stopSession : startSession}
            disabled={isConnecting}
            className={`w-full py-4 lg:py-5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-sm uppercase tracking-widest transition-all shadow-xl border-b-4 ${
              isConnected ? 'bg-red-500 text-white border-red-800' : 'bg-emerald-700 text-white border-emerald-900'
            } ${isConnecting ? 'opacity-50' : 'active:translate-y-1 active:border-b-0 hover:brightness-110'}`}
          >
            {isConnected ? 'Matikan Mikrofon' : isConnecting ? 'Memulai...' : 'Mulai Percakapan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveVoiceSearch;
