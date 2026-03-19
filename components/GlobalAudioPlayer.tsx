
import React, { useState } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { Headphones, Pause, Play, X, RotateCcw, RotateCw, ChevronDown } from 'lucide-react';
import { Route } from '../types';
import { GoogleImage } from './GoogleImage';

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
  // Find POI name if it belongs to a route
  const foundPoi = currentRoute?.pois.find(p => p.id === currentItem.poiId);
  const rawTitle = foundPoi?.name || currentItem.text.slice(0, 30);

  // Parse title: "Hebrew Name (Original Name)" -> start split
  const parenMatch = rawTitle.match(/(.*?)\s*\((.*?)\)/);
  const hebrewName = parenMatch ? parenMatch[1].trim() : rawTitle;
  const originalName = parenMatch ? parenMatch[2].trim() : "";

  const displayTitle = hebrewName;
  const displaySubtitle = originalName;

  // Use GoogleImage query constructed from city + POI name
  const imageQuery = foundPoi ? `${foundPoi.name} ${currentRoute?.city || ''}` : rawTitle;

  const rates = [0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      className={`fixed z-[9999] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] 
        ${isExpanded
          ? 'inset-x-4 bottom-6 h-[70vh] rounded-[32px] bg-white shadow-2xl'
          : 'inset-x-4 bottom-24 h-20 rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] active:scale-[0.98]'
        } flex flex-col overflow-hidden`}
    >
      {/* Progress Bar (Visible ONLY when collapsed) */}
      {
        !isExpanded && (
          <div className="h-1 w-full bg-slate-50 relative opacity-50">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 relative rounded-r-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )
      }

      <div className={`flex-1 flex flex-col ${isExpanded ? 'p-0' : 'px-4 pt-0 justify-center'}`}>

        {/* Expanded Header / Collapse Button */}
        {isExpanded && (
          <div className="flex items-center justify-between p-6 pb-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronDown size={24} />
            </button>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              {isHe ? 'נגן' : 'PLAYER'}
            </span>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        )}

        {/* Top Header - Compact or Expanded */}
        <div className={`flex items-center justify-between ${isExpanded ? 'px-6 mt-4 flex-col text-center' : ''}`}>

          <div className={`flex items-center ${isExpanded ? 'flex-col gap-4' : 'gap-3'} overflow-hidden w-full`}>
            {/* Icon Box / Image */}
            <button
              onClick={(e) => {
                if (!isExpanded) {
                  e.stopPropagation();
                  setIsExpanded(true);
                }
              }}
              className={`flex items-center justify-center transition-all shadow-sm overflow-hidden relative ${isExpanded
                ? 'w-full aspect-[4/3] rounded-[24px] mb-6 shadow-lg'
                : 'w-12 h-12 rounded-[12px] bg-slate-100 shrink-0'
                } ${isPlaying && !isExpanded ? 'ring-2 ring-indigo-500/20' : ''}`}
            >
              {currentItem && (
                <div className={`w-full h-full relative`}>
                  <GoogleImage
                    query={imageQuery}
                    className="w-full h-full object-cover"
                    existingUrl={foundPoi?.imageUrl}
                  />
                  {/* Gradient overlay for expanded view text visibility if we put text over it? No, text is below. */}
                  {/* Play overlay for expanded view? */}
                  {!isPlaying && isExpanded && (
                    <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Play size={32} className="fill-white text-white ml-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </button>

            {/* Texts */}
            <div className={`flex flex-col min-w-0 flex-1 justify-center ${isExpanded ? 'items-center text-center px-4' : 'items-start'}`}>
              <span className={`text-slate-900 font-bold leading-tight line-clamp-2 ${isExpanded ? 'text-2xl mb-1' : 'text-[14px]'}`}>
                {displayTitle || (isHe ? 'טוען...' : 'Loading...')}
              </span>
              {displaySubtitle && (
                <span className={`font-medium text-slate-500 leading-snug ${isExpanded ? 'text-lg' : 'text-[12px] line-clamp-1'}`} dir="ltr">
                  {displaySubtitle}
                </span>
              )}
              {isExpanded && (
                <span className="font-medium text-indigo-500 text-sm mt-3 bg-indigo-50 px-3 py-1 rounded-full">
                  {isPlaying ? (isHe ? 'מתנגן כעת' : 'Playing Now') : (isHe ? 'מושהה' : 'Paused')}
                </span>
              )}
            </div>

            {/* Compact Controls (Play/Pause/Close) */}
            {!isExpanded && (
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPlaying) pause();
                    else resume();
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-800 active:bg-slate-200 transition-colors"
                >
                  {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
                </button>

                <div className="w-px h-6 bg-slate-100 mx-1"></div>

                <button
                  onClick={(e) => { e.stopPropagation(); stop(); }}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 active:bg-red-50 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Expanded Controls */}
          {isExpanded && (
            <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-300 px-2 w-full" dir={isHe ? 'rtl' : 'ltr'}>

              {/* Section Header */}
              <div className="flex items-center gap-2 justify-center mb-4 text-indigo-500">
                <Headphones size={18} />
                <span className="text-sm font-semibold">{isHe ? 'סיפור המקום המלא' : 'Full Story'}</span>
              </div>
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

              {/* Playback Speed */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {rates.map(rate => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${playbackRate === rate
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    {rate}x
                  </button>
                ))}
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
