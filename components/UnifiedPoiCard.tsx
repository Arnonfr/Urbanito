import React, { useState, useEffect, useRef } from 'react';
import { POI, UserPreferences, Route } from '../types';
import {
  Loader2, ScrollText, MapPin, Headphones, ChevronLeft, ArrowRight, ArrowLeft,
  Heart, BookOpen, Type as TypeIcon, ExternalLink, ChevronRight, Maximize2, X, Info, Building, Footprints,
  Play, Pause, Zap, User
} from 'lucide-react';
import { CATEGORY_LABELS_HE } from './RouteOverview';
import { GoogleImage } from './GoogleImage';
import { useAudio } from '../contexts/AudioContext';
import { usePremium } from '../contexts/PremiumContext';
import { PremiumLockOverlay } from './PremiumLockOverlay';
import { Sparkles, MapPinCheck } from 'lucide-react';
import { getDistanceFromLatLonInMeters } from '../utils/geocoding';

interface Props {
  poi: POI;
  route: Route;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalCount: number;
  preferences: UserPreferences;
  onUpdatePreferences: (p: UserPreferences) => void;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
  showToast?: (m: string, t?: 'success' | 'error') => void;
  isSaved?: boolean;
  onSave?: () => void;
  userLocation?: { lat: number, lng: number } | null;
}

export const UnifiedPoiCard: React.FC<Props> = ({
  poi, route, onClose, preferences, isExpanded, setIsExpanded, onNext, onPrev, currentIndex, totalCount, showToast, isSaved, onSave, userLocation
}) => {
  const isHe = preferences.language === 'he';

  const { playText, stop, pause, resume, isPlaying, currentItem, progress, playbackRate } = useAudio();
  const { isPremium } = usePremium();
  const isCurrentPoiPlaying = isPlaying && (currentItem?.poiId === poi.id || currentItem?.id === poi.id);

  const [fontLevel, setFontLevel] = useState<0 | 1 | 2>(0);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  // Data comes fully from props now (managed by App.tsx pre-fetching)
  const extendedData = poi; // Use poi as extendedData since fields are merged

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null || touchStartX.current === null) return;

    const touchY = e.changedTouches[0].clientY;
    const touchX = e.changedTouches[0].clientX;
    const distY = touchStart.current - touchY;
    const distX = touchStartX.current - touchX;

    // Ignore if horizontal scroll was dominant
    if (Math.abs(distX) > Math.abs(distY) || Math.abs(distX) > 30) {
      touchStart.current = null;
      touchStartX.current = null;
      return;
    }

    if (distY > 80) setIsExpanded(true);
    else if (distY < -80) setIsExpanded(false);

    touchStart.current = null;
    touchStartX.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = scrollRef.current?.scrollTop || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const dy = e.clientY - dragStartY.current;
    scrollRef.current.scrollTop = dragStartScrollTop.current - dy;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const totalDy = e.clientY - dragStartY.current;
    if (Math.abs(totalDy) > 60) {
      if (totalDy < -60 && !isExpanded) setIsExpanded(true);
      if (totalDy > 60 && isExpanded && (!scrollRef.current || scrollRef.current.scrollTop <= 10)) setIsExpanded(false);
    }
  };

  const openInGoogleMaps = () => {
    if (poi.googlePlaceId) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name)}&query_place_id=${poi.googlePlaceId}`;
      window.open(url, '_blank');
      return;
    }
    const query = `${poi.name}, ${route.city || ''}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const handleAudioClick = () => {
    if (isCurrentPoiPlaying) {
      stop();
      return;
    }
    const text = poi.historicalAnalysis || poi.description || poi.summary || poi.narrative || poi.name;
    playText(text, preferences.language, poi.id, 'high');
  };

  // Localization Logic
  let translatedName = poi.name;
  let originalName = "";

  if (isHe) {
    if (poi.content?.name_he) translatedName = poi.content.name_he;
    else if ((poi as any).data?.name_he) translatedName = (poi as any).data.name_he;

    if (poi.content?.name_en) originalName = poi.content.name_en;
    else if ((poi as any).data?.name_en) originalName = (poi as any).data.name_en;
    else if (poi.name !== translatedName) originalName = poi.name;
  } else {
    if (poi.content?.name_en) translatedName = poi.content.name_en;
    else if ((poi as any).data?.name_en) translatedName = (poi as any).data.name_en;
  }

  const parenMatch = translatedName.match(/(.*?)\s*\((.*?)\)/);
  const mainTitle = parenMatch ? parenMatch[1].trim() : translatedName;
  const subTitle = parenMatch ? parenMatch[2].trim() : (originalName !== mainTitle ? originalName : "");

  const fontClasses = {
    0: 'text-base font-normal',
    1: 'text-xl font-normal leading-relaxed',
    2: 'text-3xl font-normal leading-loose'
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[5000] flex flex-col shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${isExpanded ? 'h-[96dvh]' : 'h-[420px]'} bg-white/50 backdrop-blur-xl border-t border-white/40 overflow-hidden`}
      dir={isHe ? 'rtl' : 'ltr'} style={{ borderRadius: isExpanded ? '0' : '24px 24px 0 0' }}
      onTouchStart={(e) => {
        const touchY = e.targetTouches[0].clientY;
        const rect = e.currentTarget.getBoundingClientRect();
        // Allow swipe only from the top 100px (header/image area)
        const target = e.target as HTMLElement;

        // Ignore if clicking a button
        if (target.closest('button') || target.closest('input')) {
          touchStart.current = null;
          touchStartX.current = null;
          return;
        }

        if (touchY - rect.top < 150) {
          touchStart.current = touchY;
          touchStartX.current = e.targetTouches[0].clientX;
        } else {
          touchStart.current = null;
          touchStartX.current = null;
        }
      }} onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative pb-32">
        <div className={`w-full relative transition-all duration-500 ${isExpanded ? 'h-72' : 'h-48'} bg-slate-900 group`}>
          <GoogleImage query={poi.name} lat={poi.lat} lng={poi.lng} className="w-full h-full opacity-70 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />

          <div className="absolute top-2 inset-x-0 h-10 flex items-start justify-center cursor-pointer z-20" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="w-12 h-1 bg-white/40 rounded-full mt-3" />
          </div>

          <div className="absolute top-8 inset-x-6 flex items-center justify-between z-10">
            <div className={isHe ? "order-1" : "order-2"}>
              <button onClick={onClose} className="h-12 px-4 flex items-center gap-2 bg-black/40 backdrop-blur-md text-white rounded-[8px] border border-white/10 transition-transform active:scale-90 text-[11px] font-medium uppercase tracking-widest">
                {isHe ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                <span>{isHe ? "חזרה" : "Back"}</span>
              </button>
            </div>

            <div className={`flex bg-black/30 backdrop-blur-md rounded-[8px] p-1 border border-white/10 ${isHe ? "order-2" : "order-1"}`}>
              <button onClick={() => setFontLevel(prev => (prev + 1) % 3 as 0 | 1 | 2)} className={`w-10 h-10 flex items-center justify-center rounded-[8px] transition-all ${fontLevel > 0 ? 'bg-white text-slate-900' : 'text-white hover:text-white/80'}`}>
                {fontLevel === 0 && <TypeIcon size={18} />}
                {fontLevel === 1 && <span className="text-lg font-bold">A+</span>}
                {fontLevel === 2 && <span className="text-xl font-bold">A++</span>}
              </button>
              <button onClick={openInGoogleMaps} className="w-10 h-10 flex items-center justify-center text-white hover:text-white/80 rounded-[8px]">
                <MapPin size={18} />
              </button>
              <button onClick={handleAudioClick} className={`w-10 h-10 flex items-center justify-center rounded-[8px] relative transition-all active:scale-95 ${isCurrentPoiPlaying ? 'bg-indigo-600 text-white shadow-lg' : 'text-white hover:text-white/80'}`}>
                <Headphones size={18} className={isCurrentPoiPlaying ? 'animate-pulse' : ''} />
                {isCurrentPoiPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </span>
                )}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onSave?.(); }} className={`w-10 h-10 flex items-center justify-center rounded-[8px] transition-all ${isSaved ? 'text-rose-400' : 'text-white hover:text-white/80'}`}>
                <Heart size={18} className={isSaved ? 'fill-current' : ''} />
              </button>
            </div>
          </div>

          <div className="absolute bottom-6 inset-x-8 flex flex-col text-right">
            <span className="text-[#14B8A6] font-semibold uppercase text-[9px] tracking-[0.2em] mb-1">
              {poi.category && CATEGORY_LABELS_HE[poi.category]}

              {currentIndex > 0 && poi.travelFromPrevious && (
                <>
                  <span className="mx-2 text-white/30">|</span>
                  <span className="text-white/80 flex items-center gap-1.5 inline-flex">
                    <Footprints size={10} />
                    {poi.travelFromPrevious.distance} • {poi.travelFromPrevious.duration}
                  </span>
                </>
              )}
            </span>
            <h2 className="text-2xl font-semibold text-white leading-tight">{mainTitle}</h2>
            {subTitle && <span className="text-[11px] font-normal text-white/50 mt-0.5 tracking-wide uppercase">{subTitle}</span>}

            {/* Proximity Badge */}
            {userLocation && getDistanceFromLatLonInMeters(userLocation.lat, userLocation.lng, poi.lat, poi.lng) < 50 && (
              <div className="flex items-center gap-1.5 mt-2 text-[#14B8A6] animate-pulse">
                <MapPinCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isHe ? "אתה כאן!" : "You are here!"}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsImageFullscreen(true)}
            className="absolute bottom-4 left-6 w-9 h-9 bg-black/40 text-white rounded-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        <div className="px-8 py-8 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ScrollText size={18} className="text-[#6366F1]" />
                {isHe ? "סיפור המקום המלא" : "The Full Story"}
              </h3>
            </div>
            <div className={`text-slate-800 leading-relaxed transition-all duration-300 ${fontClasses[fontLevel]}`}>
              {!poi.isFullyLoaded && !poi.description && !poi.historicalAnalysis && !poi.summary ? (
                <div className="space-y-6">
                  <p className="opacity-90 leading-relaxed text-lg">
                    {poi.summary || poi.description || (isHe ? 'מאתר מידע על המקום...' : 'Fetching location details...')}
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    <span className="text-sm text-indigo-600 font-medium animate-pulse">
                      {isHe ? 'ה-AI חוקר את ההיסטוריה המעמיקה...' : 'AI is researching deep history...'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-700">
                  {(() => {
                    const mainContent = extendedData?.historicalAnalysis || poi.description || (isHe ? "אין מידע נוסף זמין עבור מקום זה." : "No additional details available for this location.");
                    const paragraphs = mainContent ? mainContent.split('\n').filter((p: string) => p.trim()) : [];

                    return paragraphs.map((paragraph: string, idx: number) => {
                      const isHeading = paragraph.length < 60 && (
                        paragraph.endsWith(':') ||
                        paragraph === paragraph.toUpperCase() ||
                        /^[\u0590-\u05FF\s]{3,40}:$/.test(paragraph)
                      );

                      if (isHeading) {
                        return (
                          <h4 key={idx} className="text-lg font-bold text-slate-900 mt-8 mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-400" />
                            {paragraph.replace(/:$/, '')}
                          </h4>
                        );
                      }

                      return (
                        <p key={idx} className="opacity-90 leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    });
                  })()}

                  {extendedData?.sections?.map((section: any, idx: number) => (
                    <div key={idx} className="space-y-4 pt-8 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-indigo-600 flex items-center gap-2">
                        {idx % 3 === 0 ? <Building size={16} /> : idx % 3 === 1 ? <Zap size={16} /> : <Info size={16} />}
                        {section.title}
                      </h4>
                      {section.content.split('\n').filter((p: string) => p.trim()).map((para: string, pIdx: number) => (
                        <p key={pIdx} className="opacity-90 leading-relaxed">
                          {para}
                        </p>
                      ))}
                    </div>
                  ))}

                  {extendedData?.sources && extendedData.sources.length > 0 && (
                    <div className="pt-10 border-t-2 border-slate-100">
                      <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BookOpen size={14} className="text-indigo-500" />
                        {isHe ? "מקורות להרחבה" : "Sources for Further Reading"}
                      </h4>
                      <div className="space-y-2">
                        {extendedData.sources.map((source: any, sIdx: number) => (
                          <a
                            key={sIdx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-3 bg-slate-50 hover:bg-indigo-50 text-[12px] text-slate-700 hover:text-indigo-700 font-medium rounded-[8px] transition-all border border-slate-100 hover:border-indigo-200 flex items-center justify-between group"
                          >
                            <span className="flex-1">{source.title}</span>
                            <ExternalLink size={12} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Premium Content Section */}
                  {poi.premium && (
                    <div className="space-y-6 pt-8 border-t-2 border-amber-100">
                      <h4 className="text-sm font-bold text-amber-600 flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" />
                        {isHe ? "תוכן בלעדי לפרימיום" : "Premium Exclusive"}
                      </h4>

                      {/* Deep Narrative */}
                      {poi.premium.deepNarrative && (
                        <div className="relative">
                          {isPremium ? (
                            <div className="space-y-4">
                              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {isHe ? "הסיפור המעמיק" : "Deep Dive"}
                              </h5>
                              {poi.premium.deepNarrative.split('\n').filter((p: string) => p.trim()).map((para: string, pIdx: number) => (
                                <p key={pIdx} className="opacity-90 leading-relaxed">{para}</p>
                              ))}
                            </div>
                          ) : (
                            <div className="relative h-32 bg-gradient-to-t from-slate-100 to-slate-50 rounded-lg overflow-hidden">
                              <p className="p-4 text-slate-600 blur-[2px] line-clamp-3">
                                {poi.premium.deepNarrative.slice(0, 200)}...
                              </p>
                              <PremiumLockOverlay
                                message={isHe ? "הסיפור המלא" : "Full Story"}
                                compact
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hidden Story */}
                      {poi.premium.hiddenStory && (
                        <div className="relative mt-6">
                          {isPremium ? (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                              <h5 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                                {isHe ? "סיפור נסתר" : "Hidden Story"}
                              </h5>
                              <p className="text-slate-700 leading-relaxed">
                                {poi.premium.hiddenStory}
                              </p>
                            </div>
                          ) : (
                            <div className="relative h-24 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg overflow-hidden border border-amber-200">
                              <p className="p-4 text-slate-600 blur-[2px] line-clamp-2">
                                {poi.premium.hiddenStory.slice(0, 100)}...
                              </p>
                              <PremiumLockOverlay
                                message={isHe ? "סיפור נסתר" : "Secret Story"}
                                compact
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <footer className="shrink-0 bg-white border-t border-slate-100 p-4 grid grid-cols-2 gap-3 h-24 mb-[env(safe-area-inset-bottom)] relative z-30">
        <button
          onClick={onPrev}
          disabled={currentIndex <= 0}
          className="h-14 bg-[#0F172A] text-white disabled:opacity-20 rounded-[12px] font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          {isHe ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          <span>{isHe ? "תחנה קודמת" : "Previous"}</span>
        </button>
        <button
          onClick={onNext}
          disabled={currentIndex >= totalCount - 1}
          className="h-14 bg-[#0F172A] text-white disabled:opacity-20 rounded-[12px] font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <span>{isHe ? "תחנה הבאה" : "Next Station"}</span>
          {isHe ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </footer>

      {isImageFullscreen && (
        <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setIsImageFullscreen(false)}>
          <GoogleImage query={poi.name} className="max-w-full max-h-[85vh] object-contain rounded-[8px]" size="large" />
          <button className="absolute top-8 right-8 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center">
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
};
