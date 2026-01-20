
import React, { useState, useEffect, useRef } from 'react';
import { Route, POI, UserPreferences, POICategoryType } from '../types';
import { 
  Navigation, Building2, Utensils, Ship, Trees, ShoppingBag, Palette, 
  Landmark, Church, Heart, Plus, Download, X, Search, CheckCircle2, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, DownloadCloud, 
  Loader2, Trash2, Check, Sliders, Edit3, GripVertical, MapPin, BookOpen,
  Settings2, Sparkles, Wand2
} from 'lucide-react';
import { GoogleImage } from './GoogleImage';
import { QuickRouteSetup } from './QuickRouteSetup';
import { getCityImage } from '../utils';
import { suggestNearbyGems } from '../services/geminiService';

declare var google: any;

interface Props {
  route: Route;
  onPoiClick: (poi: POI) => void;
  onRemovePoi: (id: string) => void;
  onAddPoi: (poi: POI) => void;
  preferences: UserPreferences;
  onUpdatePreferences: (p: UserPreferences) => void;
  onRequestRefine: () => void;
  user: any;
  isSaved?: boolean;
  onSave?: () => void;
  onOffline?: () => void;
  onRemoveOffline?: (id: string) => void;
  isOfflineLoading?: boolean;
  offlineProgress?: number;
  isOfflineSaved?: boolean;
  onClose?: () => void;
}

export const CATEGORY_ICONS: Record<POICategoryType, React.ReactNode> = {
  history: <Landmark size={14} />,
  food: <Utensils size={14} />,
  architecture: <Building2 size={14} />,
  nature: <Trees size={14} />,
  shopping: <ShoppingBag size={14} />,
  sailing: <Ship size={14} />,
  culture: <Palette size={14} />,
  religion: <Church size={14} />,
  art: <Landmark size={14} />
};

export const CATEGORY_LABELS_HE: Record<POICategoryType, string> = {
  history: 'היסטוריה',
  food: 'קולינריה',
  architecture: 'אדריכלות',
  nature: 'נוף וטבע',
  shopping: 'שופינג',
  sailing: 'שייט',
  culture: 'תרבות',
  religion: 'דת ומורשת',
  art: 'אמנות'
};

const stripEnglish = (text: string) => {
  return text.replace(/[a-zA-Z]/g, '').replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').trim();
};

export const RouteOverview: React.FC<Props> = ({ 
  route, onPoiClick, onRemovePoi, onAddPoi, onSave, isSaved, onClose, preferences, onUpdatePreferences, onOffline, isOfflineLoading, offlineProgress, onRemoveOffline, isOfflineSaved, onRequestRefine 
}) => {
  const isHe = preferences.language === 'he';
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedPois, setSuggestedPois] = useState<POI[]>([]);

  const touchStart = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const distance = touchStart.current - e.changedTouches[0].clientY;
    if (distance > 60) setIsExpanded(true);
    else if (distance < -60) setIsExpanded(false);
    touchStart.current = null;
  };

  useEffect(() => {
    if (isEditMode && suggestedPois.length === 0 && route.pois.length > 0) {
      const lastPoi = route.pois[route.pois.length - 1];
      suggestNearbyGems({ city: route.city, lat: lastPoi.lat, lng: lastPoi.lng }, preferences.language)
        .then(gems => {
          const formatted = gems.map((g: any, i: number) => ({
            id: `new-gem-${Date.now()}-${i}`,
            name: g.name,
            lat: g.lat,
            lng: g.lng,
            description: g.description,
            category: 'history' as POICategoryType
          }));
          setSuggestedPois(formatted);
        });
    }
  }, [isEditMode]);

  const handleSearchNewPoi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Using Places API (New)
      const { Place } = await google.maps.importLibrary("places") as any;
      
      const request = {
        textQuery: `${searchQuery}, ${route.city}`,
        fields: ['displayName', 'location'], // COST OPTIMIZATION: Only essential fields
        maxResultCount: 1,
        language: isHe ? 'he' : 'en'
      };

      const { places } = await Place.searchByText(request);

      if (places && places.length > 0) {
        const place = places[0];
        const newPoi: POI = {
          id: `added-${Date.now()}`,
          name: place.displayName,
          lat: place.location.lat(),
          lng: place.location.lng(),
          description: '',
          category: 'architecture',
          isFullyLoaded: false
        };
        onAddPoi(newPoi);
        setSearchQuery('');
      }
      setIsSearching(false);
    } catch (e) { 
      console.error("New Place search error:", e);
      setIsSearching(false); 
    }
  };

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const cardHeightClass = isExpanded ? 'max-h-[92dvh] h-[92dvh]' : 'h-[38dvh]';
  const cleanRouteName = stripEnglish(route.name);

  return (
    <div 
      className={`fixed inset-x-0 bottom-0 z-[1200] flex flex-col pointer-events-auto shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${cardHeightClass} glass-card`}
      dir={isHe ? 'rtl' : 'ltr'}
      style={{ borderRadius: '2rem 2rem 0 0' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {/* Handle */}
      <div onClick={toggleExpanded} className="w-full h-10 shrink-0 flex items-center justify-center cursor-pointer group relative">
        <div className={`w-12 h-1.5 bg-slate-200 rounded-full transition-all ${isExpanded ? 'bg-slate-300' : 'group-hover:bg-indigo-500'}`} />
        <button onClick={(e) => { e.stopPropagation(); onClose?.(); }} className={`absolute ${isHe ? 'right-4' : 'left-4'} top-1.5 p-2 bg-slate-100/50 text-slate-500 rounded-full`}>
           <X size={18} />
        </button>
      </div>

      <div className="px-6 pb-4 shrink-0">
          <div className={`w-full transition-all duration-700 overflow-hidden bg-slate-100 relative ${isExpanded ? 'h-40' : 'h-24'}`} style={{ borderRadius: '1rem' }}>
             <GoogleImage query={`${route.city} landmark landscape`} className="w-full h-full" />
             <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest" style={{ borderRadius: '5px' }}>
                {route.pois.length} {isHe ? "תחנות" : "Stops"}
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">{route.city}</span>
                <h2 className="text-xl font-black text-white truncate">{cleanRouteName}</h2>
             </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-6 pb-24">
         {/* Action Bar */}
         <div className="flex gap-2 shrink-0 overflow-x-auto no-scrollbar py-1">
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100'}`}
            >
              <Edit3 size={14} /> {isHe ? "עריכה" : "Edit"}
            </button>
            <button 
              onClick={() => setShowPrefs(!showPrefs)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${showPrefs ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-100'}`}
            >
              <Sliders size={14} /> {isHe ? "העדפות" : "Prefs"}
            </button>
            <button 
              onClick={onSave}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${isSaved ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-600 border-slate-100'}`}
            >
              <Heart size={14} className={isSaved ? 'fill-current' : ''} /> {isSaved ? (isHe ? "שמור" : "Saved") : (isHe ? "שמור" : "Save")}
            </button>
         </div>

         {showPrefs && (
           <div className="animate-in slide-in-from-top-4 duration-500 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xl mb-4">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isHe ? "העדפות מסלול" : "Route Preferences"}</h3>
                 <button onClick={() => setShowPrefs(false)} className="text-slate-400"><X size={16}/></button>
              </div>
              <QuickRouteSetup 
                preferences={preferences} 
                onUpdatePreferences={onUpdatePreferences} 
                onGenerate={() => { onRequestRefine(); setShowPrefs(false); }} 
                onCancel={() => setShowPrefs(false)}
                isEmbedded={true}
                isLoading={isOfflineLoading}
              />
           </div>
         )}

         {/* POI List */}
         <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Navigation size={14} className="text-indigo-500" /> {isHe ? "תחנות הסיור" : "Tour Stops"}
               </h3>
               {isEditMode && (
                 <span className="text-[10px] font-bold text-slate-400">{isHe ? "גרור לשינוי סדר" : "Drag to reorder"}</span>
               )}
            </div>

            <div className="space-y-3">
              {route.pois.map((poi, idx) => (
                <div 
                  key={poi.id}
                  onClick={() => !isEditMode && onPoiClick(poi)}
                  className={`group relative bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 transition-all ${!isEditMode ? 'hover:border-indigo-200 hover:shadow-lg active:scale-[0.98] cursor-pointer' : ''}`}
                >
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0 shadow-lg">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                       {poi.category && CATEGORY_ICONS[poi.category]}
                       <span>{isHe && poi.category ? CATEGORY_LABELS_HE[poi.category] : poi.category}</span>
                    </div>
                    <h4 className="text-[14px] font-black text-slate-900 truncate">{poi.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isEditMode ? (
                      <ChevronLeft size={18} className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRemovePoi(poi.id); }}
                        className="p-2 text-rose-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isEditMode && (
                <form onSubmit={handleSearchNewPoi} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex-1 bg-white border border-slate-100 rounded-xl flex items-center px-4 focus-within:ring-2 ring-indigo-500/10 transition-all">
                      <Search size={16} className="text-slate-300" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isHe ? "הוסף מקום למסלול..." : "Add place to route..."}
                        className="w-full bg-transparent border-none py-3 px-3 text-sm outline-none"
                      />
                   </div>
                   <button 
                     type="submit"
                     disabled={isSearching}
                     className="px-6 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                   >
                     {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                   </button>
                </form>
              )}
            </div>
         </div>

         {/* Suggested Additions */}
         {isEditMode && suggestedPois.length > 0 && (
           <div className="space-y-4 pt-4 border-t border-slate-50">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Sparkles size={14} className="text-indigo-500" /> {isHe ? "הצעות מה-AI להרחבה" : "AI Suggestions"}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                 {suggestedPois.map((p) => (
                   <div key={p.id} className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between group">
                      <div className="flex-1">
                        <h4 className="text-[13px] font-black text-indigo-900">{p.name}</h4>
                        <p className="text-[10px] text-indigo-400 mt-1 line-clamp-1">{p.description}</p>
                      </div>
                      <button 
                        onClick={() => { onAddPoi(p); setSuggestedPois(prev => prev.filter(item => item.id !== p.id)); }}
                        className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all"
                      >
                        <Plus size={18} />
                      </button>
                   </div>
                 ))}
              </div>
           </div>
         )}
      </div>

      {/* Floating Call to Action */}
      {!isExpanded && (
        <div className="absolute bottom-6 inset-x-6 z-20">
           <button 
            onClick={() => setIsExpanded(true)}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
           >
             <Navigation size={18} fill="currentColor" />
             {isHe ? "פרטי המסלול המלאים" : "Full Route Details"}
           </button>
        </div>
      )}
    </div>
  );
};
