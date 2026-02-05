
import React, { useRef, useState } from 'react';
import { Route, POI, UserPreferences, POICategoryType } from '../types';
import {
  Landmark, Building2, Utensils, Ship, Trees, ShoppingBag, Palette,
  Church, Heart, X, ChevronLeft, Trash2, Settings2, MapPin, Library,
  Loader2, ListTodo, CheckCircle2, Share2, AudioLines, Volume2, Pause, Play, Check, Sliders, Edit3, GripVertical, Building, ArrowRight, CloudDownload, Cloud, CloudOff
} from 'lucide-react';
import { usePremium } from '../contexts/PremiumContext';
import { downloadRouteForOffline, isRouteOffline, removeOfflineRoute } from '../services/offlineService';
import { GoogleImage } from './GoogleImage';
import { QuickRouteSetup } from './QuickRouteSetup';
import { GoogleAd } from './GoogleAd';
import { NearbyPOISuggestions } from './NearbyPOISuggestions';
import { useAudio } from '../contexts/AudioContext';
import { nativeBridge } from '../utils/nativeBridge';

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
  showToast?: (message: string, type?: 'success' | 'error') => void;
  nearbyRoutes?: Route[];
  onRouteSelect?: (route: Route) => void;
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
  openRoutes = [], activeRouteIndex = 0, onSwitchRoute, onCloseRoute, showToast, nearbyRoutes = [], onRouteSelect
}) => {
  const isHe = preferences.language === 'he';

  // Localization Logic for Title
  let displayTitle = route.name;
  let displayDescription = route.description;

  // Check new localization structure in preferences (from seed logic) or dedicated fields
  // Logic: preferences?.names?.he > route.name_he > route.name (if hebrew)
  if (isHe) {
    const prefsNames = (route as any).preferences?.names;
    if (prefsNames?.he) displayTitle = prefsNames.he;
    else if ((route as any).name_he) displayTitle = (route as any).name_he;

    const prefsDesc = (route as any).preferences?.descriptions;
    if (prefsDesc?.he) displayDescription = prefsDesc.he;
  } else {
    // Fallback for English if saved in "he" originally but user is "en"
    const prefsNames = (route as any).preferences?.names;
    if (prefsNames?.en) displayTitle = prefsNames.en;

    const prefsDesc = (route as any).preferences?.descriptions;
    if (prefsDesc?.en) displayDescription = prefsDesc.en;
  }

  // Parse title: Extract main title and subtitle
  // Format: "Long Descriptive Title (Short Name)" -> Show "City | Short Name" + subtitle "Long Descriptive Title"
  const parenMatch = displayTitle.match(/(.*?)\s*\((.*?)\)/);
  const longDescription = parenMatch ? parenMatch[1].trim() : "";
  const shortTitle = parenMatch ? parenMatch[2].trim() : displayTitle;
  const mainTitle = shortTitle; // Use short title as main
  const subTitle = longDescription; // Use long description as subtitle
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // Internal loading state for button feedback only (non-blocking)
  const [isUpdating, setIsUpdating] = useState(false);
  const [initialPrefs, setInitialPrefs] = useState<UserPreferences | null>(null);

  const touchStart = useRef<number | null>(null);
  const { playText, queueText, stop, isPlaying } = useAudio();
  const { isPremium } = usePremium();
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Check offline status on mount
  React.useEffect(() => {
    if (route?.id) {
      isRouteOffline(route.id).then(exists => {
        if (exists) setDownloadState('done');
        else setDownloadState('idle');
      });
    }
  }, [route?.id]);

  const handleDownloadToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPremium) {
      showToast?.(isHe ? 'זמין למנויי פרימיום בלבד' : 'Available for Premium users only', 'error');
      return;
    }

    // If already done, remove it
    if (downloadState === 'done') {
      await removeOfflineRoute(route.id);
      setDownloadState('idle');
      showToast?.(isHe ? 'המסלול הוסר מהמכשיר' : 'Route removed from offline');
      return;
    }

    if (downloadState !== 'idle') return;

    setDownloadState('downloading');
    setDownloadProgress(0);

    const success = await downloadRouteForOffline(route, (progress) => {
      setDownloadProgress(progress);
    });

    if (success) {
      setDownloadState('done');
      showToast?.(isHe ? 'המסלול ירד בהצלחה!' : 'Route downloaded successfully!');
    } else {
      setDownloadState('idle');
      showToast?.(isHe ? 'ההורדה נכשלה' : 'Download failed', 'error');
    }
  };

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
        setIsPrefsOpen(false);
        setIsUpdating(true);
        try {
          await onRegenerate();
        } finally {
          setIsUpdating(false);
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
    // Increased threshold from 60 to 100 to reduce accidental expansion
    if (dist > 100) setIsExpanded(true); else if (dist < -100) setIsExpanded(false);
    touchStart.current = null;
  };

  const handleShare = async () => {
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

    const shared = await nativeBridge.share({ title, text, url });
    if (!shared) {
      copyToClipboard(`${text}\n${url}`);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // Assuming showToast is defined elsewhere or will be added.
    // If not, you might need to define a simple alert or a custom toast function.
    // For now, I'll use a placeholder for showToast.
    // If showToast is not available, you might want to revert to alert or define it.
    // For the purpose of this edit, I'm assuming showToast exists or will be handled.
    // If showToast is not available, find a fallback.
    showToast?.(isHe ? 'הקישור הועתק!' : 'Link copied to clipboard!');
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 ${isExpanded ? 'z-[7000]' : 'z-[3500]'} flex flex-col pointer-events-auto shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${isExpanded ? 'h-[92dvh]' : 'h-[380px]'} bg-white/50 backdrop-blur-lg border-t border-white/40 overflow-hidden`}
      dir={isHe ? 'rtl' : 'ltr'} style={{ borderRadius: isExpanded ? '0' : '24px 24px 0 0' }}
      onTouchStart={(e) => touchStart.current = e.targetTouches[0].clientY} onTouchEnd={handleTouchEnd}
    >
      {/* Enrichment/Hydration Indicator */}
      {(isRegenerating || isUpdating) && (
        <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500/20 z-50">
          <div className="h-full bg-indigo-500 w-1/3 animate-[loading_1s_ease-in-out_infinite]" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar relative pb-32">
        <div className={`w-full relative transition-all duration-500 ${isExpanded ? 'h-80' : 'h-72'} bg-slate-900 group`}>
          <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full opacity-70 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />

          <div className="absolute top-2 inset-x-0 h-10 flex items-start justify-center cursor-pointer z-20" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="w-12 h-1 bg-white/40 rounded-full mt-3" />
          </div>

          {/* Action Buttons */}
          <div className={`absolute top-8 inset-x-6 flex items-center justify-between z-10 pointer-events-none`}>
            {/* Library Button */}
            <div className={isHe ? "order-1" : "order-2"}>
              <button
                onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
                className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-[12px] border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/50 transition-all pointer-events-auto group shadow-lg"
                title={isHe ? 'לספריית המסלולים' : 'To Route Library'}
              >
                <Library size={18} className="transition-transform group-hover:scale-110" />
              </button>
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
                onClick={handleDownloadToggle}
                className={`w-10 h-10 flex items-center justify-center rounded-[8px] transition-all relative overflow-hidden ${downloadState === 'done' ? 'text-emerald-400' : 'text-white/80 hover:text-white active:bg-white/10'}`}
              >
                {downloadState === 'idle' && <CloudDownload size={18} />}
                {downloadState === 'downloading' && (
                  <div className="flex items-center justify-center w-full h-full relative">
                    <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ height: `${downloadProgress}%`, top: 'auto', bottom: 0 }} />
                    <span className="text-[9px] font-bold z-10">{downloadProgress}%</span>
                  </div>
                )}
                {downloadState === 'done' && <Check size={18} />}
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
            {/* City above Title */}
            <div className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1.5 drop-shadow-md">
              {route.city}
            </div>
            {/* Main Title */}
            <h2 className="text-3xl font-bold text-white leading-tight drop-shadow-2xl">
              {mainTitle}
            </h2>
            {/* Long descriptive subtitle */}
            {subTitle && (
              <p className="text-[13px] font-normal text-white/80 mt-2 leading-snug drop-shadow-md line-clamp-2">
                {subTitle}
              </p>
            )}
            {route.parent_route_id && (
              <span className="text-[10px] font-medium text-white/40 mt-2 flex items-center gap-1 justify-end">
                <Share2 size={10} /> {isHe ? 'מבוסס על מסלול מקורי' : 'Based on original route'}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 pt-6 space-y-6">
          {isPrefsOpen && (
            <div className="animate-in slide-in-from-top duration-300">
              <QuickRouteSetup
                preferences={preferences}
                onUpdatePreferences={onUpdatePreferences}
                onGenerate={async () => { setIsPrefsOpen(false); await onRegenerate(); }}
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
                const isLoaded = poi.isFullyLoaded;

                // Localization Logic for POI Name
                let translatedName = poi.name;
                let originalName = "";

                if (isHe) {
                  if (poi.content?.name_he) translatedName = poi.content.name_he;
                  else if ((poi as any).data?.name_he) translatedName = (poi as any).data.name_he;

                  // Try to find English/Original name for secondary display
                  if (poi.content?.name_en) originalName = poi.content.name_en;
                  else if ((poi as any).data?.name_en) originalName = (poi as any).data.name_en;
                  // If the primary name IS english (heuristic check?), maybe use it as original? 
                  // For now, we trust the explict fields.
                  else if (poi.name !== translatedName) originalName = poi.name;
                } else {
                  // English Logic
                  if (poi.content?.name_en) translatedName = poi.content.name_en;
                  else if ((poi as any).data?.name_en) translatedName = (poi as any).data.name_en;

                  // Secondary could be local name if available? Not requested yet.
                }

                const showOriginalName = originalName && originalName !== translatedName;

                return (
                  <React.Fragment key={poi.id}>
                    <div
                      onClick={() => !isRegenerating && !isEditMode && onPoiClick(poi)}
                      className={`group relative bg-white/70 backdrop-blur-sm p-3 rounded-[16px] flex items-center gap-3 transition-all border border-white/80 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden ${isEditMode ? 'hover:border-amber-200' : 'cursor-pointer hover:shadow-lg hover:border-indigo-100 hover:scale-[1.01]'}`}
                    >
                      {/* Left Accent line based on category */}
                      <div className={`absolute left-0 inset-y-0 w-1 ${poi.category === 'history' ? 'bg-amber-400' :
                        poi.category === 'food' ? 'bg-orange-400' :
                          poi.category === 'architecture' ? 'bg-indigo-400' :
                            poi.category === 'nature' ? 'bg-emerald-400' :
                              poi.category === 'shopping' ? 'bg-pink-400' :
                                poi.category === 'culture' ? 'bg-purple-400' :
                                  poi.category === 'religion' ? 'bg-blue-400' :
                                    poi.category === 'art' ? 'bg-rose-400' :
                                      'bg-slate-300'
                        }`} />

                      {isEditMode && (
                        <div className="shrink-0 cursor-grab active:cursor-grabbing mr-1">
                          <GripVertical size={18} className="text-slate-300" />
                        </div>
                      )}

                      {/* POI Thumbnail Image */}
                      <div className="w-14 h-14 rounded-[12px] bg-slate-100 overflow-hidden shrink-0 border border-slate-200/50 shadow-inner relative group-hover:border-indigo-200/50 transition-colors">
                        <GoogleImage
                          query={`${poi.name} ${route.city}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className={`absolute bottom-0 inset-x-0 h-1 bg-current opacity-30 ${poi.category === 'history' ? 'text-amber-500' :
                          poi.category === 'food' ? 'text-orange-500' :
                            poi.category === 'architecture' ? 'text-indigo-500' :
                              poi.category === 'nature' ? 'text-emerald-500' :
                                'text-slate-400'
                          }`} />
                      </div>

                      <div className="flex-1 text-right min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[14px] font-bold text-slate-800 leading-tight truncate tracking-tight">
                            {translatedName}
                          </h4>
                          {(isLoaded || poi.isFullyLoaded || (poi.description && poi.description.length > 10)) && (
                            <div className="flex items-center gap-1 shrink-0 bg-emerald-50/80 px-1.5 py-0.5 rounded-full border border-emerald-100/50 shadow-xs">
                              <Check size={8} className="text-emerald-500 stroke-[4]" />
                              <span className="text-[8px] font-black text-emerald-600 tracking-tighter">READY</span>
                            </div>
                          )}
                        </div>
                        {showOriginalName && (
                          <div className="text-[11px] font-normal text-slate-400 leading-tight truncate mt-0.5">
                            {originalName}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1 min-w-0">
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${poi.category === 'history' ? 'bg-amber-50 text-amber-500' :
                            poi.category === 'food' ? 'bg-orange-50 text-orange-500' :
                              poi.category === 'architecture' ? 'bg-indigo-50 text-indigo-500' :
                                poi.category === 'nature' ? 'bg-emerald-50 text-emerald-500' :
                                  'bg-slate-50 text-slate-500'
                            }`}>
                            {(poi.category && CATEGORY_ICONS[poi.category as POICategoryType])
                              ? React.cloneElement(CATEGORY_ICONS[poi.category as POICategoryType] as React.ReactElement, { size: 10 })
                              : <MapPin size={10} />}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400/80 uppercase tracking-wide">
                            {CATEGORY_LABELS_HE[poi.category as POICategoryType]}
                          </span>

                          {index > 0 && poi.travelFromPrevious && (
                            <>
                              <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
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

            {nearbyRoutes && nearbyRoutes.length > 0 && (
              <div className="mt-8 mb-4">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <h3 className="text-[14px] font-bold text-slate-800">{isHe ? 'מסלולים מוכנים' : 'Ready Routes'}</h3>
                </div>
                <div className="flex overflow-x-auto pb-4 gap-3 -mx-4 px-4 no-scrollbar snap-x snap-mandatory">
                  {nearbyRoutes.map((r, i) => (
                    <button
                      key={r.id || i}
                      onClick={() => onRouteSelect?.(r)}
                      className="shrink-0 w-[140px] snap-start flex flex-col gap-2 group text-right"
                    >
                      <div className="aspect-[4/3] w-full bg-slate-100 rounded-[12px] overflow-hidden relative shadow-sm border border-slate-100/50">
                        <GoogleImage query={`${r.city} ${r.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 right-2 left-2 flex justify-between items-end">
                          <span className="text-[10px] font-bold text-white leading-tight line-clamp-2">{r.name}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
};
