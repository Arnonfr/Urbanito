
import React, { useRef, useState } from 'react';
import { Route, POI, UserPreferences, POICategoryType } from '../types';
import {
  Navigation, Building2, Utensils, Ship, Trees, ShoppingBag, Palette,
  Landmark, Church, Heart, X, ChevronLeft, Trash2, Settings2, MapPin,
  Loader2, ListTodo, CheckCircle2, Share2, AudioLines, Volume2, Pause, Play, Check, Sliders
} from 'lucide-react';
import { GoogleImage } from './GoogleImage';
import { QuickRouteSetup } from './QuickRouteSetup';
import { GoogleAd } from './GoogleAd';

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
}

export const CATEGORY_ICONS: Record<POICategoryType, React.ReactNode> = {
  history: <Landmark size={20} />, food: <Utensils size={20} />, architecture: <Building2 size={20} />, nature: <Trees size={20} />,
  shopping: <ShoppingBag size={20} />, sailing: <Ship size={20} />, culture: <Palette size={20} />, religion: <Church size={20} />, art: <Landmark size={20} />
};

export const CATEGORY_LABELS_HE: Record<POICategoryType, string> = {
  history: 'היסטוריה', food: 'קולינריה', architecture: 'אדריכלות', nature: 'נוף וטבע', shopping: 'שופינג', sailing: 'שייט', culture: 'תרבות', religion: 'דת ומורשת', art: 'אמנות'
};

export const RouteOverview: React.FC<Props> = ({
  route, onPoiClick, onRemovePoi, onSave, isSaved, onClose, preferences, onUpdatePreferences, isExpanded, setIsExpanded, onRegenerate, isRegenerating
}) => {
  const isHe = preferences.language === 'he';
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  // Internal loading state for button feedback only (non-blocking)
  const [isUpdating, setIsUpdating] = useState(false);
  const [initialPrefs, setInitialPrefs] = useState<UserPreferences | null>(null);
  const touchStart = useRef<number | null>(null);

  const handlePrefsClick = async () => {
    if (isPrefsOpen) {
      // Check if preferences actually changed
      const hasChanges = JSON.stringify(initialPrefs) !== JSON.stringify(preferences);

      if (hasChanges) {
        // Act as "Confirm/Update" button
        setIsUpdating(true);
        // Wait a bit to ensure UI updates before heavy work (optional, but good for UX)
        try {
          await onRegenerate();
        } finally {
          setIsUpdating(false);
          setIsPrefsOpen(false);
        }
      } else {
        // Just close if no changes
        setIsPrefsOpen(false);
      }
    } else {
      // Open Prefs and save current state
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
    // Use AI-generated teaser if available, otherwise create a fallback
    let teaser = route.shareTeaser || "";

    // Fallback: Generate a basic teaser from POIs if no AI teaser exists
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
      ? `${teaser}\n\nבואו לטייל איתי במסלול "${cleanRouteName}":`
      : `${teaser}\n\nJoin me on the "${cleanRouteName}" tour:`;

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
    // showToast is not available here directly, but we can use alert or a simple feedback
    alert(isHe ? 'הלינק והתיאור הועתקו! מוכן לשיתוף 🚀' : 'Link and teaser copied! Ready to share 🚀');
  };

  const cleanRouteName = route.name.replace(/\s*\(.*?\)\s*/g, '');

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[3500] flex flex-col pointer-events-auto shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${isExpanded ? 'h-[92dvh]' : 'h-[380px]'} bg-white overflow-hidden`}
      dir={isHe ? 'rtl' : 'ltr'} style={{ borderRadius: isExpanded ? '0' : '8px 8px 0 0' }}
      onTouchStart={(e) => touchStart.current = e.targetTouches[0].clientY} onTouchEnd={handleTouchEnd}
    >
      <div onClick={() => setIsExpanded(!isExpanded)} className="w-full h-10 flex items-center justify-center cursor-pointer relative shrink-0">
        <div className="w-12 h-1 bg-slate-100 rounded-full" />
        <button
          onClick={(e) => { e.stopPropagation(); onClose?.(); }}
          className={`absolute ${isHe ? 'left-4' : 'right-4'} top-2 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors`}
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-6 pb-4 shrink-0">
        <div className={`w-full overflow-hidden bg-slate-900 relative rounded-[8px] ${isExpanded ? 'h-48' : 'h-32'}`}>
          <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-5">
            <span className="text-[10px] font-medium text-white/60 uppercase tracking-[0.2em] mb-1">{route.city}</span>
            <h2 className="text-xl font-semibold text-white leading-tight">{cleanRouteName}</h2>
            {route.parent_route_id && (
              <span className="text-[10px] font-medium text-indigo-300 mt-1 flex items-center gap-1">
                <Share2 size={10} /> {isHe ? 'מבוסס על מסלול מקורי' : 'Based on original route'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-6 pb-32">
        <div className="flex gap-3">
          <button
            onClick={onSave}
            className={`flex-1 h-12 rounded-[8px] border text-[11px] font-medium flex items-center justify-center gap-2 transition-all ${isSaved ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'}`}
          >
            <Heart size={16} className={isSaved ? 'fill-current' : ''} />
            {isHe ? (isSaved ? "שמור" : "שמירה") : "Save"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 h-12 rounded-[8px] border border-slate-100 bg-white text-slate-400 hover:text-slate-600 text-[11px] font-medium flex items-center justify-center gap-2 transition-all"
          >
            <Share2 size={16} />
            {isHe ? "שיתוף" : "Share"}
          </button>

          <button
            onClick={handlePrefsClick}
            disabled={isRegenerating || isUpdating}
            className={`flex-1 h-12 rounded-[8px] border text-[11px] font-medium flex items-center justify-center gap-2 transition-all overflow-hidden relative ${isPrefsOpen
              ? 'bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm'
              : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'
              }`}
          >
            {(isRegenerating || isUpdating) ? (
              <div className="animate-in fade-in zoom-in duration-300 w-full h-full flex items-center justify-center bg-indigo-50">
                <RouteTravelIcon className="w-8 h-8" animated={true} />
              </div>
            ) : isPrefsOpen ? (
              <>
                <Check size={16} />
                {isHe ? "עדכן מסלול" : "Update Tour"}
              </>
            ) : (
              <>
                <Sliders size={16} />
                {isHe ? "העדפות" : "Prefs"}
              </>
            )}
          </button>
        </div>

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
              // Parse name format: "Hebrew Name (Original Name)" or "English Name (Original Name)"
              const parenMatch = poi.name.match(/(.*?)\s*\((.*?)\)/);
              const translatedName = parenMatch ? parenMatch[1].trim() : poi.name;
              const originalName = parenMatch ? parenMatch[2].trim() : "";
              const isLoaded = poi.isFullyLoaded;

              // Determine if we should show the original name (only if different from translated)
              const showOriginalName = originalName && originalName !== translatedName;

              return (
                <React.Fragment key={poi.id}>
                  <div onClick={() => !isRegenerating && onPoiClick(poi)} className="group bg-white p-3 rounded-[12px] flex items-center gap-4 cursor-pointer hover:shadow-md transition-all border border-slate-100 hover:border-indigo-200 relative overflow-hidden">
                    {/* Category Icon on the right */}
                    <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm ${poi.category === 'history' ? 'bg-amber-50 text-amber-600' :
                      poi.category === 'food' ? 'bg-orange-50 text-orange-600' :
                        poi.category === 'architecture' ? 'bg-indigo-50 text-indigo-600' :
                          poi.category === 'nature' ? 'bg-emerald-50 text-emerald-600' :
                            poi.category === 'shopping' ? 'bg-pink-50 text-pink-600' :
                              poi.category === 'culture' ? 'bg-purple-50 text-purple-600' :
                                poi.category === 'religion' ? 'bg-blue-50 text-blue-600' :
                                  poi.category === 'art' ? 'bg-rose-50 text-rose-600' :
                                    'bg-slate-50 text-slate-600'
                      }`}>
                      {poi.category ? CATEGORY_ICONS[poi.category] : <MapPin size={20} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-right min-w-0 flex flex-col justify-center">
                      {/* Main name (translated) */}
                      <div className="flex items-center gap-2">
                        <h4 className="text-[15px] font-bold text-slate-800 leading-tight truncate">
                          {translatedName}
                        </h4>
                        {isLoaded && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                      </div>

                      {/* Original name if different */}
                      {showOriginalName && (
                        <div className="text-[12px] font-normal text-slate-500 leading-tight truncate opacity-80">
                          {originalName}
                        </div>
                      )}

                      {/* Meta info row: Category + Distance */}
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

                    {/* Chevron Indicator - Subtle */}
                    <div className="shrink-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -ml-1">
                      {/* Using a subtle animated indicator or just a static one */}
                      <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center">
                        <ChevronLeft size={14} className="text-slate-400 -rotate-90" />
                      </div>
                    </div>

                    {/* Progress Line - Shows loading progress */}
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

                  {/* Insert Ad after every 3 items (but not the last one) */}
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
        </div>
      </div>
    </div>
  );
};
