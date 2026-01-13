
import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Play, Pause, SkipForward, SkipBack, ChevronDown, Loader2, MapPin, Maximize2 } from 'lucide-react';
import { AudioState, POI } from '../types';
import { generateSpeech, decodeAudioData } from '../services/geminiService';

interface Props {
  audioState: AudioState;
  setAudioState: (s: AudioState | ((prev: AudioState) => AudioState)) => void;
  onGoToPoi: (id: string) => void;
  pois: POI[];
  isHe: boolean;
  navHidden: boolean;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
}

export const GlobalAudioPlayer: React.FC<Props> = ({ 
  audioState, setAudioState, onGoToPoi, pois, isHe, navHidden, isExpanded, setIsExpanded 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const sourceNode = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(audioState.isPlaying);
  const currentPoi = pois.find(p => p.id === audioState.currentPoiId);

  // Sync ref with state to prevent playback starting if user paused during async generation
  useEffect(() => {
    isPlayingRef.current = audioState.isPlaying;
  }, [audioState.isPlaying]);

  const stopAudio = () => {
    if (sourceNode.current) {
      try {
        sourceNode.current.onended = null;
        sourceNode.current.stop();
      } catch (e) {}
      sourceNode.current = null;
    }
  };

  const playChapter = async (index: number) => {
    stopAudio();
    const chapter = audioState.chapters[index];
    if (!chapter) return;
    
    setIsLoading(true);
    setAudioState(prev => ({ ...prev, currentChapterIndex: index }));

    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioBuffer = await generateSpeech(chapter.script, isHe ? 'he' : 'en');
      
      // CRITICAL CHECK: If user paused while we were generating, don't start playback
      if (!isPlayingRef.current) {
        setIsLoading(false);
        return;
      }

      const decodedBuffer = await decodeAudioData(audioBuffer, audioContext.current, 24000, 1);
      const source = audioContext.current.createBufferSource();
      source.buffer = decodedBuffer;
      source.playbackRate.value = audioState.playbackRate;
      source.connect(audioContext.current.destination);
      sourceNode.current = source;
      
      source.start();
      
      source.onended = () => {
        sourceNode.current = null;
        if (index + 1 < audioState.chapters.length && isPlayingRef.current) {
          playChapter(index + 1);
        } else {
          setAudioState(prev => ({ ...prev, isPlaying: false }));
        }
      };
    } catch (e) {
      console.error("Playback error:", e);
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    } finally {
      setIsLoading(false);
    }
  };

  // Manage playback based on state
  useEffect(() => {
    if (audioState.isPlaying) {
      if (!sourceNode.current && !isLoading) {
        playChapter(audioState.currentChapterIndex);
      }
    } else {
      stopAudio();
    }
  }, [audioState.isPlaying, audioState.currentPoiId]);

  // Handle manual chapter changes while playing
  useEffect(() => {
    if (audioState.isPlaying && isPlayingRef.current) {
      playChapter(audioState.currentChapterIndex);
    }
  }, [audioState.currentChapterIndex]);

  // Sync playback rate
  useEffect(() => {
    if (sourceNode.current) {
      sourceNode.current.playbackRate.value = audioState.playbackRate;
    }
  }, [audioState.playbackRate]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  if (!audioState.currentPoiId || audioState.chapters.length === 0 || !isExpanded) return null;

  return (
    <div 
      dir={isHe ? 'rtl' : 'ltr'}
      className="fixed inset-x-0 bottom-0 h-[85vh] bg-white rounded-t-[3.5rem] shadow-[0_-20px_100px_rgba(0,0,0,0.25)] z-[1000] transition-all duration-500 p-8 flex flex-col pointer-events-auto animate-in slide-in-from-bottom-full"
    >
       <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setIsExpanded(false)} />
       
       <header className="flex items-start justify-between mb-10">
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <Headphones size={18} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{isHe ? "לוח הבקרה" : "AUDIO DASHBOARD"}</span>
             </div>
             <h2 className="text-3xl font-bold text-slate-900 leading-tight truncate">{currentPoi?.name}</h2>
          </div>
          <button onClick={() => setIsExpanded(false)} className="p-4 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 shadow-sm transition-all active:scale-95">
            <ChevronDown size={28} />
          </button>
       </header>

       <div className="flex flex-col items-center gap-8 mb-12">
          <div className="flex items-center gap-10">
            <button 
              onClick={() => {
                if (isHe) {
                  if (audioState.currentChapterIndex < audioState.chapters.length - 1) playChapter(audioState.currentChapterIndex + 1);
                } else {
                  if (audioState.currentChapterIndex > 0) playChapter(audioState.currentChapterIndex - 1);
                }
              }}
              className="p-4 text-slate-200 hover:text-slate-900 disabled:opacity-10 transition-colors" 
              disabled={isHe ? audioState.currentChapterIndex === audioState.chapters.length - 1 : audioState.currentChapterIndex === 0}
            >
              <SkipBack size={40} fill="currentColor" />
            </button>
            <button 
              onClick={() => setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
              className="w-28 h-28 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl transition-all active:scale-90 hover:bg-emerald-600"
            >
              {isLoading ? <Loader2 size={48} className="animate-spin" /> : audioState.isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className={isHe ? "rotate-180" : "ml-2"} />}
            </button>
            <button 
              onClick={() => {
                if (isHe) {
                  if (audioState.currentChapterIndex > 0) playChapter(audioState.currentChapterIndex - 1);
                } else {
                  if (audioState.currentChapterIndex < audioState.chapters.length - 1) playChapter(audioState.currentChapterIndex + 1);
                }
              }}
              className="p-4 text-slate-200 hover:text-slate-900 disabled:opacity-10 transition-colors" 
              disabled={isHe ? audioState.currentChapterIndex === 0 : audioState.currentChapterIndex === audioState.chapters.length - 1}
            >
              <SkipForward size={40} fill="currentColor" />
            </button>
          </div>

          <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1 shadow-inner">
             {[1, 1.25, 1.5, 2].map(rate => (
               <button 
                key={rate} 
                onClick={() => setAudioState(prev => ({ ...prev, playbackRate: rate }))}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${audioState.playbackRate === rate ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {rate}x
               </button>
             ))}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-10">
          {audioState.chapters.map((ch, idx) => (
            <button 
              key={idx}
              onClick={() => playChapter(idx)}
              className={`w-full text-right p-5 rounded-2xl border transition-all flex items-center gap-5 ${audioState.currentChapterIndex === idx ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-slate-200'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${audioState.currentChapterIndex === idx ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                {audioState.currentChapterIndex === idx && isLoading ? <Loader2 size={16} className="animate-spin" /> : <span className="text-sm font-bold">{idx + 1}</span>}
              </div>
              <h4 className={`text-base font-bold flex-1 truncate ${audioState.currentChapterIndex === idx ? 'text-emerald-700' : 'text-slate-700'}`}>{ch.title}</h4>
              {audioState.currentChapterIndex === idx && audioState.isPlaying && <div className="flex gap-0.5 items-end h-3"><div className="w-0.5 bg-emerald-500 animate-[bounce_0.6s_infinite_alternate]" /><div className="w-0.5 bg-emerald-500 animate-[bounce_0.8s_infinite_alternate]" /><div className="w-0.5 bg-emerald-500 animate-[bounce_0.4s_infinite_alternate]" /></div>}
            </button>
          ))}
       </div>

       <button 
        onClick={() => { setIsExpanded(false); onGoToPoi(audioState.currentPoiId!); }}
        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 transition-all hover:bg-emerald-600 shadow-2xl active:scale-95"
       >
         <MapPin size={20} />
         <span>{isHe ? "חזרה למידע על המקום" : "Back to Station Info"}</span>
       </button>
    </div>
  );
};
