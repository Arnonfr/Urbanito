
import React, { useRef, useState } from 'react';
import { Route, POI, UserPreferences, POICategoryType } from '../types';
import {
  Landmark, Building2, Utensils, Ship, Trees, ShoppingBag, Palette,
  Church, Heart, X, ChevronLeft, Trash2, Settings2, MapPin,
  Loader2, ListTodo, CheckCircle2, Share2, AudioLines, Volume2, Pause, Play, Check, Sliders, Edit3, GripVertical, Building
} from 'lucide-react';
import { GoogleImage } from './GoogleImage';
import { QuickRouteSetup } from './QuickRouteSetup';
import { GoogleAd } from './GoogleAd';
import { NearbyPOISuggestions } from './NearbyPOISuggestions';
import { useAudio } from '../contexts/AudioContext';

// Copied from App.tsx to avoid circular dependency
const RouteTravelIcon = ({ className = "", animated = true }: { className?: string, animated?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 11.3137 20 8" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" className={animated ? "climbing-path" : ""} />
    <circle r="3" fill="#6366F1" className={animated ? "climbing-dot" : ""} />
  </svg>
);

interface Props {
  route: Route; onPoiClick: (poi: POI) => void; onRemovePoi: (id: string) => void; onAddPoi: (poi: POI) => void;
  preferences: UserPreferences; onUpdatePreferences: (p: UserPreferences) => void; onRequestRefine: () => void;
  user: any; isSaved?: boolean; onSave?: () => void; onClose?: () => void; isOfflineLoading?: boolean;
  isExpanded: boolean; setIsExpanded: (v: boolean) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
  openRoutes?: Route[];
  activeRouteIndex?: number;
  onSwitchRoute?: (index: number) => void;
  onCloseRoute?: (index: number) => void;
}

export const CATEGORY_ICONS: Record<POICategoryType, React.ReactNode> = {
  history: <Landmark size={20} />, food: <Utensils size={20} />, architecture: <Building2 size={20} />, nature: <Trees size={20} />,
  shopping: <ShoppingBag size={20} />, sailing: <Ship size={20} />, culture: <Palette size={20} />, religion: <Building size={20} />, art: <Palette size={20} />
};

export const CATEGORY_LABELS_HE: Record<POICategoryType, string> = {
  history: 'היסטוריה', food: 'קולינריה', architecture: 'אדריכלות', nature: 'נוף וטבע', shopping: 'שופינג', sailing: 'שייט', culture: 'תרבות', religion: 'דת ומורשת', art: 'אמנות'
};

export const RouteOverview: React.FC<Props> = ({
  route, onPoiClick, onRemovePoi, onAddPoi, onSave, isSaved, onClose, preferences, onUpdatePreferences, isExpanded, setIsExpanded, onRegenerate, isRegenerating,
  openRoutes = [], activeRouteIndex = 0, onSwitchRoute, onCloseRoute
}) => {
  const isHe = preferences.language === 'he';
  const parenMatch = route.name.match(/(.*?)\s*\((.*?)\)/);
  const mainTitle = parenMatch ? parenMatch[1].trim() : route.name;
  const subTitle = parenMatch ? parenMatch[2].trim() : "";
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // Internal loading state for button feedback only (non-blocking)
  const [isUpdating, setIsUpdating] = useState(false);
  const [initialPrefs, setInitialPrefs] = useState<UserPreferences | null>(null);

  const touchStart = useRef<number | null>(null);
  const { playText, queueText, stop, isPlaying } = useAudio();

  // Optimizing AdSense Targeting by updating page context
  React.useEffect(() => {
    if (route) {
      // 1. Update Page Title
      const originalTitle = document.title;
      document.title = `${route.name} in ${route.city} | Urbanito`;

      // 2. Update Meta Keywords for Contextual Targeting
      let keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (!keywordsMeta) {
        keywordsMeta = document.createElement('meta');
        keywordsMeta.setAttribute('name', 'keywords');
        document.head.appendChild(keywordsMeta);
      }
      // Create keywords from route data (e.g., "Tel Aviv, History, Tourism, Travel")
      const categories = Array.from(new Set(route.pois.map(p => p.category).filter(Boolean)));
      const keywords = [route.city, route.name, 'travel', 'tourism', 'guide', ...categories].join(', ');
      keywordsMeta.setAttribute('content', keywords);

      // 3. Update Description
      let descriptionMeta = document.querySelector('meta[name="description"]');
      if (!descriptionMeta) {
        descriptionMeta = document.createElement('meta');
        descriptionMeta.setAttribute('name', 'description');
        document.head.appendChild(descriptionMeta);
      }
      descriptionMeta.setAttribute('content', `Explore ${route.name} in ${route.city}. A curated tour featuring ${route.pois.length} stops including ${route.pois.slice(0, 3).map(p => p.name).join(', ')}.`);

      return () => {
        document.title = originalTitle;
      };
    }
  }, [route]);

  const handlePlayPoi = async (poiToPlay: POI, idx: number) => {
    stop();
    const currentText = (poiToPlay as any).audioText || poiToPlay.description || "";
    if (currentText) {
      await playText(currentText, preferences.language as 'he' | 'en', poiToPlay.id);
    }
    const nextPois = route.pois.slice(idx + 1);
    nextPois.forEach(nextPoi => {
      const nextText = (nextPoi as any).audioText || nextPoi.description || "";
      if (nextText) {
        queueText(nextText, preferences.language as 'he' | 'en', nextPoi.id);
      }
    });
  };

  const handlePrefsClick = async () => {
    if (!isPrefsOpen && !isExpanded) {
      setIsExpanded(true);
    }

    if (isPrefsOpen) {
      const hasChanges = JSON.stringify(initialPrefs) !== JSON.stringify(preferences);
      if (hasChanges) {
        setIsUpdating(true);
        try {
          await onRegenerate();
        } finally {
          setIsUpdating(false);
          setIsPrefsOpen(false);
        }
      } else {
        setIsPrefsOpen(false);
      }
    } else {
      setInitialPrefs(preferences);
      setIsPrefsOpen(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dist = touchStart.current - e.changedTouches[0].clientY;
    if (dist > 60) setIsExpanded(true); else if (dist < -60) setIsExpanded(false);
    touchStart.current = null;
  };

  const handleShare = () => {
    let teaser = route.shareTeaser || "";
    if (!teaser && route.pois && route.pois.length > 0) {
      const firstPoi = route.pois[0];
      const cleanFirst = firstPoi.name.replace(/\s*\(.*?\)\s*/g, '').trim();
      if (isHe) {
        teaser = `גלו את ${cleanFirst} ועוד ${route.pois.length - 1} מקומות מיוחדים ב${route.city}! 🗺️`;
      } else {
        teaser = `Discover ${cleanFirst} and ${route.pois.length - 1} more special places in ${route.city}! 🗺️`;
      }
    }

    const title = 'Urbanito - Your Urban Guide';
    const text = isHe
      ? `${teaser}\n\nבואו לטייל איתי במסלול "${mainTitle}":`
      : `${teaser}\n\nJoin me on the "${mainTitle}" tour:`;

    const url = `${window.location.origin}/route/${route.id}`;

    if (navigator.share) {
      navigator.share({ title, text, url }).catch((err) => {
        if (err.name !== 'AbortError') {
          copyToClipboard(`${text}\n${url}`);
        }
      });
    } else {
      copyToClipboard(`${text}\n${url}`);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    alert(isHe ? 'הלינק והתיאור הועתקו! מוכן לשיתוף 🚀' : 'Link and teaser copied! Ready to share 🚀');
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 ${isExpanded ? 'z-[7000]' : 'z-[3500]'} flex flex-col pointer-events-auto shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${isExpanded ? 'h-[92dvh]' : 'h-[380px]'} bg-white/50 backdrop-blur-lg border-t border-white/40 overflow-hidden`}
      dir={isHe ? 'rtl' : 'ltr'} style={{ borderRadius: isExpanded ? '0' : '24px 24px 0 0' }}
      onTouchStart={(e) => touchStart.current = e.targetTouches[0].clientY} onTouchEnd={handleTouchEnd}
    >
      <div className={`w-full shrink-0 relative transition-all duration-500 ${isExpanded ? 'h-80' : 'h-72'} bg-slate-900 group`}>
        <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full opacity-70 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />

        <div className="absolute top-2 inset-x-0 h-10 flex items-start justify-center cursor-pointer z-20" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="w-12 h-1 bg-white/40 rounded-full mt-3" />
        </div>

        {/* Action Buttons */}
        <div className={`absolute top-8 inset-x-6 flex items-center justify-between z-10 pointer-events-none`}>
          <div className={isHe ? "order-1" : "order-2"}>
          </div>

          <div className={`flex bg-black/30 backdrop-blur-md rounded-[8px] p-1 border border-white/10 pointer-events-auto ${isHe ? "order-2" : "order-1"}`}>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrefsClick(); }}
              disabled={isRegenerating || isUpdating}
              className={`w-10 h-10 flex items-center justify-center rounded-[8px] transition-all relative overflow-hidden ${isPrefsOpen
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-white/80 hover:text-white active:bg-white/10'
                }`}
            >
              {(isRegenerating || isUpdating) ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isPrefsOpen ? (
                <Check size={18} />
              ) : (
                <Settings2 size={18} />
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditMode(!isEditMode); }}
              className={`w-10 h-10 flex items-center justify-center rounded-[8px] transition-all ${isEditMode ? 'bg-amber-500 text-white' : 'text-white/80 hover:text-white active:bg-white/10'}`}
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white active:bg-white/10 rounded-[8px] transition-all"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSave?.(); }}
              className={`w-10 h-10 flex items-center justify-center rounded-[8px] transition-all ${isSaved ? 'text-rose-400' : 'text-white/80 hover:text-white active:bg-white/10'}`}
            >
              <Heart size={18} className={isSaved ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 inset-x-8 flex flex-col text-right z-10 pointer-events-none">
          <span className="text-[#6366F1] font-semibold uppercase text-[9px] tracking-[0.2em] mb-1 drop-shadow-md">
            {route.city}
          </span>
          <h2 className="text-2xl font-semibold text-white leading-tight drop-shadow-lg">{mainTitle}</h2>
          {subTitle && <span className="text-[11px] font-normal text-white/70 mt-0.5 tracking-wide uppercase drop-shadow-md">{subTitle}</span>}
          {route.parent_route_id && (
            <span className="text-[10px] font-medium text-white/40 mt-2 flex items-center gap-1 justify-end">
              <Share2 size={10} /> {isHe ? 'מבוסס על מסלול מקורי' : 'Based on original route'}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 space-y-6 pb-32">
        {isPrefsOpen && (
          <div className="animate-in slide-in-from-top duration-300">
            <QuickRouteSetup
              preferences={preferences}
              onUpdatePreferences={onUpdatePreferences}
              onGenerate={async () => { await onRegenerate(); setIsPrefsOpen(false); }}
              onCancel={() => setIsPrefsOpen(false)}
              isEmbedded={true}
              isLoading={isRegenerating}
            />
          </div>
        )}

        <div className={`space-y-4 transition-opacity duration-300 ${isRegenerating ? 'opacity-40' : 'opacity-100'}`}>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ListTodo size={14} className="text-[#6366F1]" />
              {isHe ? "תחנות הסיור" : "Tour Stops"}
            </h3>
          </div>

          <div className="space-y-2">
            {route.pois.map((poi, index) => {
              const parenMatch = poi.name.match(/(.*?)\s*\((.*?)\)/);
              const translatedName = parenMatch ? parenMatch[1].trim() : poi.name;
              const originalName = parenMatch ? parenMatch[2].trim() : "";
              const isLoaded = poi.isFullyLoaded;
              const showOriginalName = originalName && originalName !== translatedName;

              return (
                <React.Fragment key={poi.id}>
                  <div onClick={() => !isRegenerating && !isEditMode && onPoiClick(poi)} className={`group bg-white p-3 rounded-[12px] flex items-center gap-4 transition-all border border-slate-100 relative overflow-hidden ${isEditMode ? 'hover:border-amber-200' : 'cursor-pointer hover:shadow-md hover:border-indigo-200'}`}>
                    {isEditMode && (
                      <div className="shrink-0 cursor-grab active:cursor-grabbing">
                        <GripVertical size={20} className="text-slate-300" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm transition-colors ${poi.category === 'history' ? 'bg-amber-50 text-amber-600' :
                      poi.category === 'food' ? 'bg-orange-50 text-orange-600' :
                        poi.category === 'architecture' ? 'bg-indigo-50 text-indigo-600' :
                          poi.category === 'nature' ? 'bg-emerald-50 text-emerald-600' :
                            poi.category === 'shopping' ? 'bg-pink-50 text-pink-600' :
                              poi.category === 'culture' ? 'bg-purple-50 text-purple-600' :
                                poi.category === 'religion' ? 'bg-blue-50 text-blue-600' :
                                  poi.category === 'art' ? 'bg-rose-50 text-rose-600' :
                                    'bg-slate-50 text-slate-500'
                      }`}>
                      {poi.category ? CATEGORY_ICONS[poi.category as POICategoryType] : <MapPin size={22} />}
                    </div>
                    <div className="flex-1 text-right min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[15px] font-bold text-slate-800 leading-tight truncate">
                          {translatedName}
                        </h4>
                        {(isLoaded || poi.isFullyLoaded || (poi.description && poi.description.length > 10)) && (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Check size={8} className="stroke-[4]" />
                          </div>
                        )}
                      </div>
                      {showOriginalName && (
                        <div className="text-[12px] font-normal text-slate-500 leading-tight truncate opacity-80">
                          {originalName}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 min-w-0">
                        {poi.category && (
                          <div className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded text-nowrap">
                            {CATEGORY_LABELS_HE[poi.category]}
                          </div>
                        )}
                        {index > 0 && poi.travelFromPrevious && (
                          <>
                            <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 text-nowrap truncate">
                              <span>{poi.travelFromPrevious.distance}</span>
                              <span className="opacity-50">|</span>
                              <span>{poi.travelFromPrevious.duration}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {isEditMode ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemovePoi(poi.id); }}
                        className="shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -ml-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePlayPoi(poi, index); }}
                          className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-colors"
                        >
                          <Play size={16} />
                        </button>
                        <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center">
                          <ChevronLeft size={14} className="text-slate-400 -rotate-90" />
                        </div>
                      </div>
                    )}
                    {(poi.isLoading || isLoaded) && (
                      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-slate-100">
                        {isLoaded ? (
                          <div className="h-full bg-emerald-500 w-full transition-all duration-500" />
                        ) : poi.isLoading ? (
                          <div className="h-full bg-emerald-400 w-1/3 animate-pulse" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {(index + 1) % 3 === 0 && index !== route.pois.length - 1 && (
                    <div className="py-2">
                      <GoogleAd
                        slot="3209745866"
                        format="fluid"
                        layout="-fb+5w+4e-db+86"
                        className="rounded-[8px] border-none bg-slate-50 shadow-none opacity-100"
                        style={{ minHeight: '100px', display: 'block' }}
                      />
                      <div className="text-[9px] text-center text-slate-300 mt-1 uppercase tracking-widest">
                        {isHe ? 'מודעה' : 'Advertisement'}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {!isEditMode && !isRegenerating && (
            <NearbyPOISuggestions
              route={route}
              onAddPoi={onAddPoi}
              isHe={isHe}
            />
          )}
        </div>
      </div>
    </div >
  );
};
