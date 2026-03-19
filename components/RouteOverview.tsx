import React, { useRef, useState } from 'react';
import { Route, POI, UserPreferences, POICategoryType } from '../types';
import {
  Landmark, Building2, Utensils, Ship, Trees, ShoppingBag, Palette,
  Church, Heart, X, ChevronLeft, Trash2, Settings2, MapPin, Library,
  Loader2, ListTodo, CheckCircle2, Share2, AudioLines, Volume2, Pause, Play, Check, Sliders, Edit3, GripVertical, Building, ArrowRight, CloudDownload, Cloud, CloudOff, Timer
} from 'lucide-react';
import { usePremium } from '../contexts/PremiumContext';
import { downloadRouteForOffline, isRouteOffline, removeOfflineRoute } from '../services/offlineService';
import { GoogleImage } from './GoogleImage';
import { QuickRouteSetup } from './QuickRouteSetup';
import { GoogleAd } from './GoogleAd';
import { NearbyPOISuggestions } from './NearbyPOISuggestions';
import { useAudio } from '../contexts/AudioContext';
import { nativeBridge } from '../utils/nativeBridge';
import { InterstitialCard } from './InterstitialCard';
import { generateReconstructionImage } from '../services/geminiService';
import { updateRouteImage } from '../services/supabase';
import { motion, useDragControls, PanInfo } from 'framer-motion';

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
  recentRoutes?: Route[];
  onLibraryClick?: () => void;
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
  openRoutes = [], activeRouteIndex = 0, onSwitchRoute, onCloseRoute, showToast, nearbyRoutes = [], onRouteSelect, recentRoutes = [], onLibraryClick
}) => {
  const isHe = preferences.language === 'he';

  // Optimize localized names at the route level
  const localizedTitle = (isHe && (route.preferences?.names?.he || (route as any).name_he))
    ? (route.preferences?.names?.he || (route as any).name_he)
    : route.name;

  // Robust parsing: "Original Name (Translated Name)" or "Translated Name (Original Name)"
  // Priority for shortTitle should be the language of the user
  const parenMatch = localizedTitle.match(/(.*?)\s*\((.*?)\)/);
  let mainTitle = localizedTitle;
  let subTitle = route.description || "";

  if (parenMatch) {
    const p1 = parenMatch[1].trim();
    const p2 = parenMatch[2].trim();
    // If user is Hebrew and p2 contains Hebrew, p2 is our main title
    const containsHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);
    if (isHe) {
      if (containsHebrew(p2)) { mainTitle = p2; subTitle = p1; }
      else if (containsHebrew(p1)) { mainTitle = p1; subTitle = p2; }
      else { mainTitle = p2; subTitle = p1; } // Fallback to paren part as "short name"
    } else {
      if (!containsHebrew(p1)) { mainTitle = p1; subTitle = p2; }
      else if (!containsHebrew(p2)) { mainTitle = p2; subTitle = p1; }
      else { mainTitle = p1; subTitle = p2; }
    }
  }
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // Internal loading state for button feedback only (non-blocking)
  const [isUpdating, setIsUpdating] = useState(false);
  const [initialPrefs, setInitialPrefs] = useState<UserPreferences | null>(null);

  const { playText, queueText, stop, isPlaying } = useAudio();
  const { isPremium } = usePremium();
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [localReconstructionUrl, setLocalReconstructionUrl] = useState<string | null>(null);
  const [localPrompt, setLocalPrompt] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Check offline status on mount
  React.useEffect(() => {
    if (route?.id) {
      isRouteOffline(route.id).then(exists => {
        if (exists) setDownloadState('done');
        else setDownloadState('idle');
      });
    }
  }, [route?.id]);

  // SELF HEALING: If viewing a saved route that is missing historical data (legacy data),
  // Auto-generate a prompt and try to fetch an image so the UI isn't broken.
  React.useEffect(() => {
    if (!isEditMode && route && !route.historical_reconstruction_prompt && !isGeneratingImage) {
      console.log("Auto-healing legacy route: missing historical prompt");
      const defaultPrompt = `Vintage photo of ${route.name}, ${route.city}`;

      // Update local state temporarily to show loading state if needed
      // Actually we trigger generation directly
      const healRoute = async () => {
        setIsGeneratingImage(true);
        // Generate image with the new default prompt
        const url = await generateReconstructionImage(defaultPrompt, route.name);
        if (url) {
          setLocalReconstructionUrl(url);
          setLocalPrompt(defaultPrompt);
          // Save to DB so next time it's there
          // We need to update BOTH the image URL AND the prompt
          await updateRouteImage(route.id, url, defaultPrompt);
        }
        setIsGeneratingImage(false);
      };
      healRoute();
    }
  }, [route?.id, isEditMode]);

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
    console.log(`[RouteOverview] handlePlayPoi clicked for POI: ${poiToPlay.name}, index: ${idx}`);
    stop();

    // Aggressive text extraction from various possible fields
    const extractText = (p: POI) => {
      const data = (p as any);
      return data.audioText ||
        p.narrative ||
        p.tourScript ||
        p.description ||
        p.summary ||
        p.content?.description ||
        p.content?.narrative ||
        p.historicalContext ||
        "";
    };

    const currentText = extractText(poiToPlay);
    console.log(`[RouteOverview] Extracted text length: ${currentText.length}`);

    if (currentText) {
      await playText(currentText, preferences.language as 'he' | 'en', poiToPlay.id);
    } else {
      console.warn(`[RouteOverview] No text found to play for POI: ${poiToPlay.id}. Data:`, poiToPlay);
    }

    const nextPois = route.pois.slice(idx + 1);
    nextPois.forEach(nextPoi => {
      const nextText = extractText(nextPoi);
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
    showToast?.(isHe ? 'הקישור הועתק!' : 'Link copied to clipboard!');
  };

  // DRAG CONTROLS from Framer Motion
  const dragControls = useDragControls();

  // Helper to determine snap after drag
  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    // Rules for snapping:
    // 1. If high velocity (>500) -> flick logic
    // 2. If dragged past threshold (>100) -> positional logic

    if (isExpanded) {
      // Trying to close?
      if (offset > 150 || velocity > 300) {
        setIsExpanded(false);
      }
    } else {
      // Trying to open?
      if (offset < -150 || velocity < -300) {
        setIsExpanded(true);
      }
    }
  };

  return (
    <motion.div
      drag="y"
      dragListener={false} // Only drag via controls
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={onDragEnd}
      initial={false}
      animate={{
        y: isExpanded ? 0 : "calc(92dvh - 380px)",
        borderRadius: isExpanded ? 0 : 24
      }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`fixed inset-x-0 bottom-0 ${isExpanded ? 'z-[7000]' : 'z-[3500]'} flex flex-col pointer-events-auto shadow-2xl h-[92dvh] bg-white/50 backdrop-blur-lg border-t border-white/40 overflow-hidden`}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Enrichment/Hydration Indicator */}
      {(isRegenerating || isUpdating) && (
        <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500/20 z-50">
          <div className="h-full bg-indigo-500 w-1/3 animate-[loading_1s_ease-in-out_infinite]" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar relative pb-32">
        {/* DRAG HANDLER attached here to the header/image area */}
        <div
          className={`w-full relative transition-all duration-500 ${isExpanded ? 'h-80' : 'h-72'} bg-slate-900 group touch-none`}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full opacity-70 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />

          <div
            className="absolute top-2 inset-x-0 h-10 flex items-start justify-center cursor-pointer z-20"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          >
            <div className="w-12 h-1 bg-white/40 rounded-full mt-3" />
          </div>

          {/* Action Buttons */}
          <div className={`absolute top-8 inset-x-6 flex items-center justify-between z-10 pointer-events-none`}>
            {/* Back Button (Start) */}
            <div className="bg-black/30 backdrop-blur-md rounded-[8px] p-1 border border-white/10 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); if (onLibraryClick) onLibraryClick(); else if (onClose) onClose(); }}
                className="w-10 h-10 flex items-center justify-center rounded-[8px] transition-all text-white/90 hover:text-white hover:bg-white/10 active:scale-95 group"
                title={isHe ? 'לספריית המסלולים' : 'To Route Library'}
              >
                <Library size={18} className="transition-transform group-hover:scale-110" />
              </button>
            </div>

            {/* Recent Routes Carousel (Center) */}
            {recentRoutes && recentRoutes.length > 0 && (
              <div className="pointer-events-auto flex-1 mx-4 overflow-x-auto no-scrollbar flex justify-center gap-2" dir={isHe ? 'rtl' : 'ltr'}>
                <div className="flex gap-2 p-1 bg-black/20 backdrop-blur-sm rounded-[14px]">
                  {recentRoutes.map((r, i) => (
                    <button
                      key={r.id || i}
                      onClick={(e) => { e.stopPropagation(); onRouteSelect?.(r); }}
                      className="shrink-0 w-10 h-10 rounded-[10px] overflow-hidden border border-white/30 shadow-md relative group transition-transform active:scale-90"
                    >
                      <GoogleImage query={`${r.city} ${r.name}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Group (End) */}
            <div className="flex bg-black/30 backdrop-blur-md rounded-[8px] p-1 border border-white/10 pointer-events-auto">
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
              <div className="mt-2 pointer-events-auto">
                <p
                  className={`text-[13px] font-normal text-white/80 leading-snug drop-shadow-md transition-all duration-300 ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                >
                  {subTitle}
                </p>
                {subTitle.length > 80 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-[11px] font-bold text-indigo-300 mt-1 uppercase tracking-wider hover:text-white transition-colors"
                  >
                    {isDescriptionExpanded
                      ? (isHe ? 'סגור' : 'Show less')
                      : (isHe ? 'קרא עוד...' : 'Read more...')}
                  </button>
                )}
              </div>
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

            <div className="flex flex-col gap-2">
              {route.pois.map((poi, index) => {
                const isLoaded = poi.isFullyLoaded;

                // Localization Logic for POI Name
                let translatedName = poi.name;
                let originalName = "";

                // Parsing logic for POIs with "Name (נאום)" or similar
                const poiParenMatch = poi.name.match(/(.*?)\s*\((.*?)\)/);
                if (poiParenMatch) {
                  const p1 = poiParenMatch[1].trim();
                  const p2 = poiParenMatch[2].trim();
                  const containsHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);

                  if (isHe) {
                    if (containsHebrew(p2)) { translatedName = p2; originalName = p1; }
                    else { translatedName = p1; originalName = p2; }
                  } else {
                    if (!containsHebrew(p1)) { translatedName = p1; originalName = p2; }
                    else { translatedName = p2; originalName = p1; }
                  }
                } else {
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
                }

                const showOriginalName = originalName && originalName !== translatedName;

                const poiCard = (
                  <div
                    key={poi.id}
                    onClick={() => !isRegenerating && !isEditMode && onPoiClick(poi)}
                    className={`group relative bg-white border border-slate-100 p-3 rounded-[20px] flex items-center gap-4 transition-all ${isEditMode ? 'hover:border-amber-200' : 'cursor-pointer hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 active:scale-[0.98]'}`}
                    dir={isHe ? 'rtl' : 'ltr'}
                  >
                    {/* Index Number Badge */}
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-white text-white text-[9px] font-black flex items-center justify-center z-10 shadow-md">
                      {index + 1}
                    </div>

                    {isEditMode && (
                      <div className="shrink-0 cursor-grab active:cursor-grabbing">
                        <GripVertical size={18} className="text-slate-300" />
                      </div>
                    )}

                    {/* POI Thumbnail Image */}
                    <div className="w-16 h-16 rounded-[14px] bg-slate-100 overflow-hidden shrink-0 border border-slate-50 shadow-sm relative transition-all group-hover:shadow-md">
                      <GoogleImage
                        query={`${poi.name} ${route.city}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Category Identity Dot */}
                      <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full border border-white shadow-sm ${poi.category === 'history' ? 'bg-amber-400' :
                        poi.category === 'food' ? 'bg-orange-400' :
                          poi.category === 'architecture' ? 'bg-indigo-400' :
                            poi.category === 'nature' ? 'bg-emerald-400' :
                              'bg-slate-300'
                        }`} />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 w-full" style={{ textAlign: 'start' }}>
                          <h4 className="text-[16px] font-medium text-slate-800 leading-[1.3] tracking-tight break-words flex-1" dir="auto">
                            {translatedName}
                          </h4>
                          {isLoaded && (
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 shrink-0 mt-0.5">
                              <Check size={8} className="text-emerald-500 stroke-[4]" />
                            </div>
                          )}
                        </div>
                      </div>

                      {showOriginalName && (
                        <div className="text-[10px] text-slate-400 font-light leading-tight truncate mt-0.5 mb-1" style={{ textAlign: 'start', opacity: 0.6 }} dir="auto">
                          {originalName}
                        </div>
                      )}

                      <div className="flex items-center gap-2" style={{ textAlign: 'start' }}>
                        <div className="flex items-center gap-1 opacity-60">
                          <div className="text-slate-400">
                            {(poi.category && CATEGORY_ICONS[poi.category as POICategoryType])
                              ? React.cloneElement(CATEGORY_ICONS[poi.category as POICategoryType] as React.ReactElement<any>, { size: 10 })
                              : <MapPin size={10} />}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            {CATEGORY_LABELS_HE[poi.category as POICategoryType]}
                          </span>
                        </div>

                        {index > 0 && poi.travelFromPrevious && (
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-200" />
                            <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400/70 whitespace-nowrap">
                              <Timer size={9} />
                              <span>{poi.travelFromPrevious.duration}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isEditMode && (
                      <div className={`shrink-0 flex items-center justify-center ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all duration-300`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePlayPoi(poi, index); }}
                          className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all border border-indigo-100 shadow-sm"
                        >
                          <Play size={16} fill="currentColor" />
                        </button>
                      </div>
                    )}
                  </div>
                );

                const timelineConnector = index < route.pois.length - 1 && (
                  <div key={`conn-${poi.id}`} className="flex justify-center -my-1.5 opacity-40">
                    <div className="w-0.5 h-3 bg-slate-200 rounded-full" />
                  </div>
                );

                const items = [poiCard, timelineConnector];

                // Inject Highlights (every 3 POIs, starting at index 2)
                if (index > 1 && (index + 1) % 3 === 0 && !isEditMode) { // e.g., after 2nd (index 1? no index 2 is 3rd), so at index 2 (3rd item) -> insert
                  const highlightText = route.shareTeaser || (poi.description ? poi.description.substring(0, 80) + "..." : null);
                  if (highlightText) {
                    items.push(
                      <InterstitialCard
                        key={`highlight-${index}`}
                        type="highlight"
                        isHe={isHe}
                        content={highlightText}
                      />
                    );
                  }
                }

                return items;
              })}

              {/* Reconstruction Card at the END */}
              {(!isEditMode && ((route.historical_reconstruction_prompt && route.historical_reconstruction_prompt.length > 10) || localPrompt)) && (
                <InterstitialCard
                  key="reconstruction-end-card"
                  type="reconstruction"
                  isHe={isHe}
                  prompt={localPrompt || route.historical_reconstruction_prompt}
                  imageUrl={localReconstructionUrl || route.reconstruction_image_url}
                  isLoading={isGeneratingImage}
                  onGenerateImage={async () => {
                    if (route.historical_reconstruction_prompt && !isGeneratingImage) {
                      setIsGeneratingImage(true);
                      const url = await generateReconstructionImage(
                        route.historical_reconstruction_prompt,
                        route.name // Pass specific location name for better accuracy
                      );
                      setIsGeneratingImage(false);
                      if (url) {
                        setLocalReconstructionUrl(url);
                        await updateRouteImage(route.id, url);
                      }
                    }
                  }}
                />
              )}
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
    </motion.div >
  );
};
