
import React, { useState, useEffect, useRef } from 'react';
import { POI, UserPreferences, Route, AudioState } from '../types';
import { fetchExtendedPoiDetails, fetchNearbySuggestions } from '../services/geminiService';
import { 
  Loader2, X, Building2, ScrollText, History, Footprints, ExternalLink, ShieldCheck, MapPin, Plus, Gem, Minus, Sparkles, Heart, Library, Trash2, Navigation
} from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS_HE } from './RouteOverview';
import { getCityImage } from '../App';

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
}

const translations = {
  he: { 
    archOverview: "אדריכלות ועיצוב", 
    extendedInfo: "פרקי העשרה", 
    overview: "סיפור המקום", 
    historicalDepth: "רקע היסטורי", 
    expDiscovery: "חווית גילוי", 
    loadingInfo: "דולה מידע היסטורי עמוק...", 
    next: "תחנה הבאה", 
    prev: "תחנה קודמת", 
    verified: "מידע מאומת", 
    nearbyTitle: "פנינים בסביבה", 
    sourcesTitle: "מקורות וסימוכין",
    openMaps: "ניווט ב-Google Maps",
    removeStation: "הסר מהמסלול",
    loadingNearby: "מחפש מקומות קרובים..." 
  },
  en: { 
    archOverview: "Architecture & Design", 
    extendedInfo: "Extra Chapters", 
    overview: "Place Story", 
    historicalDepth: "Historical Background", 
    expDiscovery: "EXPERIENCE DISCOVERY", 
    loadingInfo: "Deep diving into history...", 
    next: "Next Station", 
    prev: "Previous Station", 
    verified: "Verified", 
    nearbyTitle: "Nearby Gems", 
    sourcesTitle: "References & Sources",
    openMaps: "Open in Google Maps",
    removeStation: "Remove Station",
    loadingNearby: "Finding nearby spots..."
  }
};

export const UnifiedPoiCard: React.FC<Props> = ({ poi, route, onClose, currentIndex, totalCount, preferences, onNext, onPrev, onAddToRoute, onRemove, onGoToPoi, isSaved, onToggleSave, onEnrichPoi }) => {
  const isHe = preferences.language === 'he';
  const t = translations[preferences.language];
  const [extendedData, setExtendedData] = useState<any>(poi.isFullyLoaded ? poi : null);
  const [nearbySpots, setNearbySpots] = useState<POI[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(!poi.isFullyLoaded);
  const [isLoadingNearby, setIsLoadingNearby] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [googlePhotoUrl, setGooglePhotoUrl] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    setIsImageLoading(true);
    setGooglePhotoUrl(null);
    onGoToPoi(poi);

    if ((window as any).google?.maps?.places) {
       const request = { textQuery: `${poi.name}, ${route.city}`, fields: ['photos'] };
       google.maps.places.Place.searchByText(request).then((result: any) => {
           if (result.places?.[0]?.photos?.[0]) {
              setGooglePhotoUrl(result.places[0].photos[0].getURI({ maxWidth: 800 }));
           }
       }).catch(() => {});
    }
    
    if (!poi.isFullyLoaded) {
      setIsLoadingDetails(true);
      fetchExtendedPoiDetails(poi.name, route.city, preferences).then(data => {
        if (data) {
          setExtendedData(data);
          onEnrichPoi?.(poi.id, data);
        }
        setIsLoadingDetails(false);
      });
    } else {
      setExtendedData(poi);
      setIsLoadingDetails(false);
    }

    fetchNearbySuggestions(poi, route.city, preferences.language).then(spots => {
      setNearbySpots(spots);
      setIsLoadingNearby(false);
    });
  }, [poi.id, preferences.language]);

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStart - currentY;
    if (diff > 50 && !isExpanding) setIsExpanding(true);
    if (diff < -50 && isExpanding && scrollContainerRef.current?.scrollTop === 0) setIsExpanding(false);
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}`;
    window.open(url, '_blank');
  };

  const handleRemove = () => {
    if (confirm(isHe ? "להסיר את התחנה מהמסלול?" : "Remove this station from the route?")) {
      onRemove(poi.id);
      onClose();
    }
  };

  const cardHeightClass = isExpanding ? 'h-[92vh]' : 'h-[55vh]';
  const displayImageUrl = googlePhotoUrl || (imgError ? getCityImage(route.city) : (extendedData?.officialImageUrl || poi.imageUrl || getCityImage(route.city)));

  return (
    <div 
      dir={isHe ? 'rtl' : 'ltr'}
      className={`fixed inset-x-0 bottom-0 bg-white/40 backdrop-blur-2xl z-[400] flex flex-col pointer-events-auto shadow-2xl border-t border-white/50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${cardHeightClass} ${isExpanding ? 'rounded-t-2xl' : 'rounded-t-2xl'}`}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove}
    >
      <div className="absolute top-0 inset-x-0 h-10 flex items-center justify-center pointer-events-none z-[450]">
         <div className="w-10 h-1 bg-slate-400/20 rounded-full pointer-events-auto cursor-pointer" onClick={() => setIsExpanding(!isExpanding)} />
         <button onClick={onClose} className={`absolute top-4 ${isHe ? 'right-6' : 'left-6'} p-2 bg-white/60 backdrop-blur-md rounded-lg text-slate-400 shadow-sm pointer-events-auto active:scale-90 transition-all`}><X size={16} /></button>
         
         <button 
           onClick={(e) => { e.stopPropagation(); onToggleSave?.(); }} 
           className={`absolute top-4 ${isHe ? 'left-6' : 'right-6'} p-2 bg-white/60 backdrop-blur-md rounded-lg shadow-sm pointer-events-auto active:scale-90 transition-all ${isSaved ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
         >
           <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
         </button>
      </div>
      
      <div className="px-6 mt-12 relative shrink-0">
          <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-200/40 shadow-inner border border-white/50 relative">
             <img src={displayImageUrl} className={`w-full h-full object-cover transition-opacity duration-500 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`} alt={poi.name} onLoad={() => setIsImageLoading(false)} onError={() => { setImgError(true); setIsImageLoading(false); }} />
             <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm border border-emerald-50">
                <ShieldCheck size={10} className="text-emerald-500" /><span className="text-[8px] font-bold text-slate-900 uppercase tracking-widest">{t.verified}</span>
             </div>
          </div>
      </div>

      <div className="px-6 pt-5 pb-3 flex flex-col text-right shrink-0 relative">
          <span className="text-[8px] font-black text-emerald-600 tracking-[0.2em] mb-1 block uppercase">{t.expDiscovery}</span>
          <h2 className="font-bold text-slate-900 leading-tight mb-0.5 text-xl truncate">{poi.name}</h2>
          <div className="flex flex-wrap items-center gap-2 justify-start mt-2">
            <div className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm text-slate-600 px-2.5 py-1 rounded-lg text-[9px] font-bold border border-white/50">{poi.category && CATEGORY_ICONS[poi.category]}<span>{isHe ? CATEGORY_LABELS_HE[poi.category || 'history'] : poi.category}</span></div>
          </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 no-scrollbar scroll-smooth pt-4 space-y-8 pb-32">
          {/* Quick Actions */}
          <section className="flex gap-2">
             <button onClick={openGoogleMaps} className="flex-1 flex items-center justify-center gap-2 bg-white/60 border border-slate-100 py-2.5 rounded-xl text-[10px] font-bold text-slate-700 hover:bg-emerald-50 transition-colors shadow-sm">
                <Navigation size={14} className="text-emerald-500" />
                {t.openMaps}
             </button>
             <button onClick={handleRemove} className="px-3 flex items-center justify-center gap-2 bg-white/60 border border-slate-100 py-2.5 rounded-xl text-[10px] font-bold text-red-400 hover:bg-red-50 transition-colors shadow-sm">
                <Trash2 size={14} />
             </button>
          </section>

          <section className="bg-white/20 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm text-right">
            <div className="flex items-center gap-2.5 mb-4"><div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center"><ScrollText size={16} /></div><h3 className="text-base font-bold text-slate-900">{t.overview}</h3></div>
            <p className="text-slate-800 text-sm leading-relaxed font-light whitespace-pre-wrap">{extendedData?.historicalAnalysis || poi.description}</p>
          </section>
          
          {isLoadingDetails ? (
            <div className="flex flex-col items-center py-8 text-slate-300 gap-3"><Loader2 className="animate-spin" size={24} /><p className="text-[9px] font-bold uppercase tracking-[0.2em]">{t.loadingInfo}</p></div>
          ) : (
            <div className="space-y-8">
                {extendedData?.architecturalAnalysis && (
                  <section className="text-right">
                    <div className="flex items-center gap-2.5 mb-4"><div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center border border-white/50 shadow-sm"><Building2 size={14} /></div><h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.archOverview}</h4></div>
                    <p className="text-slate-700 text-sm leading-relaxed font-light whitespace-pre-wrap">{extendedData.architecturalAnalysis}</p>
                  </section>
                )}
                
                {extendedData?.sections?.map((section: any, idx: number) => (
                  <section key={idx} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-2.5">{section.title}</h4>
                    <p className="text-slate-600 text-xs leading-relaxed font-light whitespace-pre-wrap">{section.content}</p>
                  </section>
                ))}

                {/* Sources Section */}
                {extendedData?.sources && extendedData.sources.length > 0 && (
                  <section className="text-right">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-white/50 shadow-sm">
                        <Library size={14} />
                      </div>
                      <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.2em]">{t.sourcesTitle}</h4>
                    </div>
                    <div className="space-y-2">
                       {extendedData.sources.map((source: any, idx: number) => (
                         <div key={idx} className="bg-white/40 p-2.5 rounded-xl border border-white/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-600 font-medium truncate flex-1 ml-4">{source.title}</span>
                            {source.url && source.url !== "#" && (
                              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-600">
                                <ExternalLink size={10} />
                              </a>
                            )}
                         </div>
                       ))}
                    </div>
                  </section>
                )}

                <section className="pt-6 border-t border-white/30 text-right">
                    <div className="flex items-center gap-2.5 mb-5"><div className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center border border-white/50 shadow-sm"><Sparkles size={14} /></div><h4 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.2em]">{t.nearbyTitle}</h4></div>
                    {isLoadingNearby ? (
                       <div className="flex items-center gap-2.5 py-4 text-slate-400 animate-pulse"><Loader2 size={10} className="animate-spin" /><span className="text-[9px] font-bold uppercase">{t.loadingNearby}</span></div>
                    ) : (
                      <div className="flex overflow-x-auto gap-3 pb-4 -mx-6 px-6 no-scrollbar snap-x snap-mandatory">
                         {nearbySpots.map((spot, idx) => (
                           <div key={idx} className="w-[160px] shrink-0 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-3.5 snap-start shadow-sm flex flex-col justify-between">
                                <h5 className="text-[11px] font-bold text-slate-900 truncate mb-1">{spot.name}</h5>
                                <p className="text-[9px] text-slate-500 leading-tight line-clamp-2">{spot.description}</p>
                                <div className="flex items-center justify-between mt-3">
                                   <span className="text-[8px] font-black text-emerald-500 uppercase">{(spot as any).approxDistance}</span>
                                </div>
                           </div>
                         ))}
                      </div>
                    )}
                </section>
            </div>
          )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 pb-8 bg-gradient-to-t from-white/90 via-white/50 to-transparent z-[500] pointer-events-none">
         <div className="flex items-center gap-3 pointer-events-auto max-w-sm mx-auto" dir={isHe ? 'rtl' : 'ltr'}>
            <button onClick={onPrev} disabled={currentIndex === 0} className="flex-1 py-3.5 bg-emerald-50/80 border border-emerald-100 backdrop-blur-md rounded-xl text-emerald-700 text-[10px] font-bold disabled:opacity-30 active:scale-95 shadow-sm">{t.prev}</button>
            <button onClick={onNext} disabled={currentIndex === totalCount - 1} className="flex-1 py-3.5 bg-emerald-100/80 text-emerald-900 border border-emerald-200 backdrop-blur-md rounded-xl text-[10px] font-bold disabled:opacity-30 active:scale-95 shadow-sm">{t.next}</button>
         </div>
      </div>
    </div>
  );
};
