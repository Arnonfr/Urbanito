
import React, { useState } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { Headphones, Pause, Play, X, RotateCcw, RotateCw, FastForward, SkipBack, SkipForward } from 'lucide-react';
import { Route } from '../types';

interface Props {
  isHe: boolean;
  currentRoute: Route | null;
  isVisible?: boolean;
}

export const GlobalAudioPlayer: React.FC<Props> = ({ isHe, currentRoute, isVisible = true }) => {
  const { currentItem, isPlaying, pause, resume, stop, progress, playbackRate, setPlaybackRate, skip, seek, currentTime, duration } = useAudio();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentItem || !isVisible) return null;

  // Find POI name if it belongs to a route
  const poiName = currentRoute?.pois.find(p => p.id === currentItem.poiId)?.name || currentItem.text.slice(0, 30);

  const rates = [0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      className={`fixed inset-x-4 bg-white/95 backdrop-blur-md text-slate-900 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-slate-100/50 flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-[10000] 
        ${isExpanded
          ? 'bottom-[20px] h-auto max-h-[70vh] pb-6'
          : 'bottom-[calc(110px+env(safe-area-inset-bottom))] h-24 active:scale-[0.99]'
        }`}
    >
      {/* Progress Bar (Visible ONLY when collapsed) */}
      {
        !isExpanded && (
          <div className="h-1 w-full bg-slate-100 relative">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300 relative"
              style={{ width: `${progress}%` }}
            />
          </div>
        )
      }

      <div className={`flex-1 flex flex-col ${isExpanded ? 'p-6' : 'px-4 pt-3'}`}>
        {/* Top Header - Compact or Expanded */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-600 shadow-lg shadow-indigo-200 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              <Headphones size={24} className={isPlaying ? 'animate-pulse' : ''} />
            </button>
            <div className="flex flex-col min-w-0 flex-1 px-3 justify-center">
              <span className="text-slate-800 text-[14px] font-bold truncate leading-tight w-full block">
                {poiName || (isHe ? 'טוען...' : 'Loading...')}
              </span>
              <span className="text-[11px] font-medium text-slate-500 truncate leading-none mt-1">
                {isPlaying ? (isHe ? 'מתנגן כעת' : 'Playing Now') : (isHe ? 'מושהה' : 'Paused')}
              </span>
            </div>

            {!isExpanded && (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPlaying) pause();
                    else resume();
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 active:bg-slate-200 transition-colors shadow-sm"
                  title={isHe ? (isPlaying ? 'השהה' : 'נגן') : (isPlaying ? 'Pause' : 'Play')}
                >
                  {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); stop(); }}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 active:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {isExpanded && (
              <button onClick={() => setIsExpanded(false)} className="p-2 text-slate-400 hover:text-slate-600 active:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            )}
          </div>

          {/* Expanded Controls */}
          {isExpanded && (
            <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-300 px-2" dir={isHe ? 'rtl' : 'ltr'}>

              {/* Seeker / Slider */}
              <div className="mb-6 px-1" dir="ltr">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={isSeeking ? seekValue : (progress || 0)}
                  onChange={(e) => {
                    setSeekValue(parseFloat(e.target.value));
                    if (!isSeeking) setIsSeeking(true);
                  }}
                  onMouseUp={() => {
                    seek(seekValue);
                    setTimeout(() => setIsSeeking(false), 100);
                  }}
                  onTouchEnd={() => {
                    seek(seekValue);
                    setTimeout(() => setIsSeeking(false), 100);
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-lg active:[&::-webkit-slider-thumb]:scale-125 transition-all outline-none"
                  style={{
                    background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${isSeeking ? seekValue : progress}%, #e2e8f0 ${isSeeking ? seekValue : progress}%, #e2e8f0 100%)`
                  }}
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-medium tracking-wide" dir="ltr">
                  <span>{formatTime(isSeeking ? (seekValue / 100) * duration : currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-10 mb-8" dir="ltr">
                <button
                  onClick={() => skip(-10)}
                  className="relative p-3 text-slate-400 hover:text-slate-600 active:scale-90 transition-all flex flex-col items-center justify-center group"
                >
                  <RotateCcw size={28} className="group-active:-rotate-45 transition-transform" />
                  <span className="absolute text-[8px] font-bold mt-[2px] text-slate-400">10</span>
                </button>

                <button
                  onClick={() => isPlaying ? pause() : resume()}
                  className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] active:scale-95 transition-all hover:bg-indigo-500 text-white"
                >
                  {isPlaying ? <Pause size={36} className="fill-current" /> : <Play size={36} className="fill-current ml-1" />}
                </button>

                <button
                  onClick={() => skip(10)}
                  className="relative p-3 text-slate-400 hover:text-slate-600 active:scale-90 transition-all flex flex-col items-center justify-center group"
                >
                  <RotateCw size={28} className="group-active:rotate-45 transition-transform" />
                  <span className="absolute text-[8px] font-bold mt-[2px] text-slate-400">10</span>
                </button>
              </div>

              {/* Disclaimer */}
              <div className="text-center pb-2 opacity-100">
                <p className="text-[9px] text-slate-400 font-medium">
                  {isHe ? 'כן, הנגן הזה לא מושלם עדיין, אבל אנחנו עובדים על זה ;)' : 'Yeah, this player isn\'t perfect yet, but we\'re working on it ;)'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
