
import React, { useState, useEffect, useRef } from 'react';
import { POI, UserPreferences, Route, AudioState } from '../types';
import { fetchExtendedPoiDetails } from '../services/geminiService';
import { 
  Loader2, ScrollText, Heart, Trash2, ChevronRight, ChevronLeft, Plus, ArrowRight, ArrowLeft, X, Sparkles
} from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS_HE } from './RouteOverview';
import { GoogleImage } from './GoogleImage';
import { getCityImage } from '../utils';

declare var google: any;

interface Props {
  poi: POI; 
  route: Route; 
  onClose: () => void; 
  onNext: () => void; 
  onPrev: () => void; 
  onRemove: (id: string) => void; 
  onAddToRoute: (poi: Partial<POI>, afterPoiId?: string) => void; 
  onGoToPoi: (poi: POI) => void; 
  onSaveRoute: () => void; 
  currentIndex: number; 
  totalCount: number; 
  preferences: UserPreferences; 
  audioState: AudioState; 
  setAudioState: (s: AudioState | ((prev: AudioState) => AudioState)) => void;
  setIsAudioExpanded: (expanded: boolean) => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onEnrichPoi?: (poiId: string, data: Partial<POI>) => void;
  onAddPoi?: (poi: POI) => void;
  isScanned?: boolean;
}

const translations = {
  he: { 
    overview: "סיפור המקום (עומק היסטורי)", 
    expDiscovery: "חווית גילוי עירונית", 
    loadingInfo: "דולה מידע היסטורי מבלוגים וארכיונים...", 
    next: "התחנה הבאה", 
    prev: "התחנה הקודמת", 
    backToRoute: "חזרה למסלול",
    addToRoute: "הוספה למסלול שלי"
  },
  en: { 
    overview: "Historical Deep-Dive", 
    expDiscovery: "URBAN DISCOVERY EXPERIENCE", 
    loadingInfo: "Fetching verified historical data...", 
    next: "Next Stop", 
    prev: "Previous Stop", 
    backToRoute: "Back to Route",
    addToRoute: "Add to my Route"
  }
};

/**
 * Splits a string into Hebrew and English components.
 * Assumes English text might be in parentheses or follow Hebrew text.
 */
const splitName = (name: string) => {
  const englishRegex = /([a-zA-Z].+)/;
  const match = name.match(englishRegex);
  
  if (match) {
    const en = match[0].replace(/[()]/g, '').trim();
    const he = name.replace(match[0], '').replace(/[()]/g, '').trim();
    return { he: he || en, en: he ? en : undefined };
  }
  return { he: name, en: undefined };
};

export const UnifiedPoiCard: React.FC<Props> = ({ 
  poi, route, onClose, currentIndex, totalCount, preferences, onNext, onPrev, isSaved, onToggleSave, onEnrichPoi, onRemove, onAddPoi, isScanned 
}) => {
  const isHe = preferences.language === 'he';
  const t = translations[preferences.language];
  const [extendedData, setExtendedData] = useState<any>(poi.isFullyLoaded ? poi : null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(!poi.isFullyLoaded);
  const [isExpanded, setIsExpanded] = useState(false);

  // Swipe Logic
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 60;

  const onTouchStart = (e: React.TouchEvent) => { touchEnd.current = null; touchStart.current = e.targetTouches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => { touchEnd.current = e.targetTouches[0].clientY; };
  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (distance > minSwipeDistance && !isExpanded) setIsExpanded(true);
    if (distance < -minSwipeDistance && isExpanded) setIsExpanded(false);
  };

  const handleHeaderClick = () => setIsExpanded(!isExpanded);

  useEffect(() => {
    if (!poi.isFullyLoaded) {
      setIsLoadingDetails(true);
      fetchExtendedPoiDetails(poi.name, route.city, preferences).then(data => {
        if (data) { setExtendedData(data); onEnrichPoi?.(poi.id, data); }
        setIsLoadingDetails(false);
      }).catch(() => setIsLoadingDetails(false));
    } else {
      setExtendedData(poi);
      setIsLoadingDetails(false);
    }
  }, [poi.id]);

  const cardHeightClass = isExpanded ? 'max-h-[92dvh] h-[92dvh]' : 'h-[38dvh]';
  const { he, en } = splitName(poi.name);

  return (
    <div 
      dir={isHe ? 'rtl' : 'ltr'}
      className={`fixed inset-x-0 bottom-0 z-[3000] flex flex-col pointer-events-auto overflow-hidden glass-card shadow-[0_-20px_100px_rgba(0,0,0,0.3)] transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${cardHeightClass} animate-in slide-in-from-bottom`}
      style={{ borderRadius: '2rem 2rem 0 0' }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      {/* Top Header Section */}
      <div className="w-full h-14 shrink-0 flex items-center px-6 border-b border-white/20 relative z-20 bg-white/50 backdrop-blur-sm">
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="flex items-center gap-2 text-indigo-600 font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all">
           {isHe ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} <span>{t.backToRoute}</span>
        </button>
        <div onClick={handleHeaderClick} className="flex-1 flex justify-center h-full items-center cursor-pointer group">
          <div className={`w-12 h-1.5 bg-slate-200 rounded-full transition-all ${isExpanded ? 'bg-slate-300' : 'group-hover:bg-indigo-500'}`} />
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 text-slate-400 hover:text-slate-900 active:scale-95 transition-all"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pt-6 pb-40 space-y-8 no-scrollbar scroll-smooth">
          {/* Main Visual */}
          <div className={`w-full transition-all duration-700 overflow-hidden bg-slate-200 shadow-inner relative ${isExpanded ? 'aspect-video' : 'h-28'}`} style={{borderRadius: '1rem'}}>
            <GoogleImage query={`${poi.name}, ${route.city}`} className="w-full h-full" fallbackUrl={poi.imageUrl} />
          </div>

          {/* Title & Category */}
          <div className="text-right">
              <span className="text-[9px] text-indigo-600 tracking-widest block uppercase mb-1 font-black">{t.expDiscovery}</span>
              <h2 className={`text-slate-900 font-black leading-tight transition-all duration-500 ${isExpanded ? 'text-3xl' : 'text-xl'}`}>
                {he}
                {en && (
                  <span className="block text-slate-400 text-sm font-medium mt-1.5 tracking-normal opacity-80">{en}</span>
                )}
              </h2>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 text-[10px] text-indigo-600 font-black uppercase tracking-widest" style={{borderRadius: '5px'}}>
                  {poi.category && CATEGORY_ICONS[poi.category]}
                  <span>{isHe ? CATEGORY_LABELS_HE[poi.category || 'history'] : poi.category}</span>
                </div>
              </div>
          </div>

          {/* Action Buttons */}
          <div className={`space-y-6 transition-all duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="grid grid-cols-1 gap-3">
                {isScanned && (
                  <button onClick={() => onAddPoi?.(poi)} className="w-full h-14 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all" style={{borderRadius: '5px'}}>
                    <Plus size={16} />{t.addToRoute}
                  </button>
                )}
              </div>
              
              <div className="flex gap-4">
                 <button onClick={onToggleSave} className={`flex-1 h-14 flex items-center justify-center border transition-all active:scale-95 ${isSaved ? 'text-pink-500 bg-pink-50 border-pink-100 shadow-inner' : 'text-slate-300 bg-white border-slate-100 shadow-sm'}`} style={{borderRadius: '5px'}}>
                    <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                 </button>
                 {!isScanned && (
                   <button onClick={() => { onRemove(poi.id); }} className="flex-1 h-14 flex items-center justify-center bg-white border border-slate-100 text-slate-300 hover:text-red-500 shadow-sm active:scale-95 transition-all" style={{borderRadius: '5px'}}>
                      <Trash2 size={20} />
                   </button>
                 )}
              </div>

              {/* Rich Historical Content */}
              <section className="text-right pb-10 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <ScrollText size={20} className="text-indigo-500" />
                  <h3 className="text-xl text-slate-900 font-black">{t.overview}</h3>
                </div>
                <div className="text-slate-700 text-[15px] leading-relaxed space-y-6 font-light">
                  {isLoadingDetails ? (
                    <div className="flex flex-col items-center gap-4 py-10 animate-pulse text-slate-300">
                      <Loader2 size={32} className="animate-spin text-indigo-200" />
                      <span className="text-xs font-bold tracking-widest uppercase">{t.loadingInfo}</span>
                    </div>
                  ) : (
                    (extendedData?.historicalAnalysis || poi.description || "").split('\n').map((para: string, i: number) => (
                      para.trim() && <p key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-700" style={{ animationDelay: `${i * 150}ms` }}>{para}</p>
                    ))
                  )}
                </div>
              </section>
          </div>
      </div>

      {/* Floating Navigation Bar */}
      {!isScanned && currentIndex !== -1 && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[4000] bg-slate-900 text-white shadow-2xl p-1.5 flex gap-1 items-center w-[340px] transition-all duration-300 ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`} style={{borderRadius: '5px'}}>
           <button 
             onClick={(e) => { e.stopPropagation(); onPrev(); }} 
             disabled={currentIndex === 0} 
             className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${currentIndex === 0 ? 'text-slate-600' : 'text-white'}`}
           >
             {isHe ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
             {t.prev}
           </button>
           <div className="w-px h-8 bg-slate-700 shrink-0" />
           <button 
             onClick={(e) => { e.stopPropagation(); onNext(); }} 
             disabled={currentIndex === totalCount - 1} 
             className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${currentIndex === totalCount - 1 ? 'text-slate-600' : 'text-white'}`}
           >
             {t.next}
             {isHe ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
           </button>
        </div>
      )}
    </div>
  );
};
