
import React, { useState, useEffect, useRef } from 'react';
import { POI, UserPreferences, Route } from '../types';
import { fetchExtendedPoiDetails } from '../services/geminiService';
import {
  Loader2, ScrollText, MapPin, Headphones, ChevronLeft, ArrowRight, ArrowLeft,
  Heart, BookOpen, Type as TypeIcon, ExternalLink, ChevronRight, Maximize2, X, Info, Sparkles, Building
} from 'lucide-react';
import { CATEGORY_LABELS_HE } from './RouteOverview';
import { GoogleImage } from './GoogleImage';

interface Props {
  poi: POI; route: Route; onClose: () => void; onNext: () => void; onPrev: () => void;
  currentIndex: number; totalCount: number; preferences: UserPreferences; onUpdatePreferences: (p: UserPreferences) => void;
  isExpanded: boolean; setIsExpanded: (v: boolean) => void;
  showToast?: (m: string, t?: 'success' | 'error') => void;
}

export const UnifiedPoiCard: React.FC<Props> = ({
  poi, route, onClose, preferences, isExpanded, setIsExpanded, onNext, onPrev, currentIndex, totalCount, showToast
}) => {
  const isHe = preferences.language === 'he';
  const [extendedData, setExtendedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    setExtendedData(null);
    setIsLoading(true);
    const loadData = async () => {
      const data = await fetchExtendedPoiDetails(poi.name, route.city, preferences, poi.lat, poi.lng);
      if (data) {
        setExtendedData(data);
        setIsLoading(false);
      }

    };
    loadData();
  }, [poi.id, preferences.language]);

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const distance = touchStart.current - e.changedTouches[0].clientY;
    if (distance > 60) setIsExpanded(true);
    else if (distance < -60) setIsExpanded(false);
    touchStart.current = null;
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}`;
    window.open(url, '_blank');
  };

  const handleAudioClick = () => {
    if (showToast) showToast(isHe ? "הדרכה קולית תגיע בקרוב!" : "Audio guide coming soon!");
  };

  const parenMatch = poi.name.match(/(.*?)\s*\((.*?)\)/);
  const mainTitle = parenMatch ? parenMatch[1].trim() : poi.name;
  const subTitle = parenMatch ? parenMatch[2].trim() : "";

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[5000] flex flex-col shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${isExpanded ? 'h-[96dvh]' : 'h-[420px]'} bg-white overflow-hidden`}
      dir={isHe ? 'rtl' : 'ltr'} style={{ borderRadius: isExpanded ? '0' : '8px 8px 0 0' }}
      onTouchStart={(e) => touchStart.current = e.targetTouches[0].clientY} onTouchEnd={handleTouchEnd}
    >
      <div className={`w-full shrink-0 relative transition-all duration-500 ${isExpanded ? 'h-64' : 'h-48'} bg-slate-900 group`}>
        <GoogleImage query={poi.name} lat={poi.lat} lng={poi.lng} className="w-full h-full opacity-70 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />

        <div className="absolute top-2 inset-x-0 h-10 flex items-start justify-center cursor-pointer z-20" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="w-12 h-1 bg-white/40 rounded-full mt-3" />
        </div>

        <div className="absolute top-8 inset-x-6 flex items-center justify-between z-10">
          <div className={isHe ? "order-1" : "order-2"}>
            <button onClick={onClose} className="h-10 px-4 flex items-center gap-2 bg-black/40 backdrop-blur-md text-white rounded-[8px] border border-white/10 transition-transform active:scale-90 text-[11px] font-medium uppercase tracking-widest">
              {isHe ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
              <span>{isHe ? "חזרה" : "Back"}</span>
            </button>
          </div>

          <div className={`flex bg-black/30 backdrop-blur-md rounded-[8px] p-1 border border-white/10 ${isHe ? "order-2" : "order-1"}`}>
            <button onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : 'normal')} className={`w-10 h-10 flex items-center justify-center rounded-[8px] transition-all ${fontSize === 'large' ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white'}`}>
              <TypeIcon size={18} />
            </button>
            <button onClick={openInGoogleMaps} className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white rounded-[8px]">
              <MapPin size={18} />
            </button>
            <button onClick={handleAudioClick} className="w-10 h-10 flex items-center justify-center text-white/20 rounded-[8px] relative">
              <Headphones size={18} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center text-rose-400 hover:text-rose-300 rounded-[8px]">
              <Heart size={18} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 inset-x-8 flex flex-col text-right">
          <span className="text-[#14B8A6] font-semibold uppercase text-[9px] tracking-[0.2em] mb-1">
            {poi.category && CATEGORY_LABELS_HE[poi.category]}
          </span>
          <h2 className="text-2xl font-semibold text-white leading-tight">{mainTitle}</h2>
          {subTitle && <span className="text-[11px] font-normal text-white/50 mt-0.5 tracking-wide uppercase">{subTitle}</span>}
        </div>

        <button
          onClick={() => setIsImageFullscreen(true)}
          className="absolute bottom-4 left-6 w-9 h-9 bg-black/40 text-white rounded-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-8 space-y-12 pb-32">
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ScrollText size={18} className="text-[#6366F1]" />
              {isHe ? "סיפור המקום המלא" : "The Full Story"}
            </h3>
          </div>
          <div className={`text-slate-800 leading-relaxed transition-all duration-300 ${fontSize === 'large' ? 'text-xl font-normal' : 'text-base font-normal'}`}>
            {isLoading ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <Loader2 size={32} className="animate-spin text-[#6366F1]" />
                <p className="text-[9px] font-medium uppercase text-slate-400 tracking-widest">{isHe ? 'מפיק הסברים...' : 'Generating Insight...'}</p>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in duration-700">
                {(extendedData?.historicalAnalysis || poi.description).split('\n').filter((p: string) => p.trim()).map((paragraph: string, idx: number) => (
                  <p key={idx} className="opacity-90">{paragraph}</p>
                ))}

                {extendedData?.sections?.map((section: any, idx: number) => (
                  <div key={idx} className="space-y-4 pt-10 border-t border-slate-100">
                    <h4 className="text-[10px] font-semibold text-[#6366F1] uppercase tracking-[0.2em] flex items-center gap-2">
                      {idx % 3 === 0 ? <Building size={14} /> : idx % 3 === 1 ? <Sparkles size={14} /> : <Info size={14} />}
                      {section.title}
                    </h4>
                    <p className="opacity-90 leading-relaxed font-normal">{section.content}</p>
                  </div>
                ))}

                {extendedData?.sources && extendedData.sources.length > 0 && (
                  <div className="pt-8 border-t border-slate-50">
                    <h4 className="text-[10px] font-medium text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <BookOpen size={12} /> {isHe ? "מקורות להרחבה" : "Sources"}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {extendedData.sources.map((source: any, sIdx: number) => (
                        <a key={sIdx} href={source.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-50 text-[10px] text-slate-500 font-medium rounded-[8px] hover:bg-slate-100 transition-colors flex items-center gap-1.5 border border-slate-100">
                          {source.title} <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="shrink-0 bg-white border-t border-slate-100 p-4 grid grid-cols-2 gap-3 h-24 mb-[env(safe-area-inset-bottom)]">
        <button
          onClick={onPrev}
          disabled={currentIndex <= 0}
          className="h-14 bg-[#0F172A] text-white disabled:opacity-20 rounded-[8px] font-medium text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          {isHe ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          <span>{isHe ? "תחנה קודמת" : "Previous"}</span>
        </button>
        <button
          onClick={onNext}
          disabled={currentIndex >= totalCount - 1}
          className="h-14 bg-[#0F172A] text-white disabled:opacity-20 rounded-[8px] font-medium text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <span>{isHe ? "תחנה הבאה" : "Next Station"}</span>
          {isHe ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
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
