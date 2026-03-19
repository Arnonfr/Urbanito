/**
 * LibraryPage — extracted from App.tsx inline library.
 * Same UI as the original library. No separate data fetching —
 * all data comes via props from App.tsx (already loaded + cached).
 * Fixes:
 *  - Language-keyed cache bug (search state is local, not global)
 *  - Carousel drag logic is local (no shared refs with App)
 *  - Shows max 15 routes (was 30) to reduce GoogleImage API calls
 */

import React, { useState, useRef } from 'react';
import { Search, BookOpen, History, Globe, ArrowRight, Loader2 } from 'lucide-react';
import { RouteCard } from './RouteCard';
import { GoogleImage } from './GoogleImage';
import { Route } from '../types';

// --- Static constants (mirrors App.tsx) ---
const CATEGORY_FILTERS = [
  { id: 'europe', he: 'אירופה', en: 'Europe', icon: '🏛' },
  { id: 'asia', he: 'אסיה והמזרח', en: 'Asia & ME', icon: '🌏' },
  { id: 'urban', he: 'אורבני', en: 'Urban', icon: '🏙️' },
  { id: 'exotic', he: 'אקזוטי', en: 'Exotic', icon: '🏝️' },
];

const getCityCategories = (city: any) => {
  const name = (city.name_en || city.name).toLowerCase();
  const cats = new Set(['urban']);
  if (['jerusalem', 'tel aviv', 'hadera', 'haifa', 'eilat', 'dubai', 'tokyo', 'bangkok'].some(c => name.includes(c))) {
    cats.add('asia');
  } else if (['paris', 'london', 'barcelona', 'rome', 'berlin', 'amsterdam', 'madrid', 'prague', 'budapest'].some(c => name.includes(c))) {
    cats.add('europe');
  } else if (['bali', 'phuket', 'maldives', 'hawaii', 'cancun'].some(c => name.includes(c))) {
    cats.add('exotic');
    cats.delete('urban');
  }
  return cats;
};

// --- Props ---
interface LibraryPageProps {
  isHe: boolean;
  popularCities: any[];
  recentGlobalRoutes: Route[];
  viewingCity: string | null;
  viewingCityData: any;
  citySpecificRoutes: Route[];
  isLoadingCityRoutes: boolean;
  onOpenRoute: (city: string, route: Route) => void;
  onCitySelect: (city: any) => void;
  onClearViewingCity: () => void;
}

const LibraryPage: React.FC<LibraryPageProps> = ({
  isHe,
  popularCities,
  recentGlobalRoutes,
  viewingCity,
  viewingCityData,
  citySpecificRoutes,
  isLoadingCityRoutes,
  onOpenRoute,
  onCitySelect,
  onClearViewingCity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Carousel drag state (local — not shared with App)
  const citiesScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!citiesScrollRef.current) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartX.current = e.pageX;
    dragStartScrollLeft.current = citiesScrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !citiesScrollRef.current) return;
    e.preventDefault();
    const walk = (e.pageX - dragStartX.current) * 2;
    citiesScrollRef.current.scrollLeft = dragStartScrollLeft.current - walk;
    if (Math.abs(e.pageX - dragStartX.current) > 5) hasDragged.current = true;
  };

  const handleMouseUp = () => { isDragging.current = false; };

  // Filtered cities
  const filteredCities = (popularCities.length > 0 ? popularCities : [])
    .filter(city => {
      if (!city.img_url) return false;
      const matchesSearch = !searchQuery ||
        city.name.includes(searchQuery) ||
        city.name_en?.toLowerCase().includes(searchQuery.toLowerCase());
      const cityRoutes = recentGlobalRoutes.filter(r => r.city === city.name || r.city === city.name_en);
      const hasMatchingRoute = !searchQuery || cityRoutes.some(r =>
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesCategory = !selectedCategory || getCityCategories(city).has(selectedCategory);
      return (matchesSearch || hasMatchingRoute) && matchesCategory;
    });

  // Search results (max 10)
  const searchResults = searchQuery.trim()
    ? recentGlobalRoutes.filter(r =>
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.pois?.some((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 10)
    : [];

  return (
    <div
      key={viewingCity || 'library-main'}
      className={`absolute inset-0 bg-slate-50 z-[3000] overflow-y-auto pb-48 animate-in slide-in-from-bottom duration-500 pointer-events-auto shadow-2xl ${viewingCity ? 'p-0' : 'px-6'}`}
      style={{ height: '100%', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehaviorY: 'contain' }}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* ───── MAIN VIEW ───── */}
      {!viewingCity && (
        <div className="px-1">
          <div className="flex justify-between items-center mb-8 pt-4 mt-6 top-safe-area">
            <h2 className="text-3xl font-medium tracking-tight">{isHe ? 'ספריה' : 'Library'}</h2>
          </div>

          <div className="space-y-8">
            {/* Sticky search + category filters */}
            <div className="sticky top-0 -mx-6 px-6 bg-slate-50/95 backdrop-blur-md pt-4 pb-4 z-10 space-y-3 border-b border-slate-100/50">
              <div className="relative shadow-sm rounded-[12px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isHe ? 'חיפוש ערים, מסלולים ומקומות...' : 'Search cities, routes & places...'}
                  className="w-full bg-white border border-slate-200 rounded-[12px] py-3 pr-10 pl-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1.5 ${!selectedCategory ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                  <Globe size={12} /> {isHe ? 'הכל' : 'All'}
                </button>
                {CATEGORY_FILTERS.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1.5 ${selectedCategory === cat.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{isHe ? cat.he : cat.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <section className="mb-4">
                <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Search size={12} className="text-indigo-500" /> {isHe ? 'תוצאות חיפוש' : 'Search Results'}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {searchResults.map((route, idx) => (
                    <RouteCard
                      key={route.id || idx}
                      route={route}
                      isHe={isHe}
                      onSelect={r => onOpenRoute(r.city, r)}
                      localizedCity={route.city}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Cities carousel */}
            <section>
              <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <BookOpen size={12} className="text-[#6366F1]" /> {isHe ? 'ערים פופולריות' : 'Popular Cities'}
              </h3>
              <div
                ref={citiesScrollRef}
                className="flex overflow-x-auto snap-x scroll-pl-6 pb-4 -mx-6 px-6 gap-3 no-scrollbar cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {filteredCities.map(city => (
                  <button
                    key={city.id}
                    onClick={e => {
                      if (hasDragged.current) { e.preventDefault(); return; }
                      onCitySelect(city);
                    }}
                    className="group flex flex-col gap-2 shrink-0 w-[140px] snap-start text-right transition-transform active:scale-95"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden shadow-lg rounded-[16px] bg-slate-200 w-full">
                      {city.img_url ? (
                        <img
                          src={city.img_url}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          alt={city.name}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <GoogleImage query={`${city.name} landmark`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-3 right-3 left-3">
                        <span className="text-white text-[15px] font-bold leading-tight block shadow-sm">{city.name}</span>
                        <span className="text-white/70 text-[10px] uppercase font-medium tracking-wider block mt-0.5">{city.name_en}</span>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredCities.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs w-full">
                    {isHe ? 'לא נמצאו ערים תואמות' : 'No matching cities found'}
                  </div>
                )}
              </div>
            </section>

            {/* Recent community routes — limited to 15 to reduce API calls */}
            {recentGlobalRoutes.length > 0 && (
              <section>
                <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <History size={12} className="text-amber-500" /> {isHe ? 'מסלולים אחרונים בקהילה' : 'Recent Community Tours'}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {recentGlobalRoutes.slice(0, 15).map((route, idx) => {
                    const cityObj = popularCities.find(c =>
                      c.name === route.city ||
                      c.name_en === route.city ||
                      (route.city && c.name_en && route.city.toLowerCase() === c.name_en.toLowerCase())
                    );
                    const localizedCity = isHe && cityObj ? cityObj.name : (cityObj?.name_en || route.city);
                    return (
                      <RouteCard
                        key={route.id || idx}
                        route={route}
                        isHe={isHe}
                        onSelect={r => onOpenRoute(r.city, r)}
                        localizedCity={localizedCity}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ───── CITY DRILL-DOWN VIEW ───── */}
      {viewingCity && (
        <div className="animate-in slide-in-from-bottom duration-500 pb-20">
          {/* Hero image */}
          <div className="relative w-full h-[320px] mb-6 shadow-2xl">
            <div className="absolute inset-0 animate-in fade-in duration-500">
              {viewingCityData?.img_url ? (
                <img src={viewingCityData.img_url} className="w-full h-full object-cover" alt={viewingCity} />
              ) : (
                <GoogleImage query={`${viewingCity} landmark`} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
            </div>

            <div className="absolute top-0 left-0 right-0 p-6 pt-16 flex justify-between items-start z-10">
              <button
                onClick={onClearViewingCity}
                className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/30 rounded-[12px] flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg"
              >
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="absolute bottom-8 right-6 left-6 text-right z-10">
              <span className="text-indigo-300 font-bold uppercase tracking-[0.2em] text-[11px] mb-2 block animate-in slide-in-from-right duration-700 delay-100 drop-shadow-md">
                {isHe ? 'מדריך טיולים' : 'Travel Guide'}
              </span>
              <h1 className="text-5xl font-bold text-white mb-1 drop-shadow-xl animate-in slide-in-from-bottom duration-700 delay-200">{viewingCity}</h1>
              <p className="text-slate-200 text-sm font-medium animate-in fade-in duration-700 delay-300 drop-shadow-md">{viewingCityData?.name_en}</p>
            </div>
          </div>

          {isLoadingCityRoutes ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <Loader2 className="animate-spin text-indigo-500" />
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                {isHe ? 'מחפש מסלולים...' : 'Searching Tours...'}
              </p>
            </div>
          ) : (
            <div className="space-y-12 px-6">
              {citySpecificRoutes.length > 0 ? (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-[14px] font-bold text-slate-800">{isHe ? 'מסלולים נבחרים' : 'Curated Tours'}</h4>
                    <div className="h-px bg-slate-100 flex-1" />
                  </div>
                  <div className="space-y-3">
                    {citySpecificRoutes.map((route, idx) => (
                      <RouteCard
                        key={route.id || idx}
                        route={route}
                        isHe={isHe}
                        onSelect={r => onOpenRoute(r.city, r)}
                        localizedCity={isHe ? viewingCityData?.name : viewingCityData?.name_en}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                  <p className="text-[11px] uppercase tracking-widest">
                    {isHe ? 'אין עדיין מסלולים בעיר זו' : 'No tours for this city yet'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
