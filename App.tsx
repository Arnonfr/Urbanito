
import React, { useState, useEffect, useRef } from 'react';
import { Compass, Loader2, Sparkles, Route as RouteIcon, Library as LibraryIcon, User as UserIcon, Search, Sliders, X, ArrowRight, Book, History, Wand2, Globe, MapPin, Navigation, Heart, LocateFixed, Eye } from 'lucide-react';
import { UserPreferences, Route, POI, RouteConcept } from './types';
import { generateWalkingRoute, fetchCityRouteConcepts, fetchExtendedPoiDetails, suggestNearbyGems } from './services/geminiService';
import { PreferencesPanel } from './components/PreferencesPanel';
import { UnifiedPoiCard } from './components/UnifiedPoiCard';
import { RouteOverview } from './components/RouteOverview';
import { QuickRouteSetup } from './components/QuickRouteSetup';
import { FeedbackModal } from './components/FeedbackModal';
import { UserGuide } from './components/UserGuide';
import { 
  supabase, 
  getSavedRoutesFromSupabase, 
  deleteRouteFromSupabase, 
  saveRouteToSupabase, 
  updateSavedRoute,
  signInWithGoogle, 
  signOut, 
  getRecentCuratedRoutes, 
  getUniqueUserCount, 
  checkUsageLimit,
  getSavedPoisFromSupabase,
  savePoiToSupabase,
  deletePoiFromSupabase
} from './services/supabase';

declare var google: any;

const CITY_GROUPS = {
  trending: ['פריז', 'לונדון', 'ניו יורק', 'רומא', 'טוקיו'],
  europe: ['ברצלונה', 'ברלין', 'אמסטרדם', 'פראג', 'מדריד', 'וינה', 'אתונה', 'ליסבון', 'בודפשט', 'ונציה'],
  middleEast: ['ירושלים', 'עכו', 'תל אביב', 'יפו', 'חיפה', 'פטרה']
};

export const getCityImage = (city: string) => {
  const searchMap: Record<string, string> = {
    'פריז': 'Paris Eiffel Tower',
    'לונדון': 'London Big Ben',
    'ניו יורק': 'NYC Manhattan',
    'רומא': 'Rome Colosseum',
    'טוקיו': 'Tokyo Shibuya',
    'ירושלים': 'Jerusalem Old City',
    'תל אביב': 'Tel Aviv beach',
  };
  const query = searchMap[city] || `${city} city landmark`;
  return `https://images.unsplash.com/featured/?${encodeURIComponent(query)}`;
};

const CityCard: React.FC<{ 
  city: string, 
  subtitle?: string, 
  onClick: () => void,
  aspectRatio?: string
}> = ({ city, subtitle, onClick, aspectRatio = "aspect-[3/4]" }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPhoto = async () => {
      if (!(window as any).google?.maps?.places) {
        setImageUrl(getCityImage(city));
        setIsLoading(false);
        return;
      }
      try {
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const request = { query: `${city} city landmark`, fields: ['photos'] };
        service.findPlaceFromQuery(request, (results: any, status: any) => {
          if (isMounted) {
            if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.photos?.[0]) {
              setImageUrl(results[0].photos[0].getURI({ maxWidth: 800 }));
            } else {
              setImageUrl(getCityImage(city));
            }
            setIsLoading(false);
          }
        });
      } catch (e) {
        if (isMounted) {
          setImageUrl(getCityImage(city));
          setIsLoading(false);
        }
      }
    };
    fetchPhoto();
    return () => { isMounted = false; };
  }, [city]);

  return (
    <button onClick={onClick} className={`group relative w-full ${aspectRatio} rounded-2xl overflow-hidden shadow-lg border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-slate-100`}>
      {imageUrl && <img src={imageUrl} className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'} group-hover:scale-110`} alt={city} />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-4 inset-x-4 text-right">
        {subtitle && <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">{subtitle}</span>}
        <h4 className="font-bold text-white text-lg tracking-tight drop-shadow-md group-hover:text-emerald-300 transition-colors">{city}</h4>
      </div>
    </button>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(undefined); 
  const [uniqueUserCount, setUniqueUserCount] = useState(0);
  const [remainingGens, setRemainingGens] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({ 
    hiddenGemsLevel: 30, interests: ['היסטוריה'], walkingDistance: 3, desiredPoiCount: 5, language: 'he', explanationStyle: 'standard'
  });
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'navigation' | 'library' | 'profile' | 'route'>('navigation');
  
  const toggleTab = (tab: 'navigation' | 'library' | 'profile' | 'route') => {
    setActiveTab(tab);
    if (tab !== 'navigation' && tab !== 'route') {
      setSelectedPoi(null);
    }
  };

  const [libraryCity, setLibraryCity] = useState<string | null>(null);
  const [cityConcepts, setCityConcepts] = useState<RouteConcept[]>([]);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [savedPois, setSavedPois] = useState<any[]>([]);
  const [recentCurated, setRecentCurated] = useState<Route[]>([]);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [isScanningForPlaces, setIsScanningForPlaces] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);

  const isHe = preferences.language === 'he';
  const t = { 
    searchPlaceholder: isHe ? "לאן כדאי לטייל היום?" : "Where to explore?", 
    libraryTitle: isHe ? "ספריה" : "Library", 
    profileTitle: isHe ? "האזור האישי" : "Personal Area",
    createInArea: isHe ? "יצירת מסלול באזור המפה" : "Create route in map area",
    scanning: isHe ? "חיפוש מקומות..." : "Scanning for places...",
    scanButton: isHe ? "חיפוש מקומות בסביבה" : "Discover spots here",
    cityNotFound: isHe ? "עיר לא נמצאה, כדאי לנסות שוב" : "City not found, try again"
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => handleUserSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleUserSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (session: any) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    const count = await getUniqueUserCount();
    setUniqueUserCount(count);
    if (currentUser) {
      getSavedRoutesFromSupabase(currentUser.id).then(setSavedRoutes);
      getSavedPoisFromSupabase(currentUser.id).then(setSavedPois);
    }
    const quota = await checkUsageLimit(currentUser?.id || null);
    setRemainingGens(quota.remaining);
    getRecentCuratedRoutes(15).then(setRecentCurated);
    setIsAppReady(true);
  };

  useEffect(() => {
    if (isAppReady && mapRef.current && !googleMap.current) {
      googleMap.current = new google.maps.Map(mapRef.current, {
        center: { lat: 31.7767, lng: 35.2345 }, zoom: 14, gestureHandling: 'greedy', disableDefaultUI: true,
        styles: [{ "featureType": "poi", "stylers": [{ "visibility": "off" }] }]
      });
    }
  }, [isAppReady]);

  const handleFindMe = () => {
    if (navigator.geolocation && googleMap.current) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        googleMap.current.setCenter(pos);
        googleMap.current.setZoom(16);
        new google.maps.Marker({ position: pos, map: googleMap.current, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#10b981', fillOpacity: 1, strokeColor: 'white', strokeWeight: 2 } });
      });
    }
  };

  const handleSearchCity = () => {
    if (!searchQuery.trim() || !googleMap.current) return;
    setIsSearchingCity(true);
    
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    const request = {
      query: searchQuery,
      fields: ['name', 'geometry'],
    };

    service.findPlaceFromQuery(request, (results: any, status: any) => {
      setIsSearchingCity(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
        const place = results[0];
        if (place.geometry && place.geometry.location) {
          googleMap.current.setCenter(place.geometry.location);
          googleMap.current.setZoom(14);
          setSearchQuery(place.name); // Update with recognized name
        }
      } else {
        alert(t.cityNotFound);
      }
    });
  };

  const handleStartRoute = async (cityName: string, specificLocation?: { lat: number, lng: number } | null, theme?: string) => {
    setIsLoading(true);
    setShowQuickSetup(false);
    setSelectedPoi(null);
    try {
      const route = await generateWalkingRoute(cityName, specificLocation || null, preferences, theme, user?.id);
      setCurrentRoute(route);
      setActiveTab('route');
    } catch (e: any) {
      console.error(e);
      alert(isHe ? "שגיאה ביצירת מסלול. כדאי לנסות שוב." : "Error creating route.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanForPlaces = async () => {
    if (!googleMap.current) return;
    setIsScanningForPlaces(true);
    try {
      const gems = await suggestNearbyGems({ city: searchQuery || 'Current View', pois: [] } as any, preferences.language);
      if (gems.length > 0) {
        gems.forEach(p => {
          new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map: googleMap.current,
            title: p.name,
            icon: { url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }
          }).addListener('click', () => setSelectedPoi(p));
        });
      }
    } catch (e) {} finally {
      setIsScanningForPlaces(false);
    }
  };

  const handleRemovePoi = (poiId: string) => {
    if (!currentRoute) return;
    const newPois = currentRoute.pois.filter(p => p.id !== poiId);
    const updatedRoute = { ...currentRoute, pois: newPois };
    setCurrentRoute(updatedRoute);
    if (user && savedRoutes.find(r => r.route_data?.id === currentRoute.id)) {
       updateSavedRoute(user.id, updatedRoute).then(() => getSavedRoutesFromSupabase(user.id).then(setSavedRoutes));
    }
  };

  const handleEnrichPoi = (poiId: string, enrichedData: Partial<POI>) => {
    if (!currentRoute) return;
    const newPois = currentRoute.pois.map(p => p.id === poiId ? { ...p, ...enrichedData, isFullyLoaded: true } : p);
    setCurrentRoute({ ...currentRoute, pois: newPois });
    if (selectedPoi && selectedPoi.id === poiId) setSelectedPoi(prev => prev ? { ...prev, ...enrichedData, isFullyLoaded: true } : null);
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-white overflow-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      {activeTab === 'navigation' && !selectedPoi && (
        <>
          <div className="absolute top-4 inset-x-4 z-[450] flex flex-col gap-3 max-w-md mx-auto pointer-events-none">
            <div className="pointer-events-auto flex items-center bg-white shadow-xl rounded-xl p-1 border border-slate-100">
               <button onClick={() => setShowQuickSetup(true)} className="w-10 h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90 shrink-0 mx-1">
                 <Sliders size={16} />
               </button>
               <div className="flex-1 px-3">
                 <input 
                  type="text" 
                  value={searchQuery} 
                  placeholder={t.searchPlaceholder} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchCity()}
                  className="w-full outline-none text-slate-900 bg-transparent font-light text-sm py-2.5" 
                 />
               </div>
               <button onClick={handleSearchCity} className="pr-3 pl-2 text-emerald-500 active:scale-90 transition-transform">
                  {isSearchingCity ? <Loader2 size={18} className="animate-spin" /> : <Search size={18}/>}
               </button>
            </div>
            
            <div className="flex justify-center gap-2 pointer-events-auto">
               <button onClick={() => setShowQuickSetup(true)} className="bg-slate-900 shadow-xl text-white px-4 py-2.5 rounded-xl text-[10px] font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-95">
                 <Wand2 size={12} className="text-emerald-400" />
                 {t.createInArea}
               </button>
               <button onClick={handleScanForPlaces} className="bg-white shadow-lg text-slate-600 px-4 py-2.5 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-slate-100 hover:bg-slate-50 transition-all active:scale-95">
                 {isScanningForPlaces ? <Loader2 size={12} className="animate-spin text-emerald-500" /> : <Eye size={12} className="text-emerald-500" />}
                 {isScanningForPlaces ? t.scanning : t.scanButton}
               </button>
            </div>
          </div>

          <button onClick={handleFindMe} className="absolute bottom-28 right-6 z-[450] w-11 h-11 bg-white shadow-xl rounded-xl flex items-center justify-center text-slate-600 hover:text-emerald-500 border border-slate-100 active:scale-90 transition-all">
            <LocateFixed size={18} />
          </button>
        </>
      )}

      <main className="flex-1 relative h-full">
        <div ref={mapRef} className="w-full h-full grayscale-[0.2]" />

        {activeTab === 'library' && (
          <div className="absolute inset-0 bg-[#FDFBF7] z-[400] overflow-y-auto p-8 no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.libraryTitle}</h2>
              <button onClick={() => setActiveTab('navigation')} className="p-2.5 bg-white rounded-xl shadow-sm text-slate-400 hover:text-slate-900 transition-all active:scale-90"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4 pb-40">
              {CITY_GROUPS.trending.map(city => (
                <CityCard key={city} city={city} onClick={() => { setSearchQuery(city); handleStartRoute(city); }} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="absolute inset-0 bg-white z-[400] overflow-y-auto no-scrollbar p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">{t.profileTitle}</h2>
              <button onClick={() => setActiveTab('navigation')} className="p-2.5 bg-white rounded-xl shadow-sm text-slate-500 hover:text-slate-900"><X size={18}/></button>
            </div>
            <PreferencesPanel 
              preferences={preferences} 
              setPreferences={setPreferences} 
              savedRoutes={savedRoutes} 
              savedPois={savedPois} 
              user={user} 
              onLogin={signInWithGoogle} 
              onLogout={signOut} 
              onLoadRoute={(_city, r) => { setCurrentRoute(r); setActiveTab('route'); }} 
              onDeleteRoute={(id) => deleteRouteFromSupabase(id, user?.id).then(() => user?.id && getSavedRoutesFromSupabase(user.id).then(setSavedRoutes))} 
              onDeletePoi={(id) => deletePoiFromSupabase(id, user?.id).then(() => user?.id && getSavedPoisFromSupabase(user.id).then(setSavedPois))} 
              onOpenFeedback={() => setShowFeedback(true)} 
              onOpenGuide={() => setShowUserGuide(true)}
              uniqueUserCount={uniqueUserCount} 
              remainingGens={remainingGens} 
              offlineRouteIds={[]} 
              onLoadOfflineRoute={() => {}} 
            />
          </div>
        )}

        {activeTab === 'route' && currentRoute && !selectedPoi && (
          <RouteOverview route={currentRoute} setRoute={setCurrentRoute} onPoiClick={(p) => { setSelectedPoi(p); if (googleMap.current) { googleMap.current.panTo({ lat: Number(p.lat), lng: Number(p.lng) }); googleMap.current.setZoom(17); } }} savedPois={savedPois} preferences={preferences} onUpdatePreferences={setPreferences} onRequestRefine={() => setShowQuickSetup(true)} user={user} onSave={() => saveRouteToSupabase(user.id, currentRoute).then(() => getSavedRoutesFromSupabase(user.id).then(setSavedRoutes))} isSaved={!!savedRoutes.find(r => r.route_data?.id === currentRoute.id)} />
        )}

        {selectedPoi && currentRoute && (
          <UnifiedPoiCard poi={selectedPoi} route={currentRoute} currentIndex={currentRoute.pois.findIndex(p => p.id === selectedPoi.id)} totalCount={currentRoute.pois.length} onClose={() => setSelectedPoi(null)} onNext={() => { const idx = currentRoute.pois.findIndex(p => p.id === selectedPoi.id); if (idx < currentRoute.pois.length - 1) setSelectedPoi(currentRoute.pois[idx + 1]); }} onPrev={() => { const idx = currentRoute.pois.findIndex(p => p.id === selectedPoi.id); if (idx > 0) setSelectedPoi(currentRoute.pois[idx - 1]); }} onGoToPoi={(p) => { if (googleMap.current) { googleMap.current.panTo({ lat: Number(p.lat), lng: Number(p.lng) }); googleMap.current.setZoom(17); } }} onRemove={handleRemovePoi} onAddToRoute={() => {}} onSaveRoute={() => {}} isSaved={!!savedPois.find(p => p.poi_data.name === selectedPoi.name)} onToggleSave={() => {}} onEnrichPoi={handleEnrichPoi} preferences={preferences} audioState={{} as any} setAudioState={() => {}} setIsAudioExpanded={() => {}} />
        )}
      </main>

      {!selectedPoi && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[800] bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-1.5 flex gap-1.5 border border-slate-100 transition-all duration-500 w-[220px]">
          <button 
            onClick={() => toggleTab('route')} 
            className={`relative flex-1 flex justify-center items-center h-10 rounded-xl transition-all overflow-hidden ${activeTab === 'route' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:text-slate-500'} ${isLoading ? 'bg-indigo-600 text-white animate-soft' : ''}`}
          >
            {isLoading ? <Sparkles size={16} className="animate-spin text-indigo-200" /> : <RouteIcon size={18} />}
          </button>
          <button onClick={() => toggleTab('navigation')} className={`flex-1 flex justify-center items-center h-10 rounded-xl transition-all ${activeTab === 'navigation' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:text-slate-500'}`}><Compass size={18} /></button>
          <button onClick={() => toggleTab('library')} className={`flex-1 flex justify-center items-center h-10 rounded-xl transition-all ${activeTab === 'library' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:text-slate-500'}`}><LibraryIcon size={18} /></button>
          <button onClick={() => toggleTab('profile')} className={`flex-1 flex justify-center items-center h-10 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:text-slate-500'}`}><UserIcon size={18} /></button>
        </nav>
      )}

      {showQuickSetup && <QuickRouteSetup preferences={preferences} onUpdatePreferences={setPreferences} onGenerate={() => handleStartRoute(searchQuery || 'Map Area', googleMap.current?.getCenter().toJSON())} onCancel={() => setShowQuickSetup(false)} isSearchContext={true} />}
      {showFeedback && <FeedbackModal isHe={isHe} userId={user?.id} onClose={() => setShowFeedback(false)} />}
      {showUserGuide && <UserGuide isHe={isHe} onClose={() => setShowUserGuide(false)} />}
    </div>
  );
};

export default App;
