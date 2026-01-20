
import React, { useState, useEffect, useRef } from 'react';
import { POI, UserPreferences, Route } from '../types';
import { fetchExtendedPoiDetails, fetchDeepResearch } from '../services/geminiService';
import { 
  Loader2, ScrollText, MapPin, Headphones, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, 
  Type as FontIcon, Link2, Heart, ExternalLink, Sparkles, BookOpen, Quote, Info
} from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS_HE } from './RouteOverview';
import { GoogleImage } from './GoogleImage';
import { GoogleGallery } from './GoogleGallery';

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
  onPlayPoi?: () => void;
}

const DisplayTitle = ({ name, isHe }: { name: string, isHe: boolean }) => {
  const hebrewRegex = /[\u0590-\u05FF]/;
  const parenMatch = name.match(/(.*?)\s*\((.*?)\)/);
  let main = name;
  let secondary = "";
  if (parenMatch) {
    const p1 = parenMatch[1].trim(); const p2 = parenMatch[2].trim();
    if (isHe) { if (hebrewRegex.test(p2) && !hebrewRegex.test(p1)) { main = p2; secondary = p1; } else { main = p1; secondary = p2; } }
    else { if (hebrewRegex.test(p1) && !hebrewRegex.test(p2)) { main = p2; secondary = p1; } else { main = p1; secondary = p2; } }
  }
  return (
    <div className="flex flex-col text-right">
      <h2 className="text-xl font-black text-slate-900 leading-tight">{main}</h2>
      {secondary && <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{secondary}</span>}
    </div>
  );
};

export const UnifiedPoiCard: React.FC<Props> = ({ 
  poi, route, onClose, preferences, onUpdatePreferences, isExpanded, setIsExpanded, onPlayPoi, onNext, onPrev, currentIndex, totalCount
}) => {
  const isHe = preferences.language === 'he';
  const [extendedData, setExtendedData] = useState<any>(poi.isFullyLoaded ? poi : null);
  const [isLoading, setIsLoading] = useState(!poi.isFullyLoaded);
  
  const [deepResearch, setDeepResearch] = useState<any>(null);
  const [isDeepResearching, setIsDeepResearching] = useState(false);
  
  const touchStart = useRef<number | null>(null);

  const prefetchNextPoi = async () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < totalCount && route.pois[nextIdx]) {
      const nextPoi = route.pois[nextIdx];
      if (!nextPoi.isFullyLoaded) {
        fetchExtendedPoiDetails(nextPoi.name, route.city, preferences, nextPoi.lat, nextPoi.lng);
      }
    }
  };

  useEffect(() => {
    setExtendedData(poi.isFullyLoaded ? poi : null);
    setIsLoading(!poi.isFullyLoaded);
    setDeepResearch(null); 

    const loadData = async () => {
      if (!poi.isFullyLoaded) {
        const data = await fetchExtendedPoiDetails(poi.name, route.city, preferences, poi.lat, poi.lng);
        if (data) {
          setExtendedData(data);
          setIsLoading(false);
          poi.isFullyLoaded = true;
          Object.assign(poi, data); 
        }
      } else {
        setIsLoading(false);
      }
      prefetchNextPoi();
    };

    loadData();
  }, [poi.id, poi.name]);

  const handleDeepResearch = async () => {
    setIsDeepResearching(true);
    setIsExpanded(true); 
    const data = await fetchDeepResearch(poi.name, route.city, preferences.language);
    setDeepResearch(data);
    setIsDeepResearching(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.targetTouches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const distance = touchStart.current - e.changedTouches[0].clientY;
    if (distance > 60) setIsExpanded(true);
    else if (distance < -60) setIsExpanded(false);
    touchStart.current = null;
  };

  const handleCycleFontSize = () => {
    const sizes = [14, 16, 18, 20];
    const curr = sizes.indexOf(preferences.fontSize || 16);
    const next = (curr + 1) % sizes.length;
    onUpdatePreferences({ ...preferences, fontSize: sizes[next] });
  };

  const validSources = extendedData?.sources?.filter((s: any) => s.url && s.url.startsWith('http')) || [];

  return (
    <div 
      className={`fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[3100] flex flex-col bg-white shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] border transition-all duration-500 ease-[cubic-bezier(0.3,1.2,0.3,1)] ${isExpanded ? 'h-[94dvh]' : 'h-[320px]'}`}
      dir={isHe ? 'rtl' : 'ltr'} 
      style={{ borderRadius: '15px' }} 
      onTouchStart={handleTouchStart} 
      onTouchEnd={handleTouchEnd}
    >
      {/* Scroll Handle */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="w-full h-8 shrink-0 flex items-center justify-center cursor-pointer active:bg-slate-50 transition-colors"
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
      </div>

      {/* Header with Hero Image Backdrop when collapsed? No, let's stick to a clean top image */}
      <div className={`relative shrink-0 overflow-hidden transition-all duration-500 ${isExpanded ? 'h-52' : 'h-32'}`} style={{ borderRadius: '15px 15px 0 0' }}>
         <GoogleImage query={`${poi.name} ${route.city} iconic landmark landscape`} className="w-full h-full" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
         <div className="absolute top-4 inset-x-4 flex items-center justify-between">
            <button onClick={onClose} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-all">
               {isHe ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
            </button>
            <div className="flex gap-2">
               <button onClick={onPlayPoi} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-all"><Headphones size={20} /></button>
               <button onClick={handleCycleFontSize} className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-all"><FontIcon size={20} /></button>
            </div>
         </div>
         <div className="absolute bottom-4 right-4 left-4 flex flex-col items-start text-white text-right">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-600/80 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest mb-1.5" style={{ borderRadius: '4px' }}>
               {poi.category && CATEGORY_ICONS[poi.category]}
               <span>{isHe ? CATEGORY_LABELS_HE[poi.category || 'history'] : poi.category}</span>
            </div>
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-6 pt-6 pb-24">
        <DisplayTitle name={poi.name} isHe={isHe} />

        <button 
          onClick={handleDeepResearch}
          disabled={isDeepResearching}
          className={`w-full py-4 flex items-center justify-center gap-2.5 text-[11px] font-black uppercase tracking-widest border transition-all shadow-sm active:scale-95 ${isDeepResearching ? 'bg-indigo-50 text-indigo-400 border-indigo-100' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}
          style={{ borderRadius: '10px' }}
        >
          {isDeepResearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-indigo-500" />}
          {isDeepResearching ? (isHe ? "מעמיק בתובנות..." : "Diving deeper...") : (isHe ? "עומק היסטורי (AI)" : "Historical Depth (AI)")}
        </button>

        <section className="text-right space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <ScrollText size={16} className="text-indigo-500" /> {isHe ? "סקירה היסטורית" : "History"}
            </h3>
            {!isLoading && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}`} target="_blank" className="flex items-center gap-1.5 text-indigo-600 font-black text-[11px] uppercase tracking-widest">
                <MapPin size={14} /> {isHe ? "ניווט" : "Nav"}
              </a>
            )}
          </div>

          <div className="text-slate-700 leading-relaxed transition-all duration-300" style={{ fontSize: `${preferences.fontSize || 16}px` }}>
            {isLoading ? (
              <div className="flex flex-col items-center py-12 gap-4 text-slate-400">
                <Loader2 size={32} className="animate-spin text-indigo-400" />
                <span className="text-[11px] font-black uppercase tracking-widest">{isHe ? 'שואב מידע...' : 'Loading...'}</span>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-700">
                <p className="opacity-90 leading-loose whitespace-pre-line">{extendedData?.historicalAnalysis || poi.description}</p>
                
                <GoogleGallery query={`${poi.name}, ${route.city}`} isHe={isHe} />

                {deepResearch && (
                  <div className="pt-8 border-t-2 border-indigo-50 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-2.5 text-indigo-600">
                      <BookOpen size={20} />
                      <h4 className="text-sm font-black uppercase tracking-widest">{isHe ? "ממצאי מחקר מורחב" : "Extended Research"}</h4>
                    </div>

                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4 italic text-indigo-900 leading-relaxed shadow-inner">
                      <Quote size={20} className="text-indigo-300" />
                      <p className="font-medium">{deepResearch.deepAnalysis}</p>
                    </div>

                    {deepResearch.localLegends && (
                      <div className="space-y-3">
                         <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isHe ? "אגדות ופולקלור מקומי" : "Legends"}</h5>
                         <p className="bg-slate-50 p-4 border border-slate-100 text-slate-600 text-[13px] leading-loose" style={{ borderRadius: '10px' }}>{deepResearch.localLegends}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sources Section - specifically requested via screenshot hints */}
                {validSources.length > 0 && (
                  <div className="pt-8 border-t border-slate-100 space-y-4">
                     <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Info size={12} /> {isHe ? "מקורות מידע" : "Sources"}
                     </h5>
                     <div className="flex flex-wrap gap-2">
                        {validSources.map((source: any, idx: number) => (
                           <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-[10px] font-bold text-slate-600 transition-all" style={{ borderRadius: '8px' }}>
                              <ExternalLink size={10} />
                              {source.title || (isHe ? 'מקור' : 'Source')}
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

      <footer className="absolute bottom-0 inset-x-0 bg-[#0f172a] border-none flex items-center shadow-2xl overflow-hidden h-14 shrink-0 z-30" style={{ borderRadius: '0 0 15px 15px' }}>
         <button onClick={(e) => { e.stopPropagation(); onPrev(); }} disabled={currentIndex <= 0} className="flex-1 h-full text-white disabled:text-slate-600 font-bold text-xs flex items-center justify-center gap-3 active:bg-slate-800 transition-colors">
           <ChevronRight size={16} />
           <span>{isHe ? "התחנה הקודמת" : "Prev Station"}</span>
         </button>
         <div className="w-px h-6 bg-slate-800" />
         <button onClick={(e) => { e.stopPropagation(); onNext(); }} disabled={currentIndex >= totalCount - 1} className="flex-1 h-full text-white disabled:text-slate-600 font-bold text-xs flex items-center justify-center gap-3 active:bg-slate-800 transition-colors">
           <span>{isHe ? "התחנה הבאה" : "Next Station"}</span>
           <ChevronLeft size={16} />
         </button>
      </footer>
    </div>
  );
};
