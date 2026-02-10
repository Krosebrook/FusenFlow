
import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { MODEL_LIVE } from '../constants';

export const useLivePartner = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);

  const stop = useCallback(() => {
    if (sessionRef.current) sessionRef.current.close();
    setIsActive(false);
  }, []);

  const start = useCallback(async (systemInstruction: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = audioContextRef.current.createGain();
    outputNode.connect(audioContextRef.current.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
      model: MODEL_LIVE,
      callbacks: {
        onopen: () => {
          setIsActive(true);
          const inputCtx = new AudioContext({ sampleRate: 16000 });
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
            sessionPromise.then(s => s.sendRealtimeInput({ 
              media: { data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))), mimeType: 'audio/pcm;rate=16000' } 
            }));
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);
        },
        onmessage: async (msg: any) => {
          const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audio && audioContextRef.current) {
            const bytes = atob(audio);
            const dataInt16 = new Int16Array(new Uint8Array(bytes.length).map((_, i) => bytes.charCodeAt(i)).buffer);
            const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
            const channel = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channel[i] = dataInt16[i] / 32768.0;
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            const start = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
            source.start(start);
            nextStartTimeRef.current = start + buffer.duration;
          }
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
      }
    });

    sessionRef.current = await sessionPromise;
  }, []);

  return { isActive, start, stop, transcription };
};
