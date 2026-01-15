
import React, { useState, useEffect, useRef } from 'react';
import { Route, POI, UserPreferences, POICategoryType } from '../types';
import { 
  Navigation, Building2, Utensils, Ship, Trees, ShoppingBag, Palette, 
  Landmark, Church, Heart, Plus, Download, X, Search, CheckCircle2, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, DownloadCloud, 
  Loader2, Trash2, Check, Sliders, Edit3, GripVertical, MapPin 
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

/**
 * Strips all English characters and their associated punctuation from a string.
 */
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
  
  // Add Station logic
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedPois, setSuggestedPois] = useState<POI[]>([]);

  // Swipe Logic
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (distance > minSwipeDistance && !isExpanded) setIsExpanded(true);
    if (distance < -minSwipeDistance && isExpanded) setIsExpanded(false);
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
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      service.findPlaceFromQuery({
        query: `${searchQuery}, ${route.city}`,
        fields: ['name', 'geometry', 'types', 'photos']
      }, (results: any, status: any) => {
        if (status === google.maps.places.ServiceStatus.OK && results?.[0]) {
          const place = results[0];
          const newPoi: POI = {
            id: `added-${Date.now()}`,
            name: place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            description: '',
            category: 'architecture',
            isFullyLoaded: false
          };
          onAddPoi(newPoi);
          setSearchQuery('');
        }
        setIsSearching(false);
      });
    } catch (e) { setIsSearching(false); }
  };

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const cardHeightClass = isExpanded ? 'max-h-[92dvh] h-[92dvh]' : 'h-[38dvh]';
  const cleanRouteName = stripEnglish(route.name);

  return (
    <div 
      className={`fixed inset-x-0 bottom-0 z-[1200] flex flex-col pointer-events-auto shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${cardHeightClass} glass-card`}
      dir={isHe ? 'rtl' : 'ltr'}
      style={{ borderRadius: '2rem 2rem 0 0' }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      <div onClick={toggleExpanded} className="w-full h-12 shrink-0 flex items-center justify-center cursor-pointer group relative">
        <div className={`w-12 h-1.5 bg-slate-200 rounded-full transition-all ${isExpanded ? 'bg-slate-300' : 'group-hover:bg-indigo-500'}`} />
        <button onClick={(e) => { e.stopPropagation(); onClose?.(); }} className={`absolute ${isHe ? 'right-4' : 'left-4'} top-2 p-2 bg-slate-100/50 text-slate-500 rounded-full`}>
           <X size={18} />
        </button>
      </div>

      <div className="px-6 pb-2 shrink-0">
          <div className={`w-full transition-all duration-700 overflow-hidden bg-slate-100 relative ${isExpanded ? 'h-40' : 'h-24'}`} style={{ borderRadius: '1rem' }}>
             <GoogleImage query={`${route.city} landmark`} className="w-full h-full" />
             <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest" style={{ borderRadius: '5px' }}>
                {route.pois.length} {isHe ? 'תחנות' : 'Stops'}
             </div>
          </div>
      </div>

      {/* Header Info */}
      <div className="px-6 pt-4 shrink-0">
          <span className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mb-1 block">{stripEnglish(route.city)}</span>
          <h2 className={`text-slate-900 font-black leading-tight transition-all duration-500 ${isExpanded ? 'text-2xl' : 'text-lg'}`}>{cleanRouteName}</h2>
      </div>

      {/* Unified Action Bar - 4 Buttons Together */}
      <div className="px-6 mt-4 shrink-0 grid grid-cols-4 gap-2">
          {/* Edit Button */}
          <button 
            onClick={() => setIsEditMode(!isEditMode)} 
            className={`h-14 flex flex-col items-center justify-center gap-1.5 border transition-all active:scale-90 ${isEditMode ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`} 
            style={{ borderRadius: '12px' }}
          >
            <Edit3 size={18} />
            <span className="text-[7px] font-black uppercase tracking-widest">{isHe ? 'עריכה' : 'Edit'}</span>
          </button>

          {/* Preferences Button */}
          <button 
            onClick={() => setShowPrefs(!showPrefs)} 
            className={`h-14 flex flex-col items-center justify-center gap-1.5 border transition-all active:scale-90 ${showPrefs ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`} 
            style={{ borderRadius: '12px' }}
          >
            <Sliders size={18} />
            <span className="text-[7px] font-black uppercase tracking-widest">{isHe ? 'העדפות' : 'Prefs'}</span>
          </button>

          {/* Save Button */}
          <button 
            onClick={onSave} 
            className={`h-14 flex flex-col items-center justify-center gap-1.5 border transition-all active:scale-90 ${isSaved ? 'text-pink-500 bg-pink-50 border-pink-100 shadow-inner' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`} 
            style={{ borderRadius: '12px' }}
          >
            <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
            <span className="text-[7px] font-black uppercase tracking-widest">{isHe ? 'מועדפים' : 'Save'}</span>
          </button>

          {/* Offline Button */}
          <button 
            onClick={isOfflineSaved ? () => onRemoveOffline?.(route.id) : onOffline} 
            disabled={isOfflineLoading}
            className={`h-14 flex flex-col items-center justify-center gap-1.5 border transition-all active:scale-90 ${isOfflineSaved ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : isOfflineLoading ? 'bg-indigo-50 border-indigo-100 text-indigo-400' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`} 
            style={{ borderRadius: '12px' }}
          >
            {isOfflineLoading ? <Loader2 size={18} className="animate-spin" /> : isOfflineSaved ? <Check size={18} /> : <DownloadCloud size={18} />}
            <span className="text-[7px] font-black uppercase tracking-widest">{isHe ? 'אופליין' : 'Offline'}</span>
          </button>
      </div>

      <div className={`flex-1 overflow-y-auto px-6 pt-6 no-scrollbar pb-40 space-y-8 transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Offline Progress Overlay (Only when loading) */}
        {isOfflineLoading && (
          <div className="bg-indigo-50 p-6 space-y-4 shadow-inner animate-in fade-in" style={{ borderRadius: '1rem' }}>
             <div className="flex justify-between text-[11px] font-black text-indigo-600 uppercase tracking-widest">
                <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {isHe ? 'מוריד חומרים...' : 'Downloading...'}</span>
                <span>{offlineProgress}%</span>
             </div>
             <div className="w-full h-2 bg-slate-200 overflow-hidden" style={{ borderRadius: '99px' }}><div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${offlineProgress}%` }} /></div>
          </div>
        )}

        {showPrefs && (
          <section className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 animate-in slide-in-from-top-4 duration-300">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{isHe ? 'העדפות המסלול שלי' : 'My Route Preferences'}</h3>
                <button onClick={() => setShowPrefs(false)} className="text-slate-400"><X size={14}/></button>
             </div>
             <QuickRouteSetup 
                preferences={preferences} 
                onUpdatePreferences={onUpdatePreferences} 
                onGenerate={() => { onRequestRefine(); setShowPrefs(false); }} 
                onCancel={() => setShowPrefs(false)} 
                isEmbedded={true}
             />
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Navigation size={14} /> {isHe ? 'תחנות הטיול' : 'Route Stops'}</h3>
            {isEditMode && <span className="text-[9px] font-black text-indigo-500 uppercase animate-pulse">{isHe ? 'מצב עריכה פעיל' : 'Edit mode active'}</span>}
          </div>
          <div className="space-y-3">
            {route.pois.map((p, i) => (
              <div key={p.id} className="relative">
                <div className={`w-full flex items-center gap-4 p-4 bg-white border border-slate-100 text-right group hover:border-indigo-200 transition-all shadow-sm ${isEditMode ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`} style={{ borderRadius: '12px' }} onClick={() => !isEditMode && onPoiClick(p)}>
                  {isEditMode && <GripVertical size={16} className="text-slate-300 cursor-grab active:cursor-grabbing" />}
                  <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center shrink-0 text-[11px] font-black" style={{ borderRadius: '5px' }}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] text-slate-900 font-bold truncate">{stripEnglish(p.name)}</h4>
                    <div className="text-[9px] text-slate-400 flex items-center gap-1 uppercase font-black tracking-widest mt-0.5">{p.category && CATEGORY_ICONS[p.category]}<span>{isHe ? CATEGORY_LABELS_HE[p.category || 'history'] : p.category}</span></div>
                  </div>
                  {!isEditMode && <ChevronLeft size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />}
                </div>
                
                {isEditMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemovePoi(p.id); }}
                    className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300"
                    style={{ borderRadius: '50% !important' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Station Section in Edit Mode */}
          {isEditMode && (
            <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-2">
                 <div className="h-px bg-slate-200 flex-1" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isHe ? 'הוספת תחנה' : 'Add Station'}</span>
                 <div className="h-px bg-slate-200 flex-1" />
               </div>

               {/* Free Search */}
               <form onSubmit={handleSearchNewPoi} className="relative group">
                 <input 
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder={isHe ? 'חיפוש מקום להוספה...' : 'Search place to add...'}
                   className="w-full h-14 bg-white border border-slate-100 px-12 text-[13px] font-medium outline-none focus:border-indigo-500 transition-all shadow-sm"
                   style={{ borderRadius: '12px' }}
                 />
                 <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                 <button 
                   type="submit"
                   disabled={isSearching || !searchQuery.trim()}
                   className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 text-white flex items-center justify-center transition-all disabled:opacity-30"
                   style={{ borderRadius: '5px' }}
                 >
                   {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
                 </button>
               </form>

               {/* Suggestions Carousel */}
               <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{isHe ? 'הצעות בקרבת מקום' : 'Nearby Suggestions'}</h4>
                 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                   {suggestedPois.map((p) => (
                     <button 
                       key={p.id}
                       onClick={() => onAddPoi(p)}
                       className="flex-shrink-0 w-36 bg-white border border-slate-100 p-2 shadow-sm text-right group hover:border-indigo-200 transition-all"
                       style={{ borderRadius: '10px' }}
                     >
                       <div className="aspect-square bg-slate-50 mb-2 relative overflow-hidden" style={{ borderRadius: '6px' }}>
                          <GoogleImage query={`${p.name}, ${route.city}`} className="w-full h-full grayscale-[0.2] group-hover:grayscale-0" />
                          <div className="absolute top-1 left-1 bg-white/80 p-1 rounded-sm"><Plus size={10} className="text-indigo-600" /></div>
                       </div>
                       <h5 className="text-[10px] font-bold text-slate-900 truncate">{stripEnglish(p.name)}</h5>
                       <span className="text-[7px] text-slate-400 uppercase tracking-widest">{isHe ? CATEGORY_LABELS_HE[p.category || 'history'] : p.category}</span>
                     </button>
                   ))}
                   {suggestedPois.length === 0 && (
                     <div className="w-full flex items-center justify-center py-6 text-[10px] text-slate-300 uppercase font-black tracking-widest">
                       {isHe ? 'מחפש הצעות...' : 'Scanning for gems...'}
                     </div>
                   )}
                 </div>
               </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
