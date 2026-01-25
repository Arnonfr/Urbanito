
import React, { useRef, useState } from 'react';
import { Route, POI, UserPreferences, POICategoryType } from '../types';
import {
  Navigation, Building2, Utensils, Ship, Trees, ShoppingBag, Palette,
  Landmark, Church, Heart, X, ChevronLeft, Trash2, Settings2, MapPin,
  Loader2, ListTodo, CheckCircle2, ArrowUpRight, Sliders
} from 'lucide-react';
import { GoogleImage } from './GoogleImage';
import { QuickRouteSetup } from './QuickRouteSetup';

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
  const touchStart = useRef<number | null>(null);

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dist = touchStart.current - e.changedTouches[0].clientY;
    if (dist > 60) setIsExpanded(true); else if (dist < -60) setIsExpanded(false);
    touchStart.current = null;
  };

  const handleShare = () => {
    // Generate a "cool" teaser based on the route content
    let teaser = "";
    if (route.pois && route.pois.length > 0) {
      const firstPoi = route.pois[0];
      const secondPoi = route.pois[1];
      const cleanFirst = firstPoi.name.replace(/\s*\(.*?\)\s*/g, '').trim();

      if (isHe) {
        teaser = `אתם ידעתם שב${cleanFirst} יש סיפור מטורף? 🧐\n`;
        if (secondPoi) {
          const cleanSecond = secondPoi.name.replace(/\s*\(.*?\)\s*/g, '').trim();
          teaser += `ואחר כך ממשיכים ל${cleanSecond} ועוד מלא מקומות סודיים...`;
        }
      } else {
        teaser = `Did you know there's an amazing story behind ${cleanFirst}? 🧐\n`;
        if (secondPoi) {
          const cleanSecond = secondPoi.name.replace(/\s*\(.*?\)\s*/g, '').trim();
          teaser += `Then we'll head to ${cleanSecond} and more hidden gems...`;
        }
      }
    }

    const title = 'Urbanito - Your Urban Guide';
    const text = isHe
      ? `${teaser}\n\nבואו לטייל איתי במסלול " ${cleanRouteName} " הנה הלינק:`
      : `${teaser}\n\nJoin me for " ${cleanRouteName} " tour! Here is the link:`;

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
            <ArrowUpRight size={16} />
            {isHe ? "שיתוף" : "Share"}
          </button>
          <button
            onClick={() => setIsPrefsOpen(!isPrefsOpen)}
            disabled={isRegenerating}
            className={`flex-1 h-12 rounded-[8px] border text-[11px] font-medium flex items-center justify-center gap-2 transition-all ${isPrefsOpen ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'}`}
          >
            <Sliders size={16} />
            {isHe ? "העדפות" : "Prefs"}
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
            {route.pois.map((poi) => {
              const parenMatch = poi.name.match(/(.*?)\s*\((.*?)\)/);
              const translatedName = parenMatch ? parenMatch[1].trim() : poi.name;
              const originalName = parenMatch ? parenMatch[2].trim() : "";
              const isLoaded = poi.isFullyLoaded;

              // Show original name if translated != original, otherwise show address placeholder (simulated)
              const secondaryLine = originalName || (isHe ? "כתובת התחנה..." : "Station address...");

              return (
                <div key={poi.id} onClick={() => !isRegenerating && onPoiClick(poi)} className="group bg-slate-50/40 p-4 rounded-[8px] flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100/50 relative overflow-hidden">
                  <div className="text-[#6366F1] shrink-0">
                    {poi.category ? CATEGORY_ICONS[poi.category] : <MapPin size={20} />}
                  </div>
                  <div className="flex-1 text-right min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[16px] font-medium text-slate-900 truncate leading-tight">{translatedName}</h4>
                      {isLoaded && <CheckCircle2 size={12} className="text-[#14B8A6] shrink-0" />}
                    </div>
                    <div className="text-[12px] font-normal text-slate-400 truncate mt-0.5 uppercase tracking-wide">
                      {secondaryLine}
                    </div>
                  </div>
                  <ChevronLeft size={16} className="text-slate-300" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
