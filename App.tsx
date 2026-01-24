import React, { useState, useEffect, useRef } from 'react';
import {
  Compass, Loader2, Route as RouteIcon, Library as LibraryIcon, User as UserIcon, X, Navigation, MapPin, ListTodo, Plus, Heart, Target as TargetIcon, Trash2, CheckCircle, MapPinned, Search, LocateFixed, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight, BookOpen, Key, Eye, Check, AlertCircle, Crosshair, Bookmark, Globe, Settings2, Sliders, ChevronDown, ChevronUp, History, Map as MapIcon, Timer, SearchCode, Maximize2, Layers, Signpost, ArrowDownCircle, Send
} from 'lucide-react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { UserPreferences, Route as RouteType, POI } from './types';


import { generateWalkingRoute, generateStreetWalkRoute, fetchExtendedPoiDetails } from './services/geminiService';
import { PreferencesPanel } from './components/PreferencesPanel';
import { UnifiedPoiCard } from './components/UnifiedPoiCard';
import { RouteOverview } from './components/RouteOverview';
import { QuickRouteSetup } from './components/QuickRouteSetup';
import { GoogleImage } from './components/GoogleImage';
import { RouteSkeleton } from './components/RouteSkeleton';
import { UserGuide } from './components/UserGuide';
import {
  supabase,
  getSavedRoutesFromSupabase,
  saveRouteToSupabase,
  updateSavedRouteData,
  deleteRouteFromSupabase,
  signInWithGoogle,
  signOut,
  getRecentCuratedRoutes,
  getRoutesByCityHub,
  getCachedPoiDetails,
  getUserPreferences,
  saveUserPreferences,
  normalize,
  logUsage,
  saveToCuratedRoutes,
  getAllRecentRoutes
} from './services/supabase';

declare var google: any;

const PARIS_COORDS = { lat: 48.8566, lng: 2.3522 };

const FALLBACK_CITIES = [
  { id: 'f1', name: 'ירושלים', name_en: 'Jerusalem', img_url: 'https://images.unsplash.com/photo-1542666281-9958e32c32ee?w=800&q=80' },
  { id: 'f2', name: 'חדרה', name_en: 'Hadera', img_url: 'https://images.unsplash.com/photo-1628151474248-18567675f928?w=800&q=80' },
  { id: 'f3', name: 'תל אביב', name_en: 'Tel Aviv', img_url: 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?w=800&q=80' },
  { id: 'f4', name: 'פריז', name_en: 'Paris', img_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80' },
  { id: 'f5', name: 'לונדון', name_en: 'London', img_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80' },
  { id: 'f6', name: 'ברצלונה', name_en: 'Barcelona', img_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80' }
];

const extractStandardCity = (results: any[]) => {
  if (!results || results.length === 0) return null;
  const locality = results.find(r => r.types.includes('locality') || r.types.includes('administrative_area_level_2') || r.types.includes('administrative_area_level_3'));
  if (locality) {
    const comp = locality.address_components.find((c: any) => c.types.includes('locality') || c.types.includes('political') || c.types.includes('administrative_area_level_1'));
    if (comp) return comp.long_name;
  }
  return results[0]?.address_components.find((c: any) => c.types.includes('locality') || c.types.includes('political'))?.long_name;
};

export const RouteTravelIcon = ({ className = "", animated = true }: { className?: string, animated?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 11.3137 20 8" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" className={animated ? "climbing-path" : ""} />
    <circle r="3" fill="#6366F1" className={animated ? "climbing-dot" : ""} />
  </svg>
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const locationPath = useLocation();

  const [user, setUser] = useState<any>(undefined);
  const [preferences, setPreferences] = useState<UserPreferences>({
    hiddenGemsLevel: 30, interests: ['היסטוריה'], walkingDistance: 3, desiredPoiCount: 5, language: 'he', explanationStyle: 'standard', religiousFriendly: true
  });

  const [openRoutes, setOpenRoutes] = useState<RouteType[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const [generatingRouteIds, setGeneratingRouteIds] = useState<Set<string>>(new Set());

  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [showGeneratingTooltip, setShowGeneratingTooltip] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCity, setViewingCity] = useState<string | null>(null);
  const [citySpecificRoutes, setCitySpecificRoutes] = useState<RouteType[]>([]);
  const [recentGlobalRoutes, setRecentGlobalRoutes] = useState<RouteType[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [popularCities, setPopularCities] = useState<any[]>(FALLBACK_CITIES);
  const [isLoadingCityRoutes, setIsLoadingCityRoutes] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const activeTab = locationPath.pathname.split('/')[1] || 'navigation';
  const setActiveTab = (tab: string) => navigate(tab === 'navigation' ? '/' : `/${tab}`);

  const [isLocating, setIsLocating] = useState(false);
  const [streetConfirmData, setStreetConfirmData] = useState<{ city: string, street: string, type: 'area' | 'street' } | null>(null);
  const [isConfirmPrefsExpanded, setIsConfirmPrefsExpanded] = useState(false);
  const [dynamicRadius, setDynamicRadius] = useState<number>(3);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [location, setLocation] = useState(PARIS_COORDS);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const previewMarkers = useRef<any[]>([]);
  const directionsRenderer = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectionCircle = useRef<any>(null);
  const geocodeTimeoutRef = useRef<number | null>(null);
  const streetConfirmDataRef = useRef(streetConfirmData);
  const isInitialized = useRef(false);

  useEffect(() => {
    streetConfirmDataRef.current = streetConfirmData;
  }, [streetConfirmData]);

  const isHe = preferences.language === 'he';
  const currentRoute = openRoutes[activeRouteIndex] || null;
  const isGeneratingActive = currentRoute ? generatingRouteIds.has(currentRoute.id) : false;

  const isCurrentRouteSaved = currentRoute && savedRoutes.some(r =>
    normalize(r.route_data.name) === normalize(currentRoute.name) &&
    normalize(r.route_data.city) === normalize(currentRoute.city)
  );

  const refreshSavedContent = async (userId: string) => {
    try {
      const routes = await getSavedRoutesFromSupabase(userId);
      setSavedRoutes(routes || []);
    } catch (err) {
      setSavedRoutes([]);
    }
  };

  const loadGlobalContent = async () => {
    try {
      const global = await getAllRecentRoutes(30);
      setRecentGlobalRoutes(global || []);
    } catch (err) {
      console.error("Failed to load global routes:", err);
      setRecentGlobalRoutes([]);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const clearMarkers = () => {
    markers.current.forEach(m => m && m.setMap(null));
    markers.current = [];
    if (directionsRenderer.current) {
      directionsRenderer.current.setDirections({ routes: [] });
    }
  };

  const clearPreviewMarkers = () => { previewMarkers.current.forEach(m => m && m.setMap(null)); previewMarkers.current = []; };

  const handleLocateUser = (panOnly = false) => {
    if (!navigator.geolocation) {
      if (!panOnly) showToast(isHe ? "הדפדפן שלך לא תומך בזיהוי מיקום" : "Geolocation not supported", "error");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation(pos);
        if (googleMap.current) {
          googleMap.current.panTo(pos);
          googleMap.current.setZoom(16);
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        if (!panOnly && googleMap.current) {
          showToast(isHe ? "לא ניתן לגשת למיקום שלך, עוברים לפריז" : "Unable to access location, going to Paris", "error");
          googleMap.current.panTo(PARIS_COORDS);
          setLocation(PARIS_COORDS);
        }
      },
      { timeout: 5000 }
    );
  };

  const handleFindNearbyRoutes = async () => {
    if (!googleMap.current) return;
    setIsSearchingNearby(true);
    setIsAiMenuOpen(false);

    try {
      const allRoutes = await getAllRecentRoutes(150);
      const center = googleMap.current.getCenter();

      const routesWithDist = allRoutes.map(route => {
        const startPoi = route.pois[0];
        const dist = google.maps.geometry.spherical.computeDistanceBetween(
          center,
          new google.maps.LatLng(startPoi.lat, startPoi.lng)
        );
        return { ...route, dist };
      });

      const sorted = routesWithDist.sort((a, b) => (a.dist || 0) - (b.dist || 0));
      const top10 = sorted.slice(0, 10);

      if (top10.length > 0) {
        renderNearbyMarkersOnMap(top10);
        const bounds = new google.maps.LatLngBounds();
        top10.forEach(r => bounds.extend(new google.maps.LatLng(r.pois[0].lat, r.pois[0].lng)));
        googleMap.current.fitBounds(bounds);
        showToast(isHe ? `מצאנו ${top10.length} מסלולים קרובים!` : `Found ${top10.length} nearby tours!`);
      } else {
        showToast(isHe ? "לא נמצאו מסלולים קרובים" : "No nearby tours found", "error");
      }
    } catch (err) {
      showToast(isHe ? "שגיאה בחיפוש מסלולים" : "Error searching for tours", "error");
    } finally {
      setIsSearchingNearby(false);
    }
  };

  const renderNearbyMarkersOnMap = (routes: RouteType[]) => {
    clearPreviewMarkers();
    if (!googleMap.current) return;

    routes.forEach((route, idx) => {
      if (!route.pois || route.pois.length === 0) return;
      const startPoi = route.pois[0];
      const marker = new google.maps.Marker({
        position: { lat: startPoi.lat, lng: startPoi.lng },
        map: googleMap.current,
        title: route.name,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#6366F1', fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 2 }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div dir="${isHe ? 'rtl' : 'ltr'}" style="padding: 12px; text-align: right; min-width: 180px;"><h4 style="margin: 0; font-size: 14px; font-weight: 500; color: #1e293b;">${route.name.replace(/\s*\(.*?\)\s*/g, '')}</h4><p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">${route.city}</p><div style="margin-top: 8px; font-size: 10px; color: #6366F1; font-weight: 500;">${Math.round((route.dist || 0) / 1000)}km away</div><button id="load-route-${idx}" style="margin-top: 12px; background: #6366F1; color: white; border: none; padding: 10px 14px; border-radius: 8px; font-size: 11px; font-weight: 500; cursor: pointer; width: 100%; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);">${isHe ? 'צפה במסלול' : 'View Tour'}</button></div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMap.current, marker);
        google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
          document.getElementById(`load-route-${idx}`)?.addEventListener('click', () => {
            handleLoadSavedRoute(route.city, route);
            infoWindow.close();
          });
        });
      });
      previewMarkers.current.push(marker);
    });
  };

  const getStreetAtPosition = (center: any, callback: (data: { city: string, street: string }) => void) => {
    setIsGeocoding(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: center }, (results: any, status: string) => {
      let city = isHe ? "מיקום נוכחי" : "Current Location";
      let street = isHe ? "רחוב נוכחי" : "Current Street";
      if (status === 'OK' && results.length > 0) {
        city = extractStandardCity(results) || city;
        for (const res of results) {
          const foundStreet = res.address_components.find((c: any) => c.types.includes('route'));
          if (foundStreet) {
            street = foundStreet.long_name;
            break;
          }
        }
      }
      setIsGeocoding(false);
      callback({ city, street });
    });
  };

  const startStreetConfirm = (type: 'area' | 'street') => {
    if (!googleMap.current) return;
    const center = googleMap.current.getCenter();
    if (selectionCircle.current) selectionCircle.current.setMap(null);

    setActiveTab('navigation');
    setSelectedPoi(null);
    setIsCardExpanded(false);

    if (type === 'area') {
      setDynamicRadius(3);
      // Ensure the zoom is appropriate for seeing a 3km radius circle (approx 3000m)
      googleMap.current.setZoom(14);
      selectionCircle.current = new google.maps.Circle({
        strokeColor: "#6366F1",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#6366F1",
        fillOpacity: 0.2,
        map: googleMap.current,
        center: center,
        radius: 3000,
        clickable: false,
        zIndex: 1000 // Ensure it's above basic map features
      });
    }

    getStreetAtPosition(center, (data) => {
      setStreetConfirmData({ type, city: data.city, street: type === 'street' ? data.street : "" });
      setIsAiMenuOpen(false);
      setIsConfirmPrefsExpanded(false);
    });
  };

  const handleManualSearch = () => {
    if (!searchQuery) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results: any, status: string) => {
      if (status === 'OK' && results[0]) {
        const newPos = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() };
        setLocation(newPos);
        googleMap.current.panTo(newPos);
        googleMap.current.setZoom(15);
        setSearchQuery(results[0].formatted_address);
      } else {
        showToast(isHe ? "לא מצאנו את המיקום הזה" : "Location not found", "error");
      }
    });
  };

  const handleCitySelect = async (city: any) => {
    setViewingCity(city.name);
    setIsLoadingCityRoutes(true);
    try {
      const routes = await getRoutesByCityHub(city.name, city.name_en);
      setCitySpecificRoutes(routes || []);
    } catch (err) { setCitySpecificRoutes([]); }
    finally { setIsLoadingCityRoutes(false); }
  };

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    const initApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user ?? null;
        setUser(u);

        loadGlobalContent();
        const cities = await supabase.from('popular_cities').select('*').eq('is_active', true).order('display_order');
        if (cities.data && cities.data.length > 0) {
          setPopularCities(cities.data);
        } else {
          setPopularCities(FALLBACK_CITIES);
        }

        if (u) {
          refreshSavedContent(u.id);
          const prefs = await getUserPreferences(u.id);
          if (prefs) setPreferences(prev => ({ ...prev, ...prefs }));
        }

        handleLocateUser(true);
      } catch (err) {
        console.error("Init error:", err);
      }
    };
    initApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      loadGlobalContent();

      if (u) {
        refreshSavedContent(u.id);
        const prefs = await getUserPreferences(u.id);
        if (prefs) setPreferences(prev => ({ ...prev, ...prefs }));
      } else {
        setSavedRoutes([]);
      }
    });
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (mapRef.current && !googleMap.current) {
      googleMap.current = new google.maps.Map(mapRef.current, {
        center: PARIS_COORDS, zoom: 14, gestureHandling: 'greedy', disableDefaultUI: true,
        styles: [{ "featureType": "poi", "stylers": [{ "visibility": "off" }] }, { "featureType": "transit", "stylers": [{ "visibility": "off" }] }]
      });
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: googleMap.current, suppressMarkers: true, preserveViewport: true,
        polylineOptions: { strokeColor: '#6366F1', strokeWeight: 5, strokeOpacity: 0.8 }
      });

      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current);
      autocomplete.bindTo('bounds', googleMap.current);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;
        const newPos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        setLocation(newPos);
        googleMap.current.panTo(newPos);
        googleMap.current.setZoom(15);
        setSearchQuery(place.formatted_address || '');
      });

      googleMap.current.addListener('center_changed', () => {
        const center = googleMap.current.getCenter();
        const activeConfirm = streetConfirmDataRef.current;
        if (activeConfirm) {
          if (selectionCircle.current && activeConfirm.type === 'area') {
            selectionCircle.current.setCenter(center);
          }
          if (geocodeTimeoutRef.current) window.clearTimeout(geocodeTimeoutRef.current);
          geocodeTimeoutRef.current = window.setTimeout(() => {
            getStreetAtPosition(center, (data) => {
              setStreetConfirmData(prev => {
                if (!prev) return null;
                return { ...prev, city: data.city, street: prev.type === 'street' ? data.street : "" };
              });
            });
          }, 250);
        }
      });
    }
  }, []);
  const handleActionCreateRoute = async () => {
    if (!streetConfirmData) return;
    const mode = streetConfirmData.type;
    const finalStreet = streetConfirmData.street;
    const finalCity = streetConfirmData.city;
    if (selectionCircle.current) { selectionCircle.current.setMap(null); selectionCircle.current = null; }

    clearMarkers();
    const tempId = `gen-${Date.now()}`;
    const placeholderRoute: RouteType = { id: tempId, name: mode === 'street' ? finalStreet : finalCity, city: finalCity, pois: [], description: "", durationMinutes: 0, creator: "Urbanito AI" };

    setOpenRoutes(prev => [...prev, placeholderRoute]);
    setActiveRouteIndex(openRoutes.length);
    setGeneratingRouteIds(prev => new Set(prev).add(tempId));
    setActiveTab('route');
    setIsAiMenuOpen(false);
    setShowGeneratingTooltip(true);

    const center = googleMap.current.getCenter();
    const pos = { lat: center.lat(), lng: center.lng() };
    const finalPrefs = { ...preferences, walkingDistance: dynamicRadius };

    setStreetConfirmData(null);
    setTimeout(() => setShowGeneratingTooltip(false), 3000);

    try {
      const route = mode === 'street'
        ? await generateStreetWalkRoute(`${finalStreet}, ${finalCity}`, pos, finalPrefs, user?.id)
        : await generateWalkingRoute(finalCity, pos, finalPrefs, "general", user?.id);

      if (route) {
        const validatedRoute = { ...route, id: tempId, city: finalCity, name: mode === 'street' ? finalStreet : route.name };
        setOpenRoutes(prev => prev.map(r => r.id === tempId ? validatedRoute : r));
        setGeneratingRouteIds(prev => { const next = new Set(prev); next.delete(tempId); return next; });

        setActiveTab('route');
        showToast(isHe ? 'המסלול שלך מוכן!' : 'Your tour is ready!', 'success');

        renderRouteMarkers(validatedRoute);
        logUsage(user?.id || null, finalCity);
        await saveToCuratedRoutes(validatedRoute);
        await loadGlobalContent();
      }
    } catch (err: any) {
      console.error("Route generation failure:", err);
      const errorMsg = isHe
        ? "חלה שגיאה זמנית (ייתכן שעקב עומס על השרתים). מומלץ לנסות שוב בעוד דקה או לבחור מסלול מוכן מהספריה."
        : "A temporary error occurred (possibly due to high server load). Please try again in a minute or pick a tour from the Library.";

      showToast(errorMsg, "error");
      setOpenRoutes(prev => prev.filter(r => r.id !== tempId));
      setActiveRouteIndex(prevIdx => Math.max(0, prevIdx - 1));
    } finally {
      setGeneratingRouteIds(prev => { const next = new Set(prev); next.delete(tempId); return next; });
    }
  };


  const handleLoadSavedRoute = async (cityName: string, route: RouteType) => {
    setOpenRoutes(prev => {
      const existingIdx = prev.findIndex(r => normalize(r.name) === normalize(route.name) && normalize(r.city) === normalize(route.city));
      if (existingIdx !== -1) { setActiveRouteIndex(existingIdx); return prev; }
      setActiveRouteIndex(prev.length);
      return [...prev, route];
    });
    renderRouteMarkers(route);
    setActiveTab('route');
    setIsAiMenuOpen(false);
    setIsCardExpanded(false);
    setStreetConfirmData(null);
    setViewingCity(null);
  };


  const renderRouteMarkers = (route: RouteType) => {
    clearMarkers();
    clearPreviewMarkers();
    if (!route.pois || route.pois.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    route.pois.forEach((p, i) => {
      if (!p.lat || !p.lng) return;
      const marker = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng }, map: googleMap.current,
        label: { text: (i + 1).toString(), color: 'white', fontSize: '10px' },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 14, fillColor: '#6366F1', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 }
      });
      marker.addListener('click', () => setSelectedPoi(p));
      markers.current.push(marker);
      bounds.extend(marker.getPosition());
    });
    if (googleMap.current && !bounds.isEmpty()) {
      googleMap.current.fitBounds(bounds);
    }
    new google.maps.DirectionsService().route({
      origin: { lat: route.pois[0].lat, lng: route.pois[0].lng },
      destination: { lat: route.pois[route.pois.length - 1].lat, lng: route.pois[route.pois.length - 1].lng },
      waypoints: route.pois.slice(1, -1).map(p => ({ location: { lat: p.lat, lng: p.lng }, stopover: true })),
      travelMode: google.maps.TravelMode.WALKING
    }, (res: any, status: string) => { if (status === 'OK') directionsRenderer.current.setDirections(res); });
  };

  const handleToggleAiMenu = () => {
    setIsAiMenuOpen(!isAiMenuOpen);
    setStreetConfirmData(null);
    if (selectionCircle.current) { selectionCircle.current.setMap(null); selectionCircle.current = null; }
  };

  const toggleTab = (tab: 'navigation' | 'profile' | 'route' | 'library') => {
    setActiveTab(tab);
    setIsAiMenuOpen(false);
    setSelectedPoi(null);
    setStreetConfirmData(null);
    if (selectionCircle.current) { selectionCircle.current.setMap(null); selectionCircle.current = null; }
    if (tab === 'library') {
      loadGlobalContent();
    }
    if (tab === 'route' && currentRoute) renderRouteMarkers(currentRoute);
  };

  const getIndicatorPosition = () => {
    const tabToIndex: Record<string, number> = { navigation: 0, library: 1, route: 3, profile: 4 };
    const index = tabToIndex[activeTab] || 0;
    return `translateX(${isHe ? (index * -100) : (index * 100)}%)`;
  };

  const handleCloseRoute = (idx: number) => {
    const next = openRoutes.filter((_, i) => i !== idx);
    setOpenRoutes(next);
    if (activeRouteIndex >= idx) setActiveRouteIndex(Math.max(0, activeRouteIndex - 1));
  };

  const isCardOpen = selectedPoi !== null || (activeTab === 'route' && currentRoute !== null);

  return (
    <div className="h-[100dvh] w-full flex flex-col relative bg-white overflow-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      <style>{`.liquid-indicator { transition: transform 0.4s cubic-bezier(0.68, -0.6, 0.32, 1.6); width: 20%; display: flex; justify-content: center; align-items: center; pointer-events: none; } .indicator-pill { width: 70%; height: 80%; background-color: #6366F1; border-radius: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); } .crosshair-container { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 9000; display: flex; flex-direction: column; align-items: center; transition: top 0.5s ease-in-out; } .crosshair-container.shifted { top: 65%; } .gen-tooltip { position: absolute; bottom: calc(100px + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); background: #0F172A; color: white; padding: 12px 24px; border-radius: 8px; font-size: 11px; font-medium: 500; z-index: 5000; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 12px; animation: in-out 0.3s ease-out; } @keyframes in-out { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } } .bottom-nav-safe { padding-bottom: env(safe-area-inset-bottom, 16px); min-height: calc(64px + env(safe-area-inset-bottom, 0px)); } .top-safe-area { padding-top: env(safe-area-inset-top, 24px); }`}</style>

      {showOnboarding && <UserGuide isHe={isHe} onClose={() => { setShowOnboarding(false); localStorage.setItem('urbanito_onboarding_v2', 'true'); }} />}
      {toast && <div className={`fixed top-[calc(env(safe-area-inset-top)+12px)] left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-[8px] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 ${toast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}><CheckCircle size={18} /><span className="text-sm font-medium">{toast.message}</span></div>}
      {showGeneratingTooltip && <div className="gen-tooltip"><RouteTravelIcon className="w-6 h-6" /><span className="font-normal">{isHe ? 'המסלול בבנייה...' : 'Preparing route...'}</span></div>}
      {isSearchingNearby && <div className="fixed inset-0 z-[8000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center"><div className="bg-white p-8 rounded-[8px] shadow-2xl flex flex-col items-center gap-4"><Loader2 size={40} className="animate-spin text-indigo-500" /><p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{isHe ? 'מחפש מסלולים בסביבה...' : 'Searching nearby...'}</p></div></div>}

      <main className="flex-1 relative h-full">
        <div ref={mapRef} className="w-full h-full" />

        <Routes>
          <Route path="/" element={
            <>
              {streetConfirmData && !isAiMenuOpen && (
                <div className={`crosshair-container ${streetConfirmData.type === 'area' ? 'shifted' : ''}`}>
                  <div className="animate-in zoom-in duration-300 flex flex-col items-center mb-2">
                    {streetConfirmData.type === 'street' ? <MapPin size={28} className="text-[#6366F1] fill-indigo-100/50" strokeWidth={1.2} /> : <TargetIcon size={28} className="text-[#6366F1] animate-pulse" />}
                  </div>
                  <div className="pointer-events-auto animate-in slide-in-from-top-4 duration-500">
                    <div className="w-[300px] bg-white rounded-[8px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100/50 overflow-hidden flex flex-col">
                      <div className="p-5 pb-2">
                        <div className="flex justify-between items-start mb-4">
                          <div className="text-right flex-1 min-w-0">
                            <h4 className="text-[9px] font-medium text-[#6366F1] uppercase tracking-[0.2em] mb-1">{streetConfirmData.type === 'street' ? (isHe ? 'מסלול רחוב' : 'Street Tour') : (isHe ? 'סיור באזור' : 'Area Tour')}</h4>
                            <div className={`text-lg font-medium text-slate-900 bg-slate-50/50 rounded-[8px] px-3 py-1.5 truncate transition-opacity duration-200 ${isGeocoding ? 'opacity-30' : 'opacity-100'}`}>
                              {streetConfirmData.type === 'street' ? streetConfirmData.street : streetConfirmData.city}
                            </div>
                            {streetConfirmData.type === 'area' && (
                              <p className="text-[10px] text-slate-400 mt-2 font-medium tracking-wide">
                                {isHe ? 'רדיוס סיור:' : 'Radius:'} <span className="text-[#6366F1] font-medium">{dynamicRadius}km</span>
                              </p>
                            )}
                          </div>
                          <button onClick={() => { setStreetConfirmData(null); if (selectionCircle.current) { selectionCircle.current.setMap(null); selectionCircle.current = null; } }} className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors bg-slate-50 rounded-full"><X size={16} /></button>
                        </div>
                        <button onClick={() => setIsConfirmPrefsExpanded(!isConfirmPrefsExpanded)} className="w-full flex items-center justify-between py-2 text-[10px] font-medium text-slate-400 border-t border-slate-50 mt-1 hover:text-[#6366F1] transition-colors">
                          <span className="flex items-center gap-2"><Settings2 size={14} /> {isHe ? 'העדפות מסלול' : 'Route Preferences'}</span>
                          {isConfirmPrefsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      <div className={`overflow-y-auto no-scrollbar transition-all duration-500 ease-in-out ${isConfirmPrefsExpanded ? 'max-h-[300px] opacity-100 border-t border-slate-50' : 'max-h-0 opacity-0'}`}>
                        <QuickRouteSetup preferences={preferences} onUpdatePreferences={setPreferences} onGenerate={() => { }} onCancel={() => { }} isEmbedded={true} hideActionButton={true} />
                      </div>
                      <div className="p-5 pt-3">
                        <button onClick={handleActionCreateRoute} className="w-full py-4 bg-[#0F172A] text-white rounded-[8px] font-medium text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                          <RouteTravelIcon className="w-5 h-5" animated={false} />
                          {isHe ? 'בנה לי מסלול אישי' : 'Build My Tour'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!selectedPoi && !isAiMenuOpen && !streetConfirmData && (
                <div className="absolute top-0 inset-x-0 z-[1000] flex flex-col items-center pointer-events-none top-safe-area px-6">
                  <div className="w-full max-w-md bg-white p-1.5 h-16 flex items-center gap-2 pointer-events-auto shadow-xl rounded-[8px] border border-slate-100 mt-4">
                    <button onClick={handleManualSearch} className="flex items-center justify-center w-12 h-12 text-slate-400 hover:text-[#6366F1]"><Search size={20} /></button>
                    <input ref={searchInputRef} type="text" placeholder={isHe ? 'לאן מטיילים?' : 'Where to?'} className="bg-transparent border-none outline-none flex-1 text-base font-medium text-slate-800" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()} />
                  </div>
                </div>
              )}

              {!selectedPoi && (
                <button onClick={() => handleLocateUser()} className={`absolute bottom-24 ${isHe ? 'left-6' : 'right-6'} z-[1000] w-12 h-12 bg-white rounded-full-force shadow-2xl border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-all`}>
                  {isLocating ? <Loader2 size={20} className="animate-spin text-[#6366F1]" /> : <LocateFixed size={20} />}
                </button>
              )}
            </>
          } />

          <Route path="/library" element={
            <div className="absolute inset-0 bg-slate-50 z-[3000] p-6 overflow-y-auto pb-32 no-scrollbar animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center mb-8 pt-4 top-safe-area"><h2 className="text-3xl font-medium tracking-tight">{isHe ? 'ספריה' : 'Library'}</h2></div>
              {!viewingCity ? (
                <div className="space-y-12">
                  <section>
                    <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <BookOpen size={12} className="text-[#6366F1]" /> {isHe ? 'ערים פופולריות' : 'Popular Cities'}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {(popularCities && popularCities.length > 0 ? popularCities : FALLBACK_CITIES).map(city => (
                        <button key={city.id} onClick={() => handleCitySelect(city)} className="group flex flex-col gap-1.5">
                          <div className="relative aspect-[4/5] overflow-hidden shadow-lg rounded-[8px] bg-slate-200">
                            <img src={city.img_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={city.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 flex items-end justify-center p-2">
                              <span className="text-white text-[10px] font-medium text-center">{city.name}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  {recentGlobalRoutes.length > 0 && (
                    <section>
                      <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <History size={12} className="text-amber-500" /> {isHe ? 'מסלולים אחרונים בקהילה' : 'Recent Community Tours'}
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {recentGlobalRoutes.slice(0, 30).map((route, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleLoadSavedRoute(route.city, route)}
                            className="w-full flex items-center gap-4 bg-white p-3 rounded-[8px] shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
                          >
                            <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-slate-100 shrink-0">
                              <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full" />
                            </div>
                            <div className="flex-1 text-right min-w-0">
                              <div className="text-[8px] font-medium text-[#6366F1] uppercase tracking-widest">{route.city}</div>
                              <h4 className="text-[14px] font-medium text-slate-900 truncate leading-tight">
                                {route.name.replace(/\s*\(.*?\)\s*/g, '')}
                              </h4>
                            </div>
                            <ChevronLeft size={16} className="text-slate-300" />
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <button onClick={() => setViewingCity(null)} className="flex items-center gap-1.5 text-[10px] uppercase font-medium text-slate-400 hover:text-[#6366F1]">
                    <ArrowRight size={12} /> {isHe ? 'חזרה לספריה' : 'Back to Library'}
                  </button>
                  <h3 className="text-3xl font-medium tracking-tight">{viewingCity}</h3>
                  {isLoadingCityRoutes ? (
                    <div className="flex flex-col items-center py-20 gap-4">
                      <Loader2 className="animate-spin text-indigo-500" />
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{isHe ? 'מחפש מסלולים פנומנליים...' : 'Searching Tours...'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {citySpecificRoutes.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-white rounded-[8px] border border-dashed border-slate-200">
                          <p className="text-[11px] uppercase tracking-widest">{isHe ? 'אין עדיין מסלולים בעיר זו' : 'No tours for this city yet'}</p>
                        </div>
                      ) : (
                        citySpecificRoutes.map((route, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleLoadSavedRoute(route.city, route)}
                            className="w-full flex items-center gap-4 bg-white p-4 rounded-[8px] shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
                          >
                            <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-slate-100 shrink-0">
                              <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full" />
                            </div>
                            <div className="flex-1 text-right min-w-0">
                              <h4 className="text-[15px] font-medium text-slate-900 truncate">
                                {route.name.replace(/\s*\(.*?\)\s*/g, '')}
                              </h4>
                            </div>
                            <ChevronLeft size={16} className="text-slate-300" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          } />

          <Route path="/route" element={
            <div className="absolute inset-0 z-[3000] pointer-events-none">
              {isGeneratingActive ? <div className="pointer-events-auto h-full"><RouteSkeleton isHe={isHe} /></div> : currentRoute ? <div className="pointer-events-auto h-full"><RouteOverview route={currentRoute} onPoiClick={setSelectedPoi} onRemovePoi={() => { }} onAddPoi={() => { }} onSave={() => { }} preferences={preferences} onUpdatePreferences={setPreferences} onRequestRefine={() => { }} user={user} isSaved={isCurrentRouteSaved} onClose={() => navigate('/')} isExpanded={isCardExpanded} setIsExpanded={setIsCardExpanded} onRegenerate={handleActionCreateRoute} /></div> : <div className="pointer-events-auto h-full bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center text-slate-400"><RouteIcon size={40} className="mb-4 opacity-20" /><p className="font-medium">{isHe ? 'אין מסלול פעיל' : 'No active route'}</p></div>}
            </div>
          } />

          <Route path="/profile" element={
            <div className="absolute inset-0 bg-white z-[3000] p-6 overflow-y-auto pb-32 no-scrollbar animate-in slide-in-from-bottom duration-500">
              <div className="top-safe-area"><PreferencesPanel preferences={preferences} setPreferences={setPreferences} savedRoutes={savedRoutes} savedPois={[]} user={user} onLogin={signInWithGoogle} onLogout={signOut} onLoadRoute={(city, r) => handleLoadSavedRoute(city, r)} onDeleteRoute={(id) => user?.id && deleteRouteFromSupabase(id, user.id).then(() => refreshSavedContent(user.id))} onDeletePoi={() => { }} onOpenFeedback={() => { }} onOpenGuide={() => setShowOnboarding(true)} uniqueUserCount={0} remainingGens={0} offlineRouteIds={[]} onLoadOfflineRoute={() => { }} /></div>
            </div>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {isAiMenuOpen && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl z-[7000] flex flex-col items-center justify-end pb-32 px-6">
            <div className="w-full max-w-[340px] space-y-3 mb-16">
              <button onClick={() => startStreetConfirm('area')} className="w-full bg-white py-5 px-6 flex items-center gap-5 shadow-xl rounded-[8px]"><Navigation size={22} className="text-[#6366F1] shrink-0" /><h4 className="text-[14px] font-medium text-slate-900">{isHe ? 'סיור חכם באזור' : 'Smart Area Tour'}</h4></button>
              <button onClick={() => startStreetConfirm('street')} className="w-full bg-white py-5 px-6 flex items-center gap-5 shadow-xl rounded-[8px]"><Signpost size={22} className="text-[#6366F1] shrink-0" /><h4 className="text-[14px] font-medium text-slate-900">{isHe ? 'מסלול רחוב' : 'Street Tour'}</h4></button>
              <button onClick={handleFindNearbyRoutes} className="w-full bg-white py-5 px-6 flex items-center gap-5 shadow-xl rounded-[8px]"><MapPinned size={22} className="text-[#6366F1] shrink-0" /><h4 className="text-[14px] font-medium text-slate-900">{isHe ? 'מסלולים מוכנים בסביבה' : 'Ready Nearby Tours'}</h4></button>
            </div>
          </div>
        )}

        {selectedPoi && currentRoute && (
          <UnifiedPoiCard poi={selectedPoi} route={currentRoute} currentIndex={currentRoute.pois.findIndex(p => p.id === selectedPoi.id)} totalCount={currentRoute.pois.length} preferences={preferences} onUpdatePreferences={setPreferences} onClose={() => setSelectedPoi(null)} onNext={() => { const idx = currentRoute.pois.findIndex(p => p.id === selectedPoi.id); if (idx < currentRoute.pois.length - 1) setSelectedPoi(currentRoute.pois[idx + 1]); }} onPrev={() => { const idx = currentRoute.pois.findIndex(p => p.id === selectedPoi.id); if (idx > 0) setSelectedPoi(currentRoute.pois[idx - 1]); }} isExpanded={isCardExpanded} setIsExpanded={setIsCardExpanded} showToast={showToast} />
        )}

        {activeTab === 'route' && openRoutes.length > 0 && !streetConfirmData && (
          <div className="absolute top-0 inset-x-0 z-[4000] top-safe-area px-6 pt-4 pointer-events-none">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto py-2">
              {openRoutes.map((r, i) => (
                <button key={r.id} onClick={() => { setActiveRouteIndex(i); renderRouteMarkers(r); }} className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[8px] border shadow-xl transition-all ${activeRouteIndex === i ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white text-slate-600 border-slate-100'}`}>
                  {generatingRouteIds.has(r.id) && <Loader2 size={12} className="animate-spin text-[#6366F1]" />}
                  <span className="text-[10px] font-medium truncate max-w-[120px]">{r.name.replace(/\s*\(.*?\)\s*/g, '')}</span>
                  <X size={12} onClick={(e) => { e.stopPropagation(); handleCloseRoute(i); }} className="p-1 hover:bg-slate-500/20 rounded-full" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {!selectedPoi && (
        <div className="fixed bottom-0 left-0 right-0 z-[8000] bg-white border-t border-slate-100 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.05)] bottom-nav-safe">
          {!isAiMenuOpen ? (
            <div className="relative w-full grid grid-cols-5 h-16 items-center">
              <div className="absolute inset-y-0 h-16 liquid-indicator z-0" style={{ transform: getIndicatorPosition() }}><div className="indicator-pill" /></div>
              <button onClick={() => navigate('/')} className={`relative z-10 flex justify-center ${activeTab === 'navigation' ? 'text-white' : 'text-slate-400'}`}><Compass size={22} /></button>
              <button onClick={() => navigate('/library')} className={`relative z-10 flex justify-center ${activeTab === 'library' ? 'text-white' : 'text-slate-400'}`}><LibraryIcon size={22} /></button>
              <div className="relative z-10 flex justify-center">{!isCardOpen && (<button onClick={handleToggleAiMenu} className="w-12 h-12 bg-white text-[#6366F1] shadow-xl flex items-center justify-center rounded-full-force border border-slate-100 -mt-8"><Plus size={28} /></button>)}</div>
              <button onClick={() => navigate('/route')} className={`relative z-10 flex justify-center transition-all ${activeTab === 'route' ? 'text-white' : 'text-slate-400'}`}>{generatingRouteIds.size > 0 ? <RouteTravelIcon className="w-7 h-7" animated={true} /> : <RouteIcon size={22} />}</button>
              <button onClick={() => navigate('/profile')} className={`relative z-10 flex justify-center ${activeTab === 'profile' ? 'text-white' : 'text-slate-400'}`}><UserIcon size={22} /></button>
            </div>
          ) : <div className="flex items-center justify-center h-16"><button onClick={handleToggleAiMenu} className="w-12 h-12 bg-white text-[#6366F1] shadow-xl flex items-center justify-center rounded-full-force border border-slate-100 -mt-8"><X size={24} /></button></div>}
        </div>
      )}

    </div>
  );
};

export default App;
