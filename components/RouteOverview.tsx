
import React, { useState, useRef, useEffect } from 'react';
import { Route, POI, UserPreferences, POICategoryType } from '../types';
import { MapPin, Navigation, Camera, Building2, Utensils, ChevronUp, ChevronDown, Sparkles, Ship, Trees, ShoppingBag, Palette, Landmark, Church, Heart, Check, Plus, Link as LinkIcon, Loader2, Search, X, Wand2, SearchCode, Globe, Download, Footprints, Clock, BookMarked } from 'lucide-react';
import { suggestNearbyGems } from '../services/geminiService';

declare var google: any;

interface Props {
  route: Route;
  setRoute?: (r: Route) => void;
  onPoiClick: (poi: POI) => void;
  savedPois?: any[];
  preferences: UserPreferences;
  onUpdatePreferences: (p: UserPreferences) => void;
  onRequestRefine: () => void;
  user: any;
  onSave?: () => void;
  isSaved?: boolean;
  onToggleDownload?: () => void;
  isOfflineDownloaded?: boolean;
}

const STACK_COLORS = ['bg-emerald-600', 'bg-teal-600', 'bg-green-600', 'bg-emerald-700', 'bg-teal-700'];

const CITY_IMAGES_PRESETS: Record<string, string> = { 
  'פריז': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', 
  'ירושלים': 'https://images.unsplash.com/photo-1541093113199-a2e9d84e903f?auto=format&fit=crop&w=800&q=80', 
  'עכו': 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&w=800&q=80'
};

const getCityImage = (city: string) => CITY_IMAGES_PRESETS[city] || `https://images.unsplash.com/featured/?${encodeURIComponent(city)},vibrant,cityscape`;

export const CATEGORY_ICONS: Record<POICategoryType, React.ReactNode> = {
  history: <Landmark size={14} />,
  food: <Utensils size={14} />,
  architecture: <Building2 size={14} />,
  nature: <Trees size={14} />,
  shopping: <ShoppingBag size={14} />,
  sailing: <Ship size={14} />,
  culture: <Palette size={14} />,
  religion: <Church size={14} />,
  art: <Camera size={14} />
};

export const CATEGORY_LABELS_HE: Record<POICategoryType, string> = {
  history: 'אתר היסטורי', food: 'אוכל ושתייה', architecture: 'אדריכלות', nature: 'טבע ונוף', shopping: 'קניות', sailing: 'שיט וחופים', culture: 'תרבות', religion: 'אתר דתי', art: 'אמנות'
};

const getPoiIcon = (poi: POI) => {
  if (poi.category && CATEGORY_ICONS[poi.category]) return CATEGORY_ICONS[poi.category];
  return <MapPin size={14} />;
};

export const RouteOverview: React.FC<Props> = ({ route, setRoute, onPoiClick, savedPois = [], preferences, onRequestRefine, onSave, isSaved, user, onToggleDownload, isOfflineDownloaded }) => {
  const isHe = preferences.language === 'he';
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSavedPoisList, setShowSavedPoisList] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzingGems, setIsAnalyzingGems] = useState(false);
  const [routePhotoUrl, setRoutePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
      const request = { textQuery: `${route.name}, ${route.city}`, fields: ['photos'] };
      google.maps.places.Place.searchByText(request)
        .then((result: any) => {
          if (result.places && result.places.length > 0 && result.places[0].photos && result.places[0].photos.length > 0) {
            setRoutePhotoUrl(result.places[0].photos[0].getURI({ maxWidth: 1200 }));
          }
        });
    }
  }, [route.id]);

  const t = {
    header: isHe ? "התוכנית שלנו" : "Our Plan",
    subHeader: isHe ? "סקירה מהירה של המסלול המתוכנן" : "Curated route overview",
    stations: isHe ? "תחנות" : "Stations",
    start: isHe ? "תחילת מסלול" : "Start Route",
    map: isHe ? "מפה" : "Map",
    refine: isHe ? "עדכון והתאמה" : "Refine Route",
    addStation: isHe ? "הוספת תחנה" : "Add Station",
    searchPlaceholder: isHe ? "חיפוש מקום להוספה..." : "Search place to add...",
    magicGems: isHe ? "פנינים נסתרות (AI)" : "Hidden Gems (AI)",
    addFromSaved: isHe ? "הוספה מהשמורים" : "Add from saved",
    download: isHe ? "מצב אופליין" : "Offline Mode",
    downloaded: isHe ? "נשמר" : "Saved",
    walk: isHe ? "הליכה" : "Walk"
  };

  const handleSearchAdd = async () => {
    if (!searchInput.trim() || !setRoute) return;
    setIsSearching(true);
    try {
      const { places } = await google.maps.places.Place.searchByText({
        textQuery: `${searchInput} ${route.city}`,
        fields: ['displayName', 'location', 'formattedAddress', 'editorialSummary']
      });
      if (places && places.length > 0) {
        const p = places[0];
        const newPoi: POI = {
          id: `poi-added-${Date.now()}`,
          name: p.displayName,
          lat: p.location.lat(),
          lng: p.location.lng(),
          description: p.editorialSummary || p.formattedAddress,
          historicalContext: "",
          architecturalStyle: "",
          category: 'history',
          imageUrl: `https://images.unsplash.com/featured/?${encodeURIComponent(p.displayName + " travel architecture")}`
        };
        setRoute({ ...route, pois: [...route.pois, newPoi] });
        setShowAddMenu(false);
        setSearchInput('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestGems = async () => {
    if (!setRoute) return;
    setIsAnalyzingGems(true);
    try {
      const gems = await suggestNearbyGems(route, preferences.language);
      if (gems.length > 0) {
        setRoute({ ...route, pois: [...route.pois, ...gems] });
        setShowAddMenu(false);
      }
    } catch (e) { console.error(e); } finally { setIsAnalyzingGems(false); }
  };

  const handleAddSavedPoi = (poi: POI) => {
    if (!setRoute) return;
    setRoute({ ...route, pois: [...route.pois, poi] });
    setShowSavedPoisList(false);
    setShowAddMenu(false);
  };

  const displayCity = route.city === 'Current View' ? (isHe ? "באזור המפה" : "Map Area") : route.city;
  const headerImage = routePhotoUrl || getCityImage(route.city);

  return (
    <div 
      className={`fixed inset-x-0 bottom-0 z-[300] flex flex-col pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-white/70 backdrop-blur-2xl shadow-2xl rounded-t-2xl border-t border-white/50 ${isExpanded ? 'h-[92vh]' : 'h-[25vh]'}`}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      <div className="shrink-0 pt-3 pb-2 px-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="w-10 h-1 bg-slate-300/30 rounded-full mx-auto mb-5 hover:bg-slate-300 transition-colors" />
        <div className="flex items-start justify-between">
            <div className="space-y-0.5 text-right">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.header}</h1>
              <p className={`text-slate-400 text-xs font-light transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 h-0'}`}>{t.subHeader}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); setIsExpanded(true); }} className={`p-3 rounded-xl transition-all border ${showAddMenu ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white/50 border-white/40 text-slate-400 hover:text-emerald-500 shadow-sm'}`}><Plus size={18} /></button>
              <button onClick={(e) => { e.stopPropagation(); if(!isSaved && onSave) onSave(); }} className={`p-3 rounded-xl transition-all border ${isSaved ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white/50 border-white/40 text-slate-400 hover:text-emerald-500 shadow-sm'}`}>{isSaved ? <Check size={18} strokeWidth={3} /> : <Heart size={18} />}</button>
              <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="p-3 bg-white/50 border border-white/40 rounded-xl text-slate-400 hover:text-slate-900 shadow-sm">{isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
            </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto px-6 pb-32 no-scrollbar transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {showAddMenu && (
          <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3.5 animate-in slide-in-from-top-4">
             <div className="flex gap-1.5">
                <div className="flex-1 bg-white rounded-xl p-1 flex items-center border border-slate-200 shadow-sm focus-within:ring-2 ring-emerald-500/10">
                   <Search size={14} className="text-slate-300 mx-2.5" />
                   <input 
                      type="text" 
                      value={searchInput} 
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchAdd()}
                      placeholder={t.searchPlaceholder}
                      className="flex-1 outline-none text-[11px] font-medium py-2 bg-transparent"
                   />
                </div>
                <button onClick={handleSearchAdd} disabled={isSearching} className="px-4 bg-slate-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest disabled:opacity-50">
                  {isSearching ? <Loader2 size={12} className="animate-spin" /> : (isHe ? 'הוספה' : 'Add')}
                </button>
             </div>
             
             <div className="grid grid-cols-2 gap-2.5">
               <button 
                  onClick={handleSuggestGems}
                  disabled={isAnalyzingGems}
                  className="py-3.5 bg-white border border-emerald-50 text-emerald-600 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all shadow-sm"
               >
                  {isAnalyzingGems ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  {t.magicGems}
               </button>
               <button 
                  onClick={() => setShowSavedPoisList(!showSavedPoisList)}
                  className="py-3.5 bg-white border border-slate-100 text-slate-600 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
               >
                  <BookMarked size={10} />
                  {t.addFromSaved}
               </button>
             </div>

             {showSavedPoisList && (
               <div className="mt-3 bg-white rounded-xl border border-slate-100 p-2.5 max-h-40 overflow-y-auto no-scrollbar space-y-1.5 animate-in fade-in duration-300">
                  {savedPois.length === 0 ? (
                    <p className="text-[9px] text-slate-400 text-center py-3">{isHe ? 'אין מקומות שמורים' : 'No saved places'}</p>
                  ) : (
                    savedPois.map(item => (
                      <button key={item.id} onClick={() => handleAddSavedPoi(item.poi_data)} className="w-full flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-100">
                        <img src={item.poi_data.imageUrl} className="w-8 h-8 rounded object-cover" alt="" />
                        <div className="flex-1 text-right overflow-hidden">
                          <h5 className="text-[10px] font-bold text-slate-900 truncate">{item.poi_data.name}</h5>
                          <span className="text-[7px] text-slate-400 uppercase tracking-widest">{item.city}</span>
                        </div>
                        <Plus size={12} className="text-emerald-500" />
                      </button>
                    ))
                  )}
               </div>
             )}
          </div>
        )}

        <div className="flex justify-center mb-5">
           <button 
             onClick={(e) => { e.stopPropagation(); onToggleDownload?.(); }}
             className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${isOfflineDownloaded ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
           >
             {isOfflineDownloaded ? <Check size={12} strokeWidth={3} /> : <Download size={12} />}
             {isOfflineDownloaded ? t.downloaded : t.download}
           </button>
        </div>

        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-xl mb-8 mt-2 group">
          <img src={headerImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
          <div className="absolute top-4 right-4"><div className="bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-lg border border-white/20">{route.pois.length} {t.stations}</div></div>
          <div className="absolute bottom-6 inset-x-6 text-right">
             <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5 justify-start">
                <MapPin size={10} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{displayCity}</span>
             </div>
             <h2 className="text-2xl font-black text-white tracking-tight">{route.name}</h2>
          </div>
        </div>

        <div className="relative space-y-0 max-w-2xl mx-auto">