
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
      className={`fixed inset-x-4 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-[10000] 
        ${isExpanded
          ? 'bottom-[20px] h-[40dvh]'
          : 'bottom-[calc(100px+env(safe-area-inset-bottom))] h-20 active:scale-[0.98]'
        }`}
    >
      {/* Progress Bar (Visible ONLY when collapsed) */}
      {!isExpanded && (
        <div className="h-1.5 w-full bg-white/10 relative">
          <div
            className="h-full bg-indigo-500 transition-all duration-300 relative"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className={`flex-1 flex flex-col ${isExpanded ? 'p-6' : 'px-4 justify-center'}`}>
        {/* Top Header - Compact or Expanded */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white/10'}`}
            >
              <Headphones size={24} className={isPlaying ? 'animate-pulse' : ''} />
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold leading-tight truncate">
                  {isPlaying ? (isHe ? 'מתנגן כעת' : 'Playing') : (isHe ? 'מושהה' : 'Paused')}
                </span>
                {!isExpanded && (
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 font-medium">{playbackRate}x</span>
                )}
              </div>
              <span className={`text-white/60 truncate transition-all ${isExpanded ? 'text-sm mt-1' : 'text-[11px] max-w-[180px]'}`}>
                {poiName}
              </span>
            </div>
          </div>

          {!isExpanded && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPlaying) pause();
                  else resume();
                }}
                className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
                title={isHe ? (isPlaying ? 'השהה' : 'נגן') : (isPlaying ? 'Pause' : 'Play')}
              >
                {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); stop(); }}
                className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {isExpanded && (
            <button onClick={() => setIsExpanded(false)} className="p-2 text-white/40 hover:text-white">
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
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-lg active:[&::-webkit-slider-thumb]:scale-125 transition-all outline-none"
                style={{
                  background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${isSeeking ? seekValue : progress}%, rgba(255,255,255,0.1) ${isSeeking ? seekValue : progress}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] text-white/40 mt-2 font-medium tracking-wide" dir="ltr">
                <span>{formatTime(isSeeking ? (seekValue / 100) * duration : currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-8 mb-8" dir="ltr">
              <button
                onClick={() => skip(-10)}
                className="relative p-3 text-white/80 active:scale-90 transition-all flex flex-col items-center justify-center group"
              >
                <RotateCcw size={28} className="group-active:-rotate-45 transition-transform" />
                <span className="absolute text-[8px] font-bold mt-[2px]">10</span>
              </button>

              <button
                onClick={() => isPlaying ? pause() : resume()}
                className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all hover:bg-indigo-500"
              >
                {isPlaying ? <Pause size={36} className="fill-current" /> : <Play size={36} className="fill-current ml-1" />}
              </button>

              <button
                onClick={() => skip(10)}
                className="relative p-3 text-white/80 active:scale-90 transition-all flex flex-col items-center justify-center group"
              >
                <RotateCw size={28} className="group-active:rotate-45 transition-transform" />
                <span className="absolute text-[8px] font-bold mt-[2px]">10</span>
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex flex-col gap-3 mb-6">
              <label className={`text-[10px] font-bold text-white/40 uppercase tracking-widest ${isHe ? 'text-right' : 'text-left'}`}>
                {isHe ? 'מהירות נגינה' : 'Playback Speed'}
              </label>
              <div className="flex bg-white/5 p-1 rounded-xl" dir="ltr">
                {rates.map(r => (
                  <button
                    key={r}
                    onClick={() => setPlaybackRate(r)}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${playbackRate === r ? 'bg-white text-slate-900 shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-center pb-2 opacity-50">
              <p className="text-[9px] text-white/60 font-medium">
                {isHe ? 'כן, הנגן הזה לא מושלם עדיין, אבל אנחנו עובדים על זה ;)' : 'Yeah, this player isn\'t perfect yet, but we\'re working on it ;)'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
