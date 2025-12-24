
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
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number): Promise<AudioBuffer> {
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
      // Step 1: Request Microphone Access
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error("Akses mikrofon ditolak. Mohon izinkan mikrofon di pengaturan browser Anda.");
        } else if (err.name === 'NotFoundError') {
          throw new Error("Mikrofon tidak ditemukan. Pastikan perangkat audio terhubung.");
        } else {
          throw new Error("Gagal mengakses mikrofon: " + err.message);
        }
      }

      // Step 2: Initialize AI and Context
      const ai = new GoogleGenAI({ apiKey: (process.env.API_KEY as string) });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          systemInstruction: 'Anda adalah asisten suara perpustakaan BBPP Lembang. Bantu pengguna dengan ramah dan profesional.',
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000'
                  }
                });
              }).catch(err => {
                console.error("Stream transfer error", err);
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Data = message.serverContent.modelTurn.parts[0].inlineData.data;
              const ctx = outAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Data), ctx, 24000);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.serverContent?.inputTranscription) {
              setTranscription(prev => ({ ...prev, user: message.serverContent?.inputTranscription?.text || '' }));
            }
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => ({ ...prev, ai: prev.ai + (message.serverContent?.outputTranscription?.text || '') }));
            }
          },
          onclose: (e) => {
            setIsConnected(false);
            setIsConnecting(false);
            if (e.code !== 1000) {
              setErrorMessage("Koneksi terputus secara tidak terduga.");
            }
          },
          onerror: (e: any) => {
            console.error("Live API Error:", e);
            setIsConnecting(false);
            setIsConnected(false);
            
            if (e.message?.includes('API_KEY')) {
              setErrorMessage("Kunci API tidak valid atau tidak ditemukan.");
            } else if (e.message?.includes('quota')) {
              setErrorMessage("Kuota API telah habis. Mohon tunggu beberapa saat.");
            } else {
              setErrorMessage("Terjadi kesalahan teknis pada server AI.");
            }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Failed to connect to Live API", err);
      setErrorMessage(err.message || "Gagal memulai sesi suara.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setTranscription({ user: '', ai: '' });
  };

  useEffect(() => {
    if (!isActive && isConnected) {
      stopSession();
    }
  }, [isActive, isConnected]);

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 lg:p-8 animate-message overflow-y-auto">
      <div className="max-w-2xl w-full bg-white rounded-3xl lg:rounded-[3rem] shadow-2xl border border-emerald-100 p-6 lg:p-12 text-center overflow-hidden relative">
        {/* Animated Background Rings */}
        {(isConnected || isConnecting) && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 lg:w-96 lg:h-96 border-4 border-emerald-50 rounded-full animate-ping opacity-20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 lg:w-[30rem] lg:h-[30rem] border-2 border-emerald-50 rounded-full animate-ping [animation-delay:0.5s] opacity-10"></div>
          </div>
        )}

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-6 lg:mb-10">
            <div className={`w-20 h-20 lg:w-32 lg:h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${
              errorMessage ? 'bg-red-100 border-2 border-red-500' :
              isConnected ? 'bg-emerald-600 scale-105' : isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-slate-100'
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
            
            <h2 className="mt-6 lg:mt-8 text-xl lg:text-2xl font-black text-slate-800 tracking-tighter italic">
              {errorMessage ? 'Masalah Teknis' : isConnected ? 'Suara Aktif' : isConnecting ? 'Menghubungkan...' : 'Eksplorasi Suara'}
            </h2>
            {errorMessage && (
              <p className="mt-2 text-[10px] lg:text-xs font-bold text-red-500 uppercase tracking-widest bg-red-50 px-4 py-1.5 rounded-full border border-red-100 animate-shimmer">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="space-y-4 mb-6 lg:mb-10 min-h-[100px] flex flex-col justify-center">
            {transcription.user && (
              <div className="p-4 lg:p-6 bg-slate-50 border border-slate-100 rounded-2xl lg:rounded-3xl text-left animate-in slide-in-from-left-4">
                <p className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 lg:mb-2">Mendengar Anda:</p>
                <p className="text-xs lg:text-sm font-semibold text-slate-700 italic">"{transcription.user}"</p>
              </div>
            )}
            
            {transcription.ai && (
              <div className="p-4 lg:p-6 bg-emerald-50 border border-emerald-100 rounded-2xl lg:rounded-3xl text-left animate-message">
                <p className="text-[7px] lg:text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 lg:mb-2">Asisten Menjawab:</p>
                <p className="text-xs lg:text-sm font-black text-emerald-900 leading-relaxed">{transcription.ai}</p>
              </div>
            )}

            {!transcription.user && !transcription.ai && !isConnecting && !errorMessage && (
              <p className="text-[10px] lg:text-xs font-medium text-slate-400 italic">
                {isConnected ? 'Sapa asisten untuk memulai percakapan...' : 'Klik tombol di bawah untuk memulai sesi suara'}
              </p>
            )}
          </div>

          <button
            onClick={isConnected ? stopSession : startSession}
            disabled={isConnecting}
            className={`w-full py-4 lg:py-5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-sm uppercase tracking-widest transition-all shadow-xl border-b-4 ${
              isConnected 
                ? 'bg-red-500 text-white border-red-800' 
                : 'bg-emerald-700 text-white border-emerald-900'
            } ${isConnecting ? 'opacity-50' : 'active:translate-y-1 active:border-b-0 hover:brightness-110'}`}
          >
            {isConnected ? 'Matikan Mikrofon' : isConnecting ? 'Memulai...' : errorMessage ? 'Coba Lagi' : 'Mulai Percakapan'}
          </button>
        </div>
      </div>
      
      <div className="mt-6 lg:mt-8 flex items-center space-x-2 opacity-40">
        <div className={`w-2 h-2 rounded-full animate-pulse ${errorMessage ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
        <p className="text-[7px] lg:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {errorMessage ? 'Node Offline' : 'Live Research Node'}
        </p>
      </div>
    </div>
  );
};

export default LiveVoiceSearch;
