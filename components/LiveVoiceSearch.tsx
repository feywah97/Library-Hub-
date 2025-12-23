
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface Props {
  isActive: boolean;
}

const LiveVoiceSearch: React.FC<Props> = ({ isActive }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcription, setTranscription] = useState<{user: string, ai: string}>({ user: '', ai: '' });
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Helper functions
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

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env.API_KEY as string) });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          systemInstruction: 'Anda adalah asisten suara perpustakaan BBPP Lembang yang ramah. Bantu pengguna menemukan informasi pertanian melalui percakapan suara yang informatif dan efisien.',
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
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              setIsSpeaking(true);
              const base64Data = message.serverContent.modelTurn.parts[0].inlineData.data;
              const ctx = outAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Data), ctx, 24000);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }

            if (message.serverContent?.inputTranscription) {
              setTranscription(prev => ({ ...prev, user: message.serverContent?.inputTranscription?.text || '' }));
            }
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => ({ ...prev, ai: prev.ai + (message.serverContent?.outputTranscription?.text || '') }));
            }
            if (message.serverContent?.turnComplete) {
              // Reset transcriptions for next turn if needed
            }
          },
          onclose: () => {
            setIsConnected(false);
            setIsConnecting(false);
          },
          onerror: (e) => {
            console.error("Live API Error:", e);
            setIsConnecting(false);
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to connect to Live API", err);
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
    <div className="flex flex-col items-center justify-center h-full p-8 animate-message">
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl border border-emerald-100 p-12 text-center overflow-hidden relative">
        {/* Animated Background Rings */}
        {(isConnected || isConnecting) && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-4 border-emerald-50 rounded-full animate-ping opacity-20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] border-2 border-emerald-50 rounded-full animate-ping [animation-delay:0.5s] opacity-10"></div>
          </div>
        )}

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isConnected ? 'bg-emerald-600 scale-110' : isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-slate-100'
            }`}>
              {isConnected ? (
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`w-1.5 bg-white rounded-full animate-bounce h-${i % 2 === 0 ? '8' : '12'}`} style={{animationDelay: `${i * 0.1}s`}}></div>
                  ))}
                </div>
              ) : (
                <svg className={`h-16 w-16 ${isConnecting ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
            
            <h2 className="mt-8 text-2xl font-black text-slate-800 tracking-tighter italic">
              {isConnected ? 'Pustakawan Suara Aktif' : isConnecting ? 'Menghubungkan...' : 'Eksplorasi Suara'}
            </h2>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">
              Gemini 2.5 Native Audio Live
            </p>
          </div>

          <div className="space-y-6 mb-10">
            {transcription.user && (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-left">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Mendengar Anda:</p>
                <p className="text-sm font-semibold text-slate-700 italic">"{transcription.user}"</p>
              </div>
            )}
            
            {transcription.ai && (
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-left animate-message">
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-2">Asisten Menjawab:</p>
                <p className="text-sm font-black text-emerald-900 leading-relaxed">{transcription.ai}</p>
              </div>
            )}
          </div>

          <button
            onClick={isConnected ? stopSession : startSession}
            disabled={isConnecting}
            className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl border-b-4 ${
              isConnected 
                ? 'bg-red-500 text-white border-red-800 hover:bg-red-600' 
                : 'bg-emerald-700 text-white border-emerald-900 hover:bg-emerald-800'
            } ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'active:translate-y-1 active:border-b-0'}`}
          >
            {isConnected ? 'Matikan Mikrofon' : isConnecting ? 'Memulai Sesi...' : 'Mulai Percakapan Suara'}
          </button>
        </div>
      </div>
      
      <div className="mt-8 flex items-center space-x-3 opacity-50">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Latensi Rendah • Real-time Research</p>
      </div>
    </div>
  );
};

export default LiveVoiceSearch;
