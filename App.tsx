
import React, { useState, useEffect, useRef } from 'react';
import { Compass, Loader2, Route as RouteIcon, Library as LibraryIcon, User as UserIcon, X, Navigation, MapPin, Footprints, Plus, Heart, Target as TargetIcon, Trash2, Wand2, CheckCircle, MapPinned, Search, LocateFixed, Sparkles, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight, BookOpen, Key, Eye, Check, AlertCircle, Crosshair, Bookmark, Globe, Settings2, Sliders, ChevronDown, ChevronUp, History } from 'lucide-react';
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
  signInWithGoogle, 
  signOut, 
  getSavedPoisFromSupabase,
  deletePoiFromSupabase,
  getRecentCuratedRoutes,
  getRoutesByCityHub,
  normalize,
  updateSavedRouteData,
  generateStableId,
  getCachedPoiDetails,
  getUserPreferences,
  saveUserPreferences
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

const extractStreetName = (results: any[]) => {
  const route = results.find(r => r.types.includes('route'));
  if (route) return route.address_components.find((c: any) => c.types.includes('route'))?.long_name;
  const premise = results.find(r => r.types.includes('premise') || r.types.includes('point_of_interest'));
  if (premise) return premise.address_components.find((c: any) => c.types.includes('route'))?.long_name || premise.formatted_address.split(',')[0];
  return results[0]?.formatted_address.split(',')[0];
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(undefined); 
  const [preferences, setPreferences] = useState<UserPreferences>({ 
    hiddenGemsLevel: 30, interests: ['היסטוריה'], walkingDistance: 3, desiredPoiCount: 5, language: 'he', explanationStyle: 'standard'
  });
  const [activeTab, setActiveTab] = useState<'navigation' | 'profile' | 'route' | 'library'>('navigation');
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [isPoiExpanded, setIsPoiExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); 
  const [isSearching, setIsSearching] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [savedPois, setSavedPois] = useState<any[]>([]);
  const [recentGlobalRoutes, setRecentGlobalRoutes] = useState<Route[]>([]);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isStreetSelectionMode, setIsStreetSelectionMode] = useState(false);
  const [streetSearchQuery, setStreetSearchQuery] = useState('');
  const [isGeocodingStreet, setIsGeocodingStreet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCity, setViewingCity] = useState<string | null>(null);
  const [citySpecificRoutes, setCitySpecificRoutes] = useState<Route[]>([]);
  const [isLoadingCityRoutes, setIsLoadingCityRoutes] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isPrefsExpanded, setIsPrefsExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const userMarker = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);
  const mapListenerRef = useRef<any>(null);

  const isHe = preferences.language === 'he';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const clearMarkers = () => { markers.current.forEach(m => m && m.setMap(null)); markers.current = []; };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        refreshSavedContent(u.id);
        const prefs = await getUserPreferences(u.id);
        if (prefs) setPreferences(prefs);
      }
    });
    supabase.auth.onAuthStateChange(async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          refreshSavedContent(u.id);
          const prefs = await getUserPreferences(u.id);
          if (prefs) setPreferences(prefs);
        } else {
          setSavedRoutes([]);
          setSavedPois([]);
        }
    });
    loadGlobalContent();
  }, []);

  const loadGlobalContent = async () => {
    const global = await getRecentCuratedRoutes(32);
    setRecentGlobalRoutes(global);
  };

  useEffect(() => {
    if (activeTab === 'library') {
      loadGlobalContent();
    }
  }, [activeTab]);

  const refreshSavedContent = async (userId: string) => {
      const routes = await getSavedRoutesFromSupabase(userId);
      const pois = await getSavedPoisFromSupabase(userId);
      setSavedRoutes(routes);
      setSavedPois(pois);
  };

  useEffect(() => {
    if (mapRef.current && !googleMap.current) {
      googleMap.current = new google.maps.Map(mapRef.current, {
        center: { lat: 48.8566, lng: 2.3522 }, zoom: 14, gestureHandling: 'greedy', disableDefaultUI: true,
        styles: [{ "featureType": "poi", "stylers": [{ "visibility": "off" }] }, { "featureType": "transit", "stylers": [{ "visibility": "off" }] }, { "featureType": "road", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }]
      });
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: googleMap.current, suppressMarkers: true, preserveViewport: true,
        polylineOptions: { strokeColor: '#4f46e5', strokeWeight: 5, strokeOpacity: 0.8 }
      });

      if (navigator.geolocation) {
        navigator.geolocation.watchPosition((pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (!userMarker.current) {
            userMarker.current = new google.maps.Marker({
              position: loc, map: googleMap.current,
              icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
              zIndex: 9999
            });
          } else { userMarker.current.setPosition(loc); }
        }, (err) => console.warn("Location error:", err), { enableHighAccuracy: true });
      }
    }
  }, []);

  useEffect(() => {
    if (!googleMap.current) return;
    if (isStreetSelectionMode) {
      const geocodeCurrentCenter = async () => {
        setIsGeocodingStreet(true);
        const center = googleMap.current.getCenter();
        const geocoder = new google.maps.Geocoder();
        try {
          const res = await geocoder.geocode({ location: center, language: isHe ? 'he' : 'en' });
          if (res.results && res.results.length > 0) {
            const street = extractStreetName(res.results);
            if (street) setStreetSearchQuery(street);
          }
        } catch (e) { console.warn("Geocoding failed:", e); } finally { setIsGeocodingStreet(false); }
      };
      mapListenerRef.current = googleMap.current.addListener('idle', geocodeCurrentCenter);
      geocodeCurrentCenter();
    } else {
      if (mapListenerRef.current) { google.maps.event.removeListener(mapListenerRef.current); mapListenerRef.current = null; }
    }
    return () => { if (mapListenerRef.current) google.maps.event.removeListener(mapListenerRef.current); };
  }, [isStreetSelectionMode, isHe]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ address: searchQuery, language: isHe ? 'he' : 'en' });
      if (res.results[0]) {
        const loc = res.results[0].geometry.location;
        googleMap.current.panTo(loc);
        googleMap.current.setZoom(15);
      }
    } catch (e) { showToast(isHe ? 'לא מצאנו את המקום' : 'Location not found', 'error'); } finally { setIsSearching(false); }
  };

  const handleActionCreateRoute = async (type: 'area' | 'street' | 'gems') => {
    if (type === 'street') { setIsAiMenuOpen(false); setIsStreetSelectionMode(true); return; }
    setIsAiMenuOpen(false);
    setIsGenerating(true);
    try {
      const center = googleMap.current.getCenter();
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ location: center });
      const cityName = extractStandardCity(res.results) || "Unknown City";
      
      let route: Route | null = null;
      if (type === 'area') {
        route = await generateWalkingRoute(cityName, { lat: center.lat(), lng: center.lng() }, preferences, undefined, user?.id);
      } else if (type === 'gems') {
        const gems = await suggestNearbyGems({ city: cityName, lat: center.lat(), lng: center.lng() }, preferences.language);
        renderScanMarkers(gems);
        setIsGenerating(false);
        return;
      }
      if (route) { setCurrentRoute(route); renderRouteMarkers(route); setActiveTab('route'); }
    } catch (e: any) { 
      console.error("Route gen error:", e);
      showToast(isHe ? 'שגיאה ביצירת המסלול. בדוק את חיבור ה-API.' : 'Error generating route. Check API connection.', 'error'); 
    } finally { setIsGenerating(false); }
  };

  const confirmStreetWalk = async () => {
    if (!streetSearchQuery.trim()) return;
    setIsStreetSelectionMode(false);
    setIsGenerating(true);
    try {
      const center = googleMap.current.getCenter();
      const route = await generateStreetWalkRoute(streetSearchQuery, { lat: center.lat(), lng: center.lng() }, preferences, user?.id);
      if (route) { setCurrentRoute(route); renderRouteMarkers(route); setActiveTab('route'); }
    } catch (e) { showToast(isHe ? 'לא הצלחנו לייצר סיפור לרחוב הזה' : 'Failed to generate street story', 'error'); } finally { setIsGenerating(false); }
  };

  const renderScanMarkers = (pois: POI[]) => {
    clearMarkers();
    const bounds = new google.maps.LatLngBounds();
    pois.forEach((p) => {
      const marker = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng }, map: googleMap.current, zIndex: 200,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#6366f1', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 }
      });
      marker.addListener('click', () => setSelectedPoi(p));
      markers.current.push(marker);
      bounds.extend(marker.getPosition());
    });
    if (pois.length > 0) googleMap.current.fitBounds(bounds);
    directionsRenderer.current.setDirections(null);
  };

  const handleUpdatePreferences = (p: UserPreferences) => {
    setPreferences(p);
    if (user) saveUserPreferences(user.id, p);
  };

  const renderRouteMarkers = (route: Route, activeId?: string) => {
    clearMarkers();
    const bounds = new google.maps.LatLngBounds();
    route.pois.forEach((p, i) => {
      const isActive = p.id === activeId;
      const marker = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng }, map: googleMap.current, zIndex: isActive ? 5000 : 100,
        label: { text: (i + 1).toString(), color: 'white', fontSize: isActive ? '14px' : '10px', fontWeight: isActive ? '900' : '400' },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: isActive ? 24 : 14, fillColor: isActive ? '#f43f5e' : '#4f46e5', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: isActive ? 4 : 2 }
      });
      marker.addListener('click', () => setSelectedPoi(p));
      markers.current.push(marker);
      bounds.extend(marker.getPosition());
    });
    if (!activeId && route.pois.length > 0) googleMap.current.fitBounds(bounds);
    calculatePath(route.pois);
  };

  const calculatePath = (pois: POI[]) => {
    if (pois.length < 2) { directionsRenderer.current.setDirections(null); return; }
    new google.maps.DirectionsService().route({
      origin: { lat: pois[0].lat, lng: pois[0].lng }, destination: { lat: pois[pois.length - 1].lat, lng: pois[pois.length - 1].lng },
      waypoints: pois.slice(1, -1).map(p => ({ location: { lat: p.lat, lng: p.lng }, stopover: true })), travelMode: google.maps.TravelMode.WALKING
    }, (res: any, status: string) => { if (status === 'OK') directionsRenderer.current.setDirections(res); });
  };

  const toggleTab = (tab: any) => { setActiveTab(tab); setIsAiMenuOpen(false); setSelectedPoi(null); setIsStreetSelectionMode(false); setIsPrefsExpanded(false); };

  const handleLoadSavedRoute = async (cityName: string, route: Route) => {
    setIsSearching(true);
    try {
      const enrichedPois = await Promise.all(route.pois.map(async (p) => {
        if (p.isFullyLoaded) return p;
        const cached = await getCachedPoiDetails(p.name, route.city, p.lat, p.lng);
        if (cached) return { ...p, ...cached, isFullyLoaded: true };
        return p;
      }));
      const enrichedRoute = { ...route, pois: enrichedPois };
      setCurrentRoute(enrichedRoute); renderRouteMarkers(enrichedRoute); setActiveTab('route'); setIsAiMenuOpen(false);
    } catch (e) {} finally { setIsSearching(false); }
  };

  const handleCitySelect = async (city: any) => {
    setIsSearching(true); setViewingCity(city.name); setIsLoadingCityRoutes(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ address: city.nameEn, language: 'en' });
      if (res.results[0]) { googleMap.current.panTo(res.results[0].geometry.location); googleMap.current.setZoom(14); }
      const routes = await getRoutesByCityHub(city.name, city.nameEn);
      setCitySpecificRoutes(routes);
    } catch (e) {} finally { setIsSearching(false); setIsLoadingCityRoutes(false); }
  };

  const centerOnUser = () => {
    if (navigator.geolocation && googleMap.current) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        googleMap.current.panTo(loc);
        googleMap.current.setZoom(16);
        if (!userMarker.current) {
          userMarker.current = new google.maps.Marker({
            position: loc, map: googleMap.current,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
            zIndex: 9999
          });
        } else {
          userMarker.current.setPosition(loc);
        }
        setIsLocating(false);
      }, (err) => {
        console.warn("Location error:", err);
        showToast(isHe ? 'לא ניתן לזהות מיקום. בדוק את הגדרות הפרטיות.' : 'Cannot detect location. Check privacy settings.', 'error');
        setIsLocating(false);
      }, { enableHighAccuracy: true, timeout: 8000 });
    }
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-white overflow-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      <main className="flex-1 relative h-full">
        <div ref={mapRef} className="w-full h-full" />
        
        {isStreetSelectionMode && (
          <div className="absolute inset-0 z-[1000] pointer-events-none flex items-center justify-center">
             <div className="relative">
                <div className="w-16 h-16 border-[1px] border-indigo-500/30 rounded-full-force flex items-center justify-center animate-pulse">
                   <div className="w-10 h-10 border-2 border-indigo-600 rounded-full-force flex items-center justify-center bg-indigo-600/10 backdrop-blur-[2px] shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full-force shadow-md" />
                   </div>
                </div>
             </div>
          </div>
        )}

        {toast && (
          <div className={`fixed top-28 left-1/2 -translate-x-1/2 z-[5000] px-6 py-3 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`} style={{ borderRadius: '5px' }}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} className="text-emerald-400" />}
            <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        )}

        {activeTab === 'navigation' && !selectedPoi && !isAiMenuOpen && !isStreetSelectionMode && (
          <>
            <div className="absolute top-[max(1.5rem,env(safe-area-inset-top,1.5rem))] inset-x-6 z-[2000] flex flex-col items-center gap-3">
               <form onSubmit={handleSearchSubmit} className="w-full bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex items-center border border-slate-100 overflow-hidden" style={{ borderRadius: '5px' }}>
                  <div className="w-14 h-14 flex items-center justify-center text-slate-400 shrink-0"><Search size={22} strokeWidth={1.5} /></div>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isHe ? 'לאן מטיילים היום?' : 'Where to next?'} className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium py-4 text-slate-900" />
               </form>
            </div>
            {/* My Location Button */}
            <button 
              onClick={centerOnUser}
              className={`absolute bottom-32 right-6 z-[2000] w-12 h-12 bg-white shadow-2xl flex items-center justify-center text-slate-600 hover:text-indigo-600 active:scale-90 transition-all border border-slate-50 cursor-pointer pointer-events-auto ${isLocating ? 'animate-pulse' : ''}`}
              style={{ borderRadius: '50%' }}
              aria-label={isHe ? 'המיקום שלי' : 'My Location'}
            >
              {isLocating ? <Loader2 size={24} className="animate-spin text-indigo-500" /> : <LocateFixed size={24} />}
            </button>
          </>
        )}

        {isStreetSelectionMode && (
          <div className="absolute bottom-[110px] inset-x-6 z-[4500] animate-in slide-in-from-bottom-10 duration-500">
             <div className="bg-white/95 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,0.3)] border border-slate-100 p-5 flex flex-col gap-4" style={{ borderRadius: '12px' }}>
                <div className="flex justify-between items-center">
                   <div className="flex flex-col gap-0.5">
                      <h3 className="text-[12px] font-black uppercase tracking-[0.1em] text-indigo-600 flex items-center gap-2"><Footprints size={16}/> {isHe ? 'סמן רחוב על המפה' : 'Select Street on Map'}</h3>
                   </div>
                   <button onClick={() => setIsStreetSelectionMode(false)} className="p-2 bg-slate-100/50 text-slate-500 rounded-full"><X size={18}/></button>
                </div>
                <div className="flex flex-col gap-3">
                   <div className="relative group">
                      <div className={`absolute inset-y-0 ${isHe ? 'right-4' : 'left-4'} flex items-center text-slate-300`}>
                        {isGeocodingStreet ? <Loader2 size={18} className="animate-spin text-indigo-400" /> : <MapPin size={18} />}
                      </div>
                      <input type="text" readOnly value={streetSearchQuery} placeholder={isHe ? 'מזהה רחוב...' : 'Identifying street...'} className={`w-full bg-slate-50 border border-slate-200 ${isHe ? 'pr-12' : 'pl-12'} py-4 text-sm font-bold outline-none text-slate-900`} style={{ borderRadius: '8px' }} />
                   </div>
                   <button onClick={confirmStreetWalk} disabled={!streetSearchQuery.trim()} className={`w-full h-14 bg-slate-900 text-white font-black text-[13px] uppercase tracking-[0.1em] active:scale-95 transition-all shadow-xl hover:bg-slate-800 flex items-center justify-center gap-3 disabled:opacity-50`} style={{ borderRadius: '8px' }}>
                     {isHe ? 'צור סיפור לרחוב הזה' : 'Create Street Story'}
                   </button>
                </div>
             </div>
          </div>
        )}

        {isAiMenuOpen && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md z-[2500] flex flex-col items-center justify-end pb-32 px-6 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
             <div className="w-full max-w-[400px] space-y-4 mb-20">
                <button onClick={() => handleActionCreateRoute('area')} className="w-full bg-white border border-slate-100 p-5 flex items-center gap-4 shadow-2xl active:scale-95 transition-all animate-stagger-1" style={{ borderRadius: '12px' }}>
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg"><Navigation size={24}/></div>
                   <div className="text-right flex-1"><h4 className="text-sm font-black text-slate-900">{isHe ? 'מסלול חכם באיזור' : 'Smart Area Tour'}</h4><p className="text-[10px] text-slate-500">{isHe ? 'סיור עומק באתרים המרכזיים' : 'Deep dive into main sites'}</p></div>
                </button>
                <button onClick={() => handleActionCreateRoute('street')} className="w-full bg-white border border-slate-100 p-5 flex items-center gap-4 shadow-2xl active:scale-95 transition-all animate-stagger-2" style={{ borderRadius: '12px' }}>
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg"><Footprints size={24}/></div>
                   <div className="text-right flex-1"><h4 className="text-sm font-black text-slate-900">{isHe ? 'סיפור של רחוב' : 'Street Story'}</h4><p className="text-[10px] text-slate-500">{isHe ? 'הליכה עמוקה ברחוב אחד' : 'Single street exploration'}</p></div>
                </button>
                <button onClick={() => handleActionCreateRoute('gems')} className="w-full bg-white border border-slate-100 p-5 flex items-center gap-4 shadow-2xl active:scale-95 transition-all animate-stagger-3" style={{ borderRadius: '12px' }}>
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg"><Eye size={24}/></div>
                   <div className="text-right flex-1"><h4 className="text-sm font-black text-slate-900">{isHe ? 'סריקת אוצרות בסביבה' : 'Scan Nearby Gems'}</h4><p className="text-[10px] text-slate-500">{isHe ? 'למצוא את המקומות שאף אחד לא מכיר' : 'Discover hidden local spots'}</p></div>
                </button>

                <div className={`bg-white border border-slate-100 shadow-2xl animate-stagger-4 overflow-hidden transition-all duration-300 ${isPrefsExpanded ? 'pb-5' : 'pb-0'}`} style={{ borderRadius: '12px' }}>
                   <button 
                     onClick={() => setIsPrefsExpanded(!isPrefsExpanded)}
                     className="w-full p-5 flex items-center justify-between text-indigo-600 hover:bg-slate-50 transition-colors"
                   >
                      <div className="flex items-center gap-2">
                        <Sliders size={18} />
                        <h4 className="text-[11px] font-black uppercase tracking-widest">{isHe ? 'העדפות מסלול ליצירה הבאה' : 'Route Preferences'}</h4>
                      </div>
                      {isPrefsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                   </button>
                   
                   {isPrefsExpanded && (
                     <div className="px-5 pt-2 animate-in slide-in-from-top-2 duration-300">
                       <QuickRouteSetup 
                          preferences={preferences} 
                          onUpdatePreferences={handleUpdatePreferences} 
                          onGenerate={() => {}} 
                          onCancel={() => {}} 
                          isEmbedded={true}
                          hideActionButton={true}
                       />
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {selectedPoi && (
          <UnifiedPoiCard poi={selectedPoi} route={currentRoute || { city: viewingCity || "Local" } as Route} currentIndex={currentRoute ? currentRoute.pois.findIndex(p => p.id === selectedPoi.id) : -1} totalCount={currentRoute?.pois.length || 0} preferences={preferences} onClose={() => setSelectedPoi(null)} onNext={() => { const idx = currentRoute?.pois.findIndex(p => p.id === selectedPoi.id); if (idx !== undefined && idx < (currentRoute?.pois.length || 0) - 1) setSelectedPoi(currentRoute!.pois[idx + 1]); }} onPrev={() => { const idx = currentRoute?.pois.findIndex(p => p.id === selectedPoi.id); if (idx !== undefined && idx > 0) setSelectedPoi(currentRoute!.pois[idx - 1]); }} onUpdatePreferences={handleUpdatePreferences} isExpanded={isPoiExpanded} setIsExpanded={setIsPoiExpanded} />
        )}

        {activeTab === 'route' && currentRoute && !selectedPoi && (
          <RouteOverview route={currentRoute} onPoiClick={setSelectedPoi} onRemovePoi={() => {}} onAddPoi={() => {}} preferences={preferences} onUpdatePreferences={handleUpdatePreferences} onRequestRefine={() => {}} user={user} isSaved={savedRoutes.some(sr => sr.route_data.id === currentRoute.id)} onClose={() => setActiveTab('navigation')} isOfflineLoading={isGenerating} />
        )}
      </main>

      {!selectedPoi && (
        <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[4000] glass-card p-1.5 flex gap-1.5 items-center w-[calc(100vw-3rem)] max-w-[340px]">
          <button onClick={() => toggleTab('navigation')} className={`flex-1 py-3 flex justify-center rounded-full-force ${activeTab === 'navigation' && !isAiMenuOpen ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><Compass size={22}/></button>
          <button onClick={() => toggleTab('library')} className={`flex-1 py-3 flex justify-center rounded-full-force ${activeTab === 'library' && !isAiMenuOpen ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><LibraryIcon size={22}/></button>
          <button onClick={() => setIsAiMenuOpen(!isAiMenuOpen)} className={`w-14 h-14 ${isAiMenuOpen ? 'bg-slate-900' : 'bg-indigo-600'} text-white shadow-lg flex items-center justify-center active:scale-90 transition-all rounded-full-force`}>{isAiMenuOpen ? <X size={28} /> : <Plus size={32} />}</button>
          <div className="relative flex-1 flex justify-center group">
            <button onClick={() => { if(currentRoute) toggleTab('route'); else setIsAiMenuOpen(true); }} className={`w-full py-3 flex justify-center transition-all duration-700 rounded-full-force ${activeTab === 'route' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
              {isGenerating ? (
                <div className="relative flex items-center justify-center w-6 h-6">
                  <RouteIcon size={22} className="text-slate-400" />
                  <div className="absolute w-2.5 h-2.5 bg-white rounded-full-force animate-route-travel-s animate-dot-glow z-10" />
                </div>
              ) : (
                <RouteIcon size={22}/>
              )}
            </button>
          </div>
          <button onClick={() => toggleTab('profile')} className={`flex-1 py-3 flex justify-center rounded-full-force ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><UserIcon size={22}/></button>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl z-[3000] p-6 overflow-y-auto pb-32 animate-in slide-in-from-bottom no-scrollbar">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 {viewingCity && <button onClick={() => setViewingCity(null)} className="p-2 bg-white/50 backdrop-blur rounded-full shadow-sm">{isHe ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}</button>}
                 <h2 className="text-2xl font-black">{viewingCity || (isHe ? 'ספריה' : 'Library')}</h2>
              </div>
           </div>
           
           {!viewingCity ? (
             <div className="space-y-12">
                {/* My Collection Section */}
                {user && savedRoutes.length > 0 && (
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2"><Bookmark size={12} className="text-indigo-500" /> {isHe ? 'האוסף האישי שלי' : 'My Collection'}</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
                      {savedRoutes.map(row => (
                        <button key={row.id} onClick={() => handleLoadSavedRoute(row.route_data.city, row.route_data)} className="shrink-0 w-64 glass-card p-3 text-right hover:border-indigo-200 transition-all snap-start" style={{ borderRadius: '12px' }}>
                           <div className="aspect-video bg-white/30 backdrop-blur overflow-hidden mb-3 shadow-inner" style={{ borderRadius: '8px' }}><GoogleImage query={`${row.route_data.city} iconic tourism`} className="w-full h-full" /></div>
                           <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest block mb-0.5">{row.route_data.city}</span>
                           <h4 className="text-[12px] font-black text-slate-900 truncate">{row.route_data.name}</h4>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* City Guides Section */}
                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2"><BookOpen size={12} className="text-indigo-500" /> {isHe ? 'מדריכי ערים' : 'City Guides'}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {POPULAR_CITIES.map(city => (
                      <button key={city.nameEn} onClick={() => handleCitySelect(city)} className="group flex flex-col gap-2">
                        <div className="relative aspect-[4/5] overflow-hidden shadow-lg guide-book" style={{ borderRadius: '4px 10px 10px 4px' }}>
                          <img src={city.img} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2"><span className="text-white text-[9px] font-black uppercase tracking-widest w-full text-center leading-tight">{city.name}</span></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Recent Global Routes Section */}
                {recentGlobalRoutes.length > 0 && (
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2"><History size={12} className="text-indigo-500" /> {isHe ? 'מסלולים אחרונים שנוצרו' : 'Recently Created Routes'}</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {recentGlobalRoutes.map((route, idx) => (
                        <button key={route.id || idx} onClick={() => handleLoadSavedRoute(route.city, route)} className="w-full flex items-center gap-4 glass-card p-4 text-right hover:border-indigo-200 transition-all" style={{ borderRadius: '12px' }}>
                           <div className="w-20 h-20 bg-white shrink-0 shadow-inner overflow-hidden" style={{ borderRadius: '8px' }}>
                              <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{route.city}</span>
                              <h4 className="text-[14px] font-black text-slate-900 truncate">{route.name}</h4>
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{route.description}</p>
                           </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
             </div>
           ) : (
             <div className="space-y-4">
                <div className="bg-slate-900 text-white rounded-[20px] mb-6 overflow-hidden relative shadow-2xl h-32">
                   <GoogleImage query={`${viewingCity} iconic landmarks landscape`} className="absolute inset-0 opacity-80" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                   <div className="absolute bottom-6 inset-x-6 z-10">
                      <h3 className="text-3xl font-black tracking-tight">{isHe ? 'המדריך ל' : ''}{viewingCity}{!isHe ? ' Guide' : ''}</h3>
                      <p className="text-[9px] uppercase tracking-[0.2em] font-black text-white/70 mt-1">{isHe ? 'ארכיון מסלולים והמלצות' : 'Route archive & recommendations'}</p>
                   </div>
                </div>
                {citySpecificRoutes.length > 0 ? citySpecificRoutes.map(route => (
                  <button key={route.id || route.name} onClick={() => handleLoadSavedRoute(route.city, route)} className="w-full flex items-center gap-3 glass-card p-4 text-right hover:border-indigo-200 transition-all mb-3" style={{ borderRadius: '12px' }}>
                     <div className="w-16 h-16 bg-white shrink-0 shadow-inner overflow-hidden" style={{ borderRadius: '8px' }}><GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full" /></div>
                     <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest block mb-0.5">{route.city}</span>
                        <h4 className="text-[13px] font-black text-slate-900 truncate">{route.name}</h4>
                        <p className="text-[9px] text-slate-400 truncate mt-1 opacity-70">{route.description}</p>
                     </div>
                  </button>
                )) : (
                   <div className="p-20 text-center">
                      {isLoadingCityRoutes ? (
                         <><Loader2 size={32} className="animate-spin text-indigo-200 mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{isHe ? 'שואב מסלולים מהארכיון...' : 'Fetching archives...'}</p></>
                      ) : (
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{isHe ? 'אין עדיין מסלולים שמורים לעיר זו' : 'No routes saved for this city yet'}</p>
                      )}
                   </div>
                )}
             </div>
           )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl z-[3000] p-6 overflow-y-auto pb-32 animate-in slide-in-from-bottom no-scrollbar">
           <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black">{isHe ? 'פרופיל' : 'Profile'}</h2></div>
           <PreferencesPanel preferences={preferences} setPreferences={handleUpdatePreferences} savedRoutes={savedRoutes} savedPois={savedPois} user={user} onLogin={signInWithGoogle} onLogout={signOut} onLoadRoute={handleLoadSavedRoute} onDeleteRoute={id => { deleteRouteFromSupabase(id, user.id); refreshSavedContent(user.id); }} onDeletePoi={id => { deletePoiFromSupabase(id, user.id); refreshSavedContent(user.id); }} onOpenFeedback={() => {}} onOpenGuide={() => {}} uniqueUserCount={0} remainingGens={0} offlineRouteIds={[]} onLoadOfflineRoute={() => {}} />
        </div>
      )}
    </div>
  );
};
