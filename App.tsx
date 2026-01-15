
import React, { useState, useEffect, useRef } from 'react';
import { Compass, Loader2, Route as RouteIcon, Library as LibraryIcon, User as UserIcon, X, Navigation, MapPin, Footprints, Plus, Heart, Target as TargetIcon, Trash2, Wand2, CheckCircle, MapPinned, Search, LocateFixed, Sparkles, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight, BookOpen, Key } from 'lucide-react';
import { UserPreferences, Route, POI } from './types';
import { generateWalkingRoute, suggestNearbyGems, generateStreetWalkRoute, fetchExtendedPoiDetails } from './services/geminiService';
import { PreferencesPanel } from './components/PreferencesPanel';
import { UnifiedPoiCard } from './components/UnifiedPoiCard';
import { RouteOverview } from './components/RouteOverview';
import { QuickRouteSetup } from './components/QuickRouteSetup';
import { FeedbackModal } from './components/FeedbackModal';
import { UserGuide } from './components/UserGuide';
import { GoogleImage } from './components/GoogleImage';
import { getCityImage } from './utils';
import { 
  supabase, 
  getSavedRoutesFromSupabase, 
  deleteRouteFromSupabase, 
  saveRouteToSupabase, 
  savePoiToSupabase,
  signInWithGoogle, 
  signOut, 
  getSavedPoisFromSupabase,
  deletePoiFromSupabase,
  getRecentCuratedRoutes,
  getRoutesByCityHub
} from './services/supabase';

declare var google: any;

const POPULAR_CITIES = [
  { name: 'פריז', nameEn: 'Paris', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80' },
  { name: 'לונדון', nameEn: 'London', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80' },
  { name: 'רומא', nameEn: 'Rome', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400&q=80' },
  { name: 'ירושלים', nameEn: 'Jerusalem', img: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=400&q=80' },
  { name: 'אמסטרדם', nameEn: 'Amsterdam', img: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=400&q=80' },
  { name: 'טוקיו', nameEn: 'Tokyo', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=80' }
];

const extractStandardCity = (results: any[]) => {
  const locality = results.find(r => r.types.includes('locality'));
  if (locality) return locality.address_components.find((c: any) => c.types.includes('locality'))?.long_name;
  
  const adminArea = results.find(r => r.types.includes('administrative_area_level_1'));
  if (adminArea) return adminArea.address_components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name;

  return results[0]?.address_components.find((c: any) => c.types.includes('locality') || c.types.includes('political'))?.long_name;
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(undefined); 
  const [preferences, setPreferences] = useState<UserPreferences>({ 
    hiddenGemsLevel: 30, interests: ['היסטוריה'], walkingDistance: 3, desiredPoiCount: 5, language: 'he', explanationStyle: 'standard'
  });
  const [activeTab, setActiveTab] = useState<'navigation' | 'profile' | 'route' | 'library'>('navigation');
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [scannedPois, setScannedPois] = useState<POI[]>([]);
  const [basketPois, setBasketPois] = useState<POI[]>([]);
  const [isGenerating, setIsGenerating] = useState(false); 
  const [isSearching, setIsSearching] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [savedPois, setSavedPois] = useState<any[]>([]);
  const [recentGlobalRoutes, setRecentGlobalRoutes] = useState<Route[]>([]);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewingCity, setViewingCity] = useState<string | null>(null);
  const [citySpecificRoutes, setCitySpecificRoutes] = useState<Route[]>([]);
  const [isLoadingCityRoutes, setIsLoadingCityRoutes] = useState(false);

  const [offlineRouteIds, setOfflineRouteIds] = useState<string[]>([]);
  const [isOfflineLoading, setIsOfflineLoading] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState(0);

  // Invite Code State
  const [hasFullAccess, setHasFullAccess] = useState(localStorage.getItem('urban_full_access') === 'true');

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const scanMarkers = useRef<any[]>([]);
  const directionsRenderer = useRef<any>(null);
  const userLocationMarker = useRef<any>(null);

  const isHe = preferences.language === 'he';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) refreshSavedContent(session.user.id);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) refreshSavedContent(session.user.id);
    });
    loadGlobalContent();
    const stored = localStorage.getItem('urbanito_offline_list');
    if (stored) try { setOfflineRouteIds(JSON.parse(stored)); } catch(e) { setOfflineRouteIds([]); }
  }, []);

  const loadGlobalContent = async () => {
    const global = await getRecentCuratedRoutes(20);
    setRecentGlobalRoutes(global);
  };

  const refreshSavedContent = async (userId: string) => {
      const routes = await getSavedRoutesFromSupabase(userId);
      const pois = await getSavedPoisFromSupabase(userId);
      setSavedRoutes(routes);
      setSavedPois(pois);
  };

  useEffect(() => {
    if (mapRef.current && !googleMap.current) {
      googleMap.current = new google.maps.Map(mapRef.current, {
        center: { lat: 31.7767, lng: 35.2345 }, zoom: 15, gestureHandling: 'greedy', disableDefaultUI: true,
        styles: [
          { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
          { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
          { "featureType": "road", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }
        ]
      });
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: googleMap.current,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: { strokeColor: '#4f46e5', strokeWeight: 5, strokeOpacity: 0.8 }
      });

      if (navigator.geolocation) {
        navigator.geolocation.watchPosition((pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (userLocationMarker.current) {
            userLocationMarker.current.setPosition(loc);
          } else {
            userLocationMarker.current = new google.maps.Marker({
              position: loc,
              map: googleMap.current,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#6366f1',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
              title: "My Location",
              zIndex: 999
            });
          }
        }, () => {}, { enableHighAccuracy: true });
      }
    }
  }, []);

  const handleCitySelect = async (city: any) => {
    setIsSearching(true);
    setViewingCity(city.nameEn);
    setIsLoadingCityRoutes(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ address: city.nameEn, language: 'en' });
      const standardizedName = extractStandardCity(res.results) || city.nameEn;
      if (res.results[0]) {
        const location = res.results[0].geometry.location;
        googleMap.current.panTo(location);
        googleMap.current.setZoom(14);
      }
      const routes = await getRoutesByCityHub(standardizedName);
      setCitySpecificRoutes(routes);
    } catch (e) { console.error(e); } finally { 
      setIsSearching(false); 
      setIsLoadingCityRoutes(false);
    }
  };

  useEffect(() => {
    if (selectedPoi && googleMap.current) {
      googleMap.current.panTo({ lat: selectedPoi.lat, lng: selectedPoi.lng });
      googleMap.current.setZoom(17);
    }
  }, [selectedPoi]);

  const clearMarkers = () => { markers.current.forEach(m => m.setMap(null)); markers.current = []; };
  const clearScanMarkers = () => { scanMarkers.current.forEach(m => m.setMap(null)); scanMarkers.current = []; };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ address: searchQuery });
      if (res.results[0]) {
        const location = res.results[0].geometry.location;
        googleMap.current.panTo(location);
        googleMap.current.setZoom(14);
        setActiveTab('navigation');
        setSearchQuery('');
      }
    } catch (e) { console.error(e); } finally { setIsSearching(false); }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        googleMap.current.panTo(loc);
        googleMap.current.setZoom(16);
      });
    }
  };

  const handleSaveRoute = async () => {
    if (!user || !currentRoute) { if (!user) signInWithGoogle(); return; }
    const geocoder = new google.maps.Geocoder();
    const res = await geocoder.geocode({ 
      location: { lat: currentRoute.pois[0].lat, lng: currentRoute.pois[0].lng }, 
      language: 'en' 
    });
    const standardizedCity = extractStandardCity(res.results) || currentRoute.city;
    const alreadySaved = savedRoutes.find(r => r.route_data.id === currentRoute.id);
    if (alreadySaved) { await deleteRouteFromSupabase(alreadySaved.id, user.id); } 
    else { await saveRouteToSupabase(user.id, { ...currentRoute, city: standardizedCity }); }
    refreshSavedContent(user.id);
  };

  const handleSaveOffline = async () => {
    if (!currentRoute) return;
    setIsOfflineLoading(true); setOfflineProgress(5);
    try {
      const updatedPois = [...currentRoute.pois];
      for (let i = 0; i < updatedPois.length; i++) {
        const poi = updatedPois[i];
        const details = await fetchExtendedPoiDetails(poi.name, currentRoute.city, preferences);
        updatedPois[i] = { ...poi, ...details, isFullyLoaded: true };
        setOfflineProgress(Math.floor(10 + (i / updatedPois.length) * 85));
      }
      const offlineRoute = { ...currentRoute, pois: updatedPois, isOffline: true };
      localStorage.setItem(`offline_route_${currentRoute.id}`, JSON.stringify(offlineRoute));
      const newList = Array.from(new Set([...offlineRouteIds, currentRoute.id]));
      setOfflineRouteIds(newList);
      localStorage.setItem('urbanito_offline_list', JSON.stringify(newList));
      setOfflineProgress(100);
      setTimeout(() => setIsOfflineLoading(false), 500);
    } catch (e) { setIsOfflineLoading(false); }
  };

  const handleRemoveOffline = (id: string) => {
    localStorage.removeItem(`offline_route_${id}`);
    const newList = offlineRouteIds.filter(oid => oid !== id);
    setOfflineRouteIds(newList);
    localStorage.setItem('urbanito_offline_list', JSON.stringify(newList));
  };

  const handleToggleSavePoi = async (poi: POI) => {
    if (!user) { signInWithGoogle(); return; }
    const alreadySaved = savedPois.find(p => p.poi_name === poi.name);
    if (alreadySaved) { await deletePoiFromSupabase(alreadySaved.id, user.id); } 
    else { await savePoiToSupabase(user.id, poi, currentRoute?.city || viewingCity || "Unknown"); }
    refreshSavedContent(user.id);
  };

  const handleRemovePoiFromRoute = (poiId: string) => {
    if (!currentRoute) return;
    const updatedPois = currentRoute.pois.filter(p => p.id !== poiId);
    if (updatedPois.length === 0) {
      setCurrentRoute(null);
      if (directionsRenderer.current) directionsRenderer.current.setDirections(null);
      clearMarkers(); setSelectedPoi(null); setActiveTab('navigation');
    } else {
      const newRoute = { ...currentRoute, pois: updatedPois };
      setCurrentRoute(newRoute);
      renderRouteMarkers(newRoute);
      setSelectedPoi(null);
    }
  };

  const handleAddPoiToRoute = (poi: POI) => {
    if (!currentRoute) return;
    const updatedPois = [...currentRoute.pois, poi];
    const newRoute = { ...currentRoute, pois: updatedPois };
    setCurrentRoute(newRoute);
    renderRouteMarkers(newRoute);
  };

  const renderRouteMarkers = (route: Route) => {
    clearMarkers(); clearScanMarkers(); setScannedPois([]);
    const bounds = new google.maps.LatLngBounds();
    route.pois.forEach((p, i) => {
      const marker = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: googleMap.current,
        label: { text: (i + 1).toString(), color: 'white', fontSize: '10px' },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 14, fillColor: '#4f46e5', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
        zIndex: 100
      });
      marker.addListener('click', () => setSelectedPoi(p));
      markers.current.push(marker);
      bounds.extend(marker.getPosition());
    });
    if (route.pois.length > 0) googleMap.current.fitBounds(bounds);
    calculateRoutePath(route.pois);
  };

  const calculateRoutePath = (pois: POI[]) => {
    if (pois.length < 2) {
      if (directionsRenderer.current) directionsRenderer.current.setDirections(null);
      return;
    }
    const directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin: { lat: pois[0].lat, lng: pois[0].lng },
      destination: { lat: pois[pois.length - 1].lat, lng: pois[pois.length - 1].lng },
      waypoints: pois.slice(1, -1).map(p => ({ location: { lat: p.lat, lng: p.lng }, stopover: true })),
      travelMode: google.maps.TravelMode.WALKING
    }, (response: any, status: string) => {
      if (status === 'OK') directionsRenderer.current.setDirections(response);
    });
  };

  const handleScanGems = async () => {
    setIsGenerating(true); setIsAiMenuOpen(false); setScannedPois([]); setBasketPois([]); clearScanMarkers();
    try {
      const center = googleMap.current.getCenter();
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ location: center, language: 'en' });
      const city = extractStandardCity(res.results) || "Unknown";
      const gems = await suggestNearbyGems({ city, lat: center.lat(), lng: center.lng() } as any, preferences.language);
      const newPois = gems.map((g: any, i: number) => ({
        id: `gem-${Date.now()}-${i}`, name: g.name, lat: g.lat, lng: g.lng, description: g.description, category: 'history', imageUrl: ""
      }));
      newPois.forEach((p: POI) => {
        const marker = new google.maps.Marker({
          position: { lat: p.lat, lng: p.lng }, map: googleMap.current,
          icon: { path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z", fillColor: '#10b981', fillOpacity: 0.9, scale: 1.5, strokeColor: '#ffffff', strokeWeight: 2, anchor: new google.maps.Point(12, 24) }
        });
        marker.addListener('click', () => setSelectedPoi(p));
        scanMarkers.current.push(marker);
      });
      setScannedPois(newPois); setActiveTab('navigation');
    } catch (e) {} finally { setIsGenerating(false); }
  };

  const handleGenerateFromBasket = () => {
    if (basketPois.length === 0) return;
    const route: Route = {
      id: `basket-${Date.now()}`, name: isHe ? "המסלול המלוקט שלי" : "My Handpicked Tour", city: viewingCity || "Local Area", pois: basketPois,
      description: isHe ? "מסלול שנבחר ידנית מתוך פנינים נסתרות." : "A tour manually picked from hidden gems.", durationMinutes: basketPois.length * 20, creator: "User Handpicked", style: 'area'
    };
    setCurrentRoute(route); renderRouteMarkers(route); setBasketPois([]); setScannedPois([]); clearScanMarkers(); setActiveTab('route');
  };

  const handleConfirmStreetWalk = async () => {
    const center = googleMap.current.getCenter();
    setIsPlacementMode(false); // EXIT IMMEDIATELY FOR FEEDBACK
    setIsGenerating(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const results = await geocoder.geocode({ location: center, language: 'en' });
      const standardizedCity = extractStandardCity(results.results) || "Unknown";
      const streetName = results.results[0]?.address_components.find((c: any) => c.types.includes('route'))?.long_name || "this street";
      const route = await generateStreetWalkRoute(streetName, center.toJSON(), preferences, user?.id);
      setCurrentRoute({ ...route, city: standardizedCity }); 
      renderRouteMarkers(route); 
      setActiveTab('route');
    } catch (e) {
      console.error("Street Walk Generation Error:", e);
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleAutoTour = async () => {
    const center = googleMap.current.getCenter();
    setIsAiMenuOpen(false);
    setIsGenerating(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ location: center, language: 'en' });
      const city = extractStandardCity(res.results) || "Local Area";
      const route = await generateWalkingRoute(city, center.toJSON(), preferences, undefined, user?.id);
      setCurrentRoute({ ...route, city: city }); 
      renderRouteMarkers(route); 
      setActiveTab('route');
    } catch (e) {
      console.error("Auto Tour Generation Error:", e);
    } finally { 
      setIsGenerating(false); 
    }
  };

  const toggleTab = (tab: any) => { setActiveTab(tab); setIsAiMenuOpen(false); setIsPlacementMode(false); setSelectedPoi(null); };

  const handleNextPoi = () => {
    if (!currentRoute || !selectedPoi) return;
    const idx = currentRoute.pois.findIndex(p => p.id === selectedPoi.id);
    if (idx < currentRoute.pois.length - 1) setSelectedPoi(currentRoute.pois[idx + 1]);
  };

  const handlePrevPoi = () => {
    if (!currentRoute || !selectedPoi) return;
    const idx = currentRoute.pois.findIndex(p => p.id === selectedPoi.id);
    if (idx > 0) setSelectedPoi(currentRoute.pois[idx - 1]);
  };

  const handleVerifyInvite = (code: string) => {
    if (code.toUpperCase() === 'URBAN30' || code.toUpperCase() === 'URBANITO') {
      localStorage.setItem('urban_full_access', 'true');
      setHasFullAccess(true);
      return true;
    }
    return false;
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-white overflow-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      <main className="flex-1 relative h-full">
        <div ref={mapRef} className="w-full h-full" />

        {/* Global Route Loading Status */}
        {isGenerating && (
          <div className="absolute top-24 inset-x-6 z-[2000] pointer-events-none flex justify-center animate-in fade-in slide-in-from-top duration-500">
             <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 shadow-2xl flex items-center gap-3 border border-white/10" style={{ borderRadius: '99px' }}>
                <Loader2 size={18} className="animate-spin text-indigo-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isHe ? 'יוצר מסלול...' : 'Generating Tour...'}</span>
                  <span className="text-[8px] text-slate-400 font-medium">{isHe ? 'הבינה המלאכותית מחברת את הנקודות' : 'AI is connecting the dots'}</span>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'navigation' && !selectedPoi && !isAiMenuOpen && !isPlacementMode && (
          <div className="absolute top-6 inset-x-6 z-[1500] pointer-events-none animate-in slide-in-from-top duration-500">
            <form onSubmit={handleSearch} className="glass-card w-full max-w-md mx-auto p-1.5 shadow-2xl flex items-center gap-2 pointer-events-auto border-white/50">
               <div className="flex-1 flex items-center gap-3 px-3">
                 <Search size={18} className="text-slate-400" />
                 <input 
                   type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder={isHe ? 'חפשו עיר או כתובת...' : 'Search city or address...'}
                   className="w-full bg-transparent outline-none text-slate-900 text-sm font-medium placeholder:text-slate-400"
                 />
               </div>
               <button 
                 type="submit" disabled={isSearching}
                 className="bg-indigo-600 text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2"
               >
                 {isSearching ? <Loader2 size={14} className="animate-spin" /> : isHe ? 'חפש' : 'Search'}
               </button>
            </form>
          </div>
        )}

        {/* My Location Button - Positioned relative to the Fixed Navigation Menu Bar */}
        {activeTab === 'navigation' && !selectedPoi && !isAiMenuOpen && !isPlacementMode && (
          <button 
            onClick={handleMyLocation}
            className="absolute z-[1500] w-12 h-12 glass-card shadow-2xl flex items-center justify-center text-slate-900 active:scale-90 transition-all border-white/50"
            style={{ 
              bottom: 'calc(6rem + env(safe-area-inset-bottom))', 
              left: '1.5rem',
              borderRadius: '12px !important'
            }}
          >
            <LocateFixed size={24} />
          </button>
        )}

        {activeTab === 'navigation' && (scannedPois.length > 0 || basketPois.length > 0) && (
          <div className="absolute inset-x-0 bottom-40 z-[1000] pointer-events-none px-6 flex flex-col gap-4 items-center">
             {basketPois.length > 0 && (
               <button onClick={handleGenerateFromBasket} className="bg-slate-900 text-white px-6 py-4 shadow-2xl animate-in slide-in-from-bottom pointer-events-auto border border-white/20 flex items-center gap-3 active:scale-95 transition-all" style={{borderRadius: '5px'}}>
                  <div className="bg-emerald-500 w-8 h-8 flex items-center justify-center text-[11px] font-black">{basketPois.length}</div>
                  <span className="text-[11px] font-black uppercase tracking-widest">{isHe ? 'צור מסלול מהפנינים שבחרת' : 'Build Route from Selections'}</span>
                  <Wand2 size={16} />
               </button>
             )}
             {scannedPois.length > 0 && (
               <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 pointer-events-auto w-full">
                  {scannedPois.map(poi => (
                    <div key={poi.id} className="min-w-[160px] bg-white/95 backdrop-blur-md border border-white/40 shadow-xl p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in">
                       <div className="h-20 bg-slate-100 overflow-hidden relative" style={{borderRadius: '5px'}}>
                          <GoogleImage query={`${poi.name}, ${currentRoute?.city || viewingCity || 'City'}`} className="w-full h-full" />
                          <button onClick={() => { setBasketPois([...basketPois, poi]); setScannedPois(scannedPois.filter(p => p.id !== poi.id)); }} className="absolute top-1 right-1 w-8 h-8 bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-90"><Plus size={16} /></button>
                       </div>
                       <div className="px-1">
                          <h4 className="text-[10px] font-black text-slate-900 truncate leading-tight">{poi.name}</h4>
                          <button onClick={() => setSelectedPoi(poi)} className="text-[8px] text-indigo-500 font-bold uppercase tracking-widest mt-1">{isHe ? 'פרטים' : 'Details'}</button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {isPlacementMode && (
          <div className="absolute inset-x-0 bottom-24 z-[2000] flex justify-center px-6 pb-[env(safe-area-inset-bottom)]">
             <div className="glass-card w-full max-w-md p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center gap-5 animate-in slide-in-from-bottom duration-500 border-white/50">
                <div className="flex flex-col items-center gap-1.5">
                   <span className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em]">{isHe ? 'מצב בחירת רחוב' : 'Street Selection Mode'}</span>
                   <p className="text-[13px] font-bold text-slate-900 text-center">{isHe ? 'מקם את הכוונת על הרחוב המבוקש' : 'Center the crosshair on the target street'}</p>
                </div>
                <div className="flex gap-3 w-full">
                   <button onClick={() => setIsPlacementMode(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all">{isHe ? 'ביטול' : 'Cancel'}</button>
                   <button onClick={handleConfirmStreetWalk} className="flex-[1.5] py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"><CheckCircle size={16} /> {isHe ? 'אישור והמשך' : 'Confirm & Build'}</button>
                </div>
             </div>
          </div>
        )}

        {isPlacementMode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
             <div className="w-12 h-12 border-2 border-indigo-600 flex items-center justify-center animate-pulse"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full-force"/></div>
          </div>
        )}

        {selectedPoi && (
          <UnifiedPoiCard 
            poi={selectedPoi} route={currentRoute || { city: viewingCity || "Local" } as Route} currentIndex={currentRoute ? currentRoute.pois.findIndex(p => p.id === selectedPoi.id) : -1} totalCount={currentRoute?.pois.length || 0} preferences={preferences}
            onClose={() => setSelectedPoi(null)} onNext={handleNextPoi} onPrev={handlePrevPoi} onRemove={handleRemovePoiFromRoute}
            onToggleSave={() => handleToggleSavePoi(selectedPoi)} isSaved={savedPois.some(sp => sp.poi_name === selectedPoi.name)}
            onAddPoi={(p) => setBasketPois([...basketPois, p])} onEnrichPoi={(id, data) => { if(currentRoute) setCurrentRoute({...currentRoute, pois: currentRoute.pois.map(p => p.id === id ? {...p, ...data, isFullyLoaded:true} : p)}); }}
            onAddToRoute={() => {}} onSaveRoute={() => {}} setAudioState={() => {}} setIsAudioExpanded={() => {}} audioState={{isPlaying:false, currentPoiId:null, currentChapterIndex:0, playbackRate:1, chapters:[]}} onGoToPoi={() => {}}
            isScanned={scannedPois.some(p => p.id === selectedPoi.id)}
          />
        )}

        {activeTab === 'route' && currentRoute && !selectedPoi && (
          <RouteOverview 
            route={currentRoute} onPoiClick={setSelectedPoi} onRemovePoi={handleRemovePoiFromRoute} onAddPoi={handleAddPoiToRoute} preferences={preferences} onUpdatePreferences={setPreferences} onRequestRefine={() => setIsAiMenuOpen(true)} user={user} 
            isSaved={savedRoutes.some(sr => sr.route_data.id === currentRoute.id)} onClose={() => setActiveTab('navigation')} onSave={handleSaveRoute}
            onOffline={handleSaveOffline} onRemoveOffline={handleRemoveOffline} isOfflineLoading={isOfflineLoading} offlineProgress={offlineProgress}
            isOfflineSaved={offlineRouteIds.includes(currentRoute.id)}
          />
        )}
      </main>

      {!isPlacementMode && !selectedPoi && (
        <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[2500] bg-white/95 backdrop-blur-md border border-white/40 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-1.5 flex gap-1.5 items-center w-[calc(100vw-3rem)] max-w-[340px]">
          <button onClick={() => toggleTab('navigation')} className={`flex-1 py-3 flex justify-center ${activeTab === 'navigation' && !isAiMenuOpen ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><Compass size={22}/></button>
          <button onClick={() => toggleTab('library')} className={`flex-1 py-3 flex justify-center ${activeTab === 'library' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><LibraryIcon size={22}/></button>
          <button onClick={() => { setIsAiMenuOpen(!isAiMenuOpen); setIsPlacementMode(false); }} className={`w-14 h-14 ${isAiMenuOpen ? 'bg-slate-900' : 'bg-indigo-600'} text-white shadow-lg flex items-center justify-center active:scale-90 transition-all rounded-full-force`}>
            {isAiMenuOpen ? <X size={28} /> : (isGenerating || isSearching) ? <Loader2 size={28} className="animate-spin" /> : <Plus size={32} />}
          </button>
          <button onClick={() => { if(currentRoute) toggleTab('route'); else setIsAiMenuOpen(true); }} className={`flex-1 py-3 flex justify-center ${activeTab === 'route' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><RouteIcon size={22}/></button>
          <button onClick={() => toggleTab('profile')} className={`flex-1 py-3 flex justify-center ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><UserIcon size={22}/></button>
        </div>
      )}

      {isAiMenuOpen && (
        <div className="absolute inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end" onClick={() => setIsAiMenuOpen(false)}>
           <div 
             className="bg-white p-6 space-y-6 shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto no-scrollbar" 
             style={{ 
               borderRadius: '2rem 2rem 0 0',
               paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))'
             }} 
             onClick={e => e.stopPropagation()}
           >
              <div className="grid grid-cols-3 gap-3">
                 <button onClick={() => { setIsPlacementMode(true); setIsAiMenuOpen(false); }} className="p-4 bg-slate-50 flex flex-col items-center gap-2 border border-slate-100"><Footprints size={24} className="text-indigo-600" /><span className="text-[10px] font-black">{isHe ? 'רחוב' : 'Street'}</span></button>
                 <button onClick={handleScanGems} className="p-4 bg-slate-50 flex flex-col items-center gap-2 border border-slate-100"><MapPin size={24} className="text-emerald-500" /><span className="text-[10px] font-black">{isHe ? 'פנינים' : 'Gems'}</span></button>
                 <button onClick={handleAutoTour} className="p-4 bg-slate-50 flex flex-col items-center gap-2 border border-slate-100"><MapPinned size={24} className="text-slate-900" /><span className="text-[10px] font-black">{isHe ? 'מסלול כאן' : 'Route Here'}</span></button>
              </div>
              <QuickRouteSetup 
                preferences={preferences} 
                onUpdatePreferences={setPreferences} 
                onGenerate={handleAutoTour} 
                onCancel={() => setIsAiMenuOpen(false)} 
                isEmbedded={true} 
              />
           </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="absolute inset-0 bg-white z-[1500] p-6 overflow-y-auto pb-32 animate-in slide-in-from-bottom">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 {viewingCity && (
                   <button onClick={() => setViewingCity(null)} className="p-2 bg-slate-100 rounded-full">{isHe ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}</button>
                 )}
                 <h2 className="text-2xl font-bold">{viewingCity || (isHe ? 'ספריה' : 'Library')}</h2>
              </div>
              <button onClick={() => toggleTab('navigation')} className="p-2 bg-slate-100"><X size={20}/></button>
           </div>
           
           {!viewingCity ? (
             <>
               <section className="mb-10">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">{isHe ? 'ערים מובילות' : 'Top Cities'}</h3>
                  <div className="flex overflow-x-auto gap-3 no-scrollbar">
                    {POPULAR_CITIES.map(city => (
                      <div key={city.nameEn} onClick={() => handleCitySelect(city)} className="w-28 shrink-0 guide-book cursor-pointer">
                        <div className="aspect-[3/4] overflow-hidden relative border-l-2 border-slate-900" style={{borderRadius: '5px'}}>
                          <img src={city.img} className="w-full h-full object-cover grayscale-[0.2]" alt={city.name} />
                          <span className="absolute bottom-2 inset-x-0 text-center text-white text-[10px] font-bold">{city.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
               </section>

               <section className="mb-10">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">{isHe ? 'מסלולים אחרונים בעולם' : 'Global Trending Tours'}</h3>
                  <div className="grid grid-cols-1 gap-3">
                     {recentGlobalRoutes.length === 0 ? (
                       <div className="text-center py-10 text-slate-300 text-[10px] uppercase font-bold tracking-widest">{isHe ? 'טוען מסלולים...' : 'Loading global tours...'}</div>
                     ) : recentGlobalRoutes.map(route => (
                       <button key={route.id} onClick={() => { setCurrentRoute(route); renderRouteMarkers(route); toggleTab('route'); }} className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-3 hover:border-indigo-100 transition-all text-right" style={{borderRadius: '5px'}}>
                          <div className="w-14 h-14 bg-white overflow-hidden shrink-0" style={{borderRadius: '5px'}}>
                             <GoogleImage query={`${route.city} landmark`} className="w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between">
                                <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest block mb-0.5">{route.city}</span>
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${route.style === 'street' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {isHe ? (route.style === 'street' ? 'רחוב' : 'סביבה') : (route.style === 'street' ? 'Street' : 'Area')}
                                </span>
                             </div>
                             <h4 className="text-[12px] font-bold text-slate-900 truncate">{route.name}</h4>
                          </div>
                       </button>
                     ))}
                  </div>
               </section>
             </>
           ) : (
             <section className="animate-in fade-in slide-in-from-bottom duration-500">
                <div className="mb-6 space-y-2">
                   <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <BookOpen size={14} /> {isHe ? 'מסלולים מוצעים וקהילה' : 'Curated & Community Hub'}
                   </h3>
                   <p className="text-xs text-slate-400 font-light">{isHe ? `מגוון סיורי עומק ב${viewingCity}` : `Explore tours in ${viewingCity}`}</p>
                </div>
                {isLoadingCityRoutes ? (
                   <div className="flex flex-col items-center py-20 gap-4">
                      <Loader2 size={32} className="animate-spin text-indigo-200" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{isHe ? 'דולה מסלולים מהארכיון...' : 'Fetching city routes...'}</span>
                   </div>
                ) : citySpecificRoutes.length === 0 ? (
                   <div className="text-center py-20 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400">{isHe ? 'לא נמצאו מסלולים קיימים לעיר זו' : 'No routes found for this city'}</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 gap-3">
                      {citySpecificRoutes.map(route => (
                        <button key={route.id} onClick={() => { setCurrentRoute(route); renderRouteMarkers(route); toggleTab('route'); }} className="flex items-center gap-4 bg-white border border-slate-100 p-4 shadow-sm hover:border-indigo-200 transition-all text-right group" style={{borderRadius: '12px'}}>
                           <div className="w-16 h-16 bg-slate-50 overflow-hidden shrink-0" style={{borderRadius: '8px'}}>
                              <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full grayscale-[0.3] group-hover:grayscale-0" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block">{route.city}</span>
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${route.style === 'street' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {isHe ? (route.style === 'street' ? 'רחוב' : 'סביבה') : (route.style === 'street' ? 'Street' : 'Area')}
                                </span>
                              </div>
                              <h4 className="text-[14px] font-black text-slate-900 leading-tight">{route.name}</h4>
                              <p className="text-[10px] text-slate-400 mt-1 truncate">{route.description}</p>
                           </div>
                        </button>
                      ))}
                   </div>
                )}
             </section>
           )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="absolute inset-0 bg-white z-[1500] p-6 overflow-y-auto pb-32 animate-in slide-in-from-bottom no-scrollbar">
           <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold">{isHe ? 'פרופיל' : 'Profile'}</h2><button onClick={() => toggleTab('navigation')} className="p-2 bg-slate-100"><X size={20}/></button></div>
           <PreferencesPanel 
             preferences={preferences} setPreferences={setPreferences} savedRoutes={savedRoutes} savedPois={savedPois} 
             user={user} onLogin={signInWithGoogle} onLogout={signOut} 
             onLoadRoute={(c, r) => { setCurrentRoute(r); renderRouteMarkers(r); toggleTab('route'); }} 
             onDeleteRoute={id => deleteRouteFromSupabase(id, user.id)} onDeletePoi={id => deletePoiFromSupabase(id, user.id)} 
             onOpenFeedback={() => {}} onOpenGuide={() => {}} uniqueUserCount={0} remainingGens={hasFullAccess ? 999 : 3} 
             offlineRouteIds={offlineRouteIds} onLoadOfflineRoute={() => {}} onRemoveOffline={handleRemoveOffline} 
             onVerifyInvite={handleVerifyInvite} hasFullAccess={hasFullAccess}
           />
        </div>
      )}
    </div>
  );
};

export default App;
