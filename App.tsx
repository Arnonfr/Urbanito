import React, { useState, useEffect, useRef } from 'react';
import { Compass, Search, Loader2, User as UserIcon, Library as LibraryIcon, Route as RouteIcon, Heart, ChevronLeft, Sparkles, MapPin, Globe, X, Zap, Locate, Play, Clock, ArrowRight } from 'lucide-react';
import { UserPreferences, Route, POI, RouteConcept } from './types';
import { generateWalkingRoute, fetchCityRouteConcepts } from './services/geminiService';
import { PreferencesPanel } from './components/PreferencesPanel';
import { UnifiedPoiCard } from './components/UnifiedPoiCard';
import { RouteOverview } from './components/RouteOverview';
import { QuickRouteSetup } from './components/QuickRouteSetup';
import { saveRouteToSupabase, getSavedRoutesFromSupabase, deleteRouteFromSupabase, findCachedRoute } from './services/supabase';

declare var google: any;

const getOrCreateUserId = () => {
  try {
    let userId = localStorage.getItem('urban_explorer_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('urban_explorer_user_id', userId);
    }
    return userId;
  } catch (e) {
    return 'temp_user';
  }
};

const PRESET_CITIES = [
  'פריז', 'ירושלים', 'לונדון', 'רומא', 'ניו יורק', 
  'טוקיו', 'ברצלונה', 'אמסטרדם', 'ונציה', 'ברלין',
  'אתונה', 'פראג', 'ליסבון', 'איסטנבול', 'תל אביב'
];

// Predefined concepts to show instantly while AI fetches the other 20
const FEATURED_CONCEPTS: Record<string, RouteConcept[]> = {
  'ירושלים': [
    { id: 'jlm1', title: 'סמטאות העיר העתיקה', description: 'מסע בזמן בין ארבעת הרובעים', tags: ['היסטוריה', 'דת'], duration: '3h', difficulty: 'moderate' },
    { id: 'jlm2', title: 'טעמים של מחנה יהודה', description: 'סיור קולינרי בשוק הצבעוני', tags: ['אוכל', 'תרבות'], duration: '2h', difficulty: 'easy' },
    { id: 'jlm3', title: 'משכנות שאננים והטחנה', description: 'היציאה מהחומות והנוף המרהיב', tags: ['נוף', 'היסטוריה'], duration: '1.5h', difficulty: 'easy' }
  ],
  'פריז': [
    { id: 'par1', title: 'סודות המארה', description: 'אופנה, פלאפל ואחוזות עתיקות', tags: ['שיק', 'היסטוריה'], duration: '2.5h', difficulty: 'easy' },
    { id: 'par2', title: 'הגדה השמאלית הספרותית', description: 'בעקבות המינגווי ופיקאסו', tags: ['אמנות', 'ספרות'], duration: '2h', difficulty: 'easy' },
    { id: 'par3', title: 'מונמרטר הבוהמיינית', description: 'אמנים, כנסיות ונוף לעיר', tags: ['רומנטי', 'נוף'], duration: '3h', difficulty: 'moderate' }
  ]
};

const CITY_IMAGES: Record<string, string> = {
  'פריז': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
  'ירושלים': 'https://images.unsplash.com/photo-1541093113199-a2e9d84e903f?auto=format&fit=crop&w=600&q=80',
  'רומא': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
  'לונדון': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
  'ניו יורק': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80',
  'טוקיו': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80',
  'ברצלונה': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=600&q=80',
  'אמסטרדם': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=600&q=80',
  'ונציה': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=600&q=80',
  'ברלין': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=600&q=80',
  'אתונה': 'https://images.unsplash.com/photo-1503152394-c571994fd383?auto=format&fit=crop&w=600&q=80',
  'פראג': 'https://images.unsplash.com/photo-1519677100203-a0e668c78438?auto=format&fit=crop&w=600&q=80',
  'ליסבון': 'https://images.unsplash.com/photo-1585208798174-6cedd863bc99?auto=format&fit=crop&w=600&q=80',
  'איסטנבול': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=600&q=80',
  'תל אביב': 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&w=600&q=80'
};

const STACK_COLORS_HEX = ["#059669", "#0d9488", "#16a34a", "#047857", "#0f766e"];

const App: React.FC = () => {
  const [userId] = useState(getOrCreateUserId);
  const [preferences, setPreferences] = useState<UserPreferences>({
    hiddenGemsLevel: 30,
    interests: ['היסטוריה'],
    walkingDistance: 3,
    desiredPoiCount: 5,
    language: 'he',
    religiousFriendly: false,
    veganFriendly: false,
    accessibleOnly: false
  });
  
  const [isAppReady, setIsAppReady] = useState(false);
  const isHe = preferences.language === 'he';

  const t = {
    searchPlaceholder: isHe ? "לאן נטייל היום?" : "Where to explore?",
    libraryTitle: isHe ? "ספריית המסלולים" : "The Library",
    home: isHe ? "מפה" : "Map",
    library: isHe ? "ספרייה" : "Library",
    profile: isHe ? "פרופיל" : "Profile",
    error: isHe ? "אירעה שגיאה בטעינת המסלול" : "Error loading route",
    cancel: isHe ? "ביטול" : "Cancel",
    searchHere: isHe ? "צור מסלול באזור זה" : "Explore this area",
    loadingTooltip: isHe ? "המסלול בטעינה, יפתח מיד..." : "Route loading, opening shortly...",
    backToLib: isHe ? "חזרה לספרייה" : "Back to Library",
    generatingLibrary: isHe ? "מכין עבורך מסלולים ייחודיים..." : "Curating unique routes...",
    generate: isHe ? "צור מסלול" : "Create"
  };

  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'profile' | 'route'>('home');
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [showTooltip, setShowTooltip] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);
  
  // Library Inner Shelf State
  const [selectedLibraryCity, setSelectedLibraryCity] = useState<string | null>(null);
  const [cityConcepts, setCityConcepts] = useState<RouteConcept[]>([]);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState(false);

  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(null);
  const [showSearchHereBtn, setShowSearchHereBtn] = useState(false);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const fallbackPolylineRef = useRef<any>(null);

  useEffect(() => {
    getSavedRoutesFromSupabase(userId).then(setSavedRoutes).finally(() => setIsAppReady(true));
  }, [userId]);

  // Handle Loading Tooltip logic
  useEffect(() => {
    if (isLoading) {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 7000);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [isLoading]);

  // Handle Library City Selection
  const handleCitySelect = async (city: string) => {
    setSelectedLibraryCity(city);
    // Load initial featured concepts instantly
    setCityConcepts(FEATURED_CONCEPTS[city] || []);
    setIsLoadingConcepts(true);
    
    // Fetch 20+ more concepts from AI
    try {
      const moreConcepts = await fetchCityRouteConcepts(city, preferences.language);
      setCityConcepts(prev => {
        // Dedup by title just in case
        const existingTitles = new Set(prev.map(c => c.title));
        const uniqueNew = moreConcepts.filter(c => !existingTitles.has(c.title));
        return [...prev, ...uniqueNew];
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingConcepts(false);
    }
  };

  useEffect(() => {
    if (isAppReady && mapRef.current && !googleMap.current) {
      const initMap = () => {
        if (typeof google !== 'undefined' && google.maps) {
          googleMap.current = new google.maps.Map(mapRef.current, {
            center: { lat: 31.7767, lng: 35.2345 },
            zoom: 14,
            gestureHandling: 'greedy',
            styles: [
              { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
              { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f8fafc" }] },
              { "featureType": "water", "stylers": [{ "color": "#e2e8f0" }] }
            ],
            disableDefaultUI: true,
          });

          googleMap.current.addListener('idle', () => {
             const center = googleMap.current.getCenter();
             setMapCenter({ lat: center.lat(), lng: center.lng() });
             setShowSearchHereBtn(true);
          });
          
          googleMap.current.addListener('dragstart', () => {
             setShowSearchHereBtn(false);
          });

          directionsServiceRef.current = new google.maps.DirectionsService();
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            map: googleMap.current,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#10b981',
              strokeOpacity: 0.8,
              strokeWeight: 6,
              icons: [{
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 3, fillOpacity: 1, fillColor: '#059669' },
                offset: '0',
                repeat: '15px'
              }]
            }
          });
        } else { setTimeout(initMap, 500); }
      };
      initMap();
    }
  }, [isAppReady]);

  useEffect(() => {
    if (googleMap.current && currentRoute) {
      // Clear markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = currentRoute.pois.map((poi, index) => {
        const marker = new google.maps.Marker({
          position: { lat: Number(poi.lat), lng: Number(poi.lng) },
          map: googleMap.current,
          label: { text: (index + 1).toString(), color: 'white', fontSize: '10px', fontWeight: '800' },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 13,
            fillColor: selectedPoi?.id === poi.id ? "#10b981" : (STACK_COLORS_HEX[index % 5] || "#1e293b"),
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: "white",
          }
        });
        marker.addListener('click', () => { setSelectedPoi(poi); setActiveTab('home'); });
        return marker;
      });

      // Update Path
      if (currentRoute.pois.length > 1) {
        // Clear previous paths
        if (fallbackPolylineRef.current) {
          fallbackPolylineRef.current.setMap(null);
          fallbackPolylineRef.current = null;
        }
        
        // Temporarily clear directions renderer
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }

        directionsServiceRef.current.route({
          origin: { lat: Number(currentRoute.pois[0].lat), lng: Number(currentRoute.pois[0].lng) },
          destination: { lat: Number(currentRoute.pois[currentRoute.pois.length - 1].lat), lng: Number(currentRoute.pois[currentRoute.pois.length - 1].lng) },
          waypoints: currentRoute.pois.slice(1, -1).map(p => ({ location: { lat: Number(p.lat), lng: Number(p.lng) }, stopover: true })),
          travelMode: google.maps.TravelMode.WALKING,
          avoidFerries: true, // Attempt to avoid water
          avoidHighways: true,
          optimizeWaypoints: false // Keep the strict order of the tour
        }, (result: any, status: any) => { 
          if (status === 'OK') {
             directionsRendererRef.current.setMap(googleMap.current);
             directionsRendererRef.current.setDirections(result);
          } else {
             // Silence explicit alerts for expected permission errors and fallback
             if (status !== 'REQUEST_DENIED' && status !== 'OVER_QUERY_LIMIT') {
               console.warn("Directions API failed, using fallback polyline", status);
             }
             
             // Draw fallback polyline (straight lines) - Dashed to indicate "direct path" not walking path
             fallbackPolylineRef.current = new google.maps.Polyline({
               path: currentRoute.pois.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) })),
               geodesic: true,
               strokeColor: '#10b981',
               strokeOpacity: 0.5,
               strokeWeight: 4,
               icons: [{
                 icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                 offset: '0',
                 repeat: '20px'
               }],
               map: googleMap.current
             });
          }
        });
      }
    }
  }, [currentRoute, selectedPoi]);

  useEffect(() => {
    if(googleMap.current && selectedPoi) {
      const lat = Number(selectedPoi.lat);
      const lng = Number(selectedPoi.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        googleMap.current.setCenter({ lat, lng });
        googleMap.current.setZoom(17);
        googleMap.current.panBy(0, 240); 
      }
    }
  }, [selectedPoi]);

  const handleStartRoute = async (cityName: string, specificLocation?: { lat: number, lng: number }, specificTheme?: string) => {
    if (isLoading) return;
    setShowQuickSetup(false); setShowSearchHereBtn(false); setSearchQuery(cityName); setSuggestions([]); setSelectedPoi(null); setIsLoading(true);
    try {
      if (!specificLocation && !specificTheme) {
        const cached = await findCachedRoute(cityName);
        if (cached?.pois?.length) { 
          setCurrentRoute(cached); setActiveTab('route'); setIsLoading(false); return; 
        }
      }
      const route = await generateWalkingRoute(cityName, specificLocation || null, preferences, specificTheme);
      setCurrentRoute(route); setActiveTab('route');
    } catch (e) { alert(t.error); } finally { setIsLoading(false); }
  };

  const handleQuickSetupGenerate = () => {
    if (currentRoute && currentRoute.pois && currentRoute.pois[0]) {
      // Refining existing route - preserve location
      handleStartRoute(currentRoute.city, { lat: currentRoute.pois[0].lat, lng: currentRoute.pois[0].lng });
    } else if (mapCenter) {
      // New exploration from map center
      handleStartRoute("Custom Area", mapCenter);
    }
  };

  // Add Hidden Gem to Route Logic
  const handleAddToRoute = (gem: Partial<POI>) => {
    if (!currentRoute || !gem.name || !selectedPoi) return;

    const newPoi: POI = {
      id: `gem-${Date.now()}-${Math.random()}`,
      name: gem.name,
      lat: gem.lat || selectedPoi.lat + 0.001,
      lng: gem.lng || selectedPoi.lng + 0.001,
      description: gem.description || "",
      category: 'nature', // Default category for gems
      historicalContext: isHe ? "נוסף ידנית" : "Manually added hidden gem",
      architecturalStyle: isHe ? "מידע לא זמין" : "Information unavailable",
      imageUrl: undefined,
      travelFromPrevious: {
         distance: "Nearby",
         duration: "5 min"
      }
    };

    // Insert the gem immediately after the currently selected POI
    const currentIndex = currentRoute.pois.findIndex(p => p.id === selectedPoi.id);
    const newPois = [...currentRoute.pois];
    
    // If found, insert after; otherwise push to end
    if (currentIndex !== -1) {
      newPois.splice(currentIndex + 1, 0, newPoi);
    } else {
      newPois.push(newPoi);
    }

    const updatedRoute = { ...currentRoute, pois: newPois };
    setCurrentRoute(updatedRoute);
  };

  if (!isAppReady) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className={`flex flex-col h-screen bg-white overflow-hidden ${isHe ? 'text-right' : 'text-left'}`} dir={isHe ? 'rtl' : 'ltr'}>
      
      {showQuickSetup && (
        <QuickRouteSetup 
          preferences={preferences} 
          onUpdatePreferences={setPreferences} 
          onCancel={() => setShowQuickSetup(false)} 
          onGenerate={handleQuickSetupGenerate} 
        />
      )}

      {activeTab === 'home' && !isLoading && !selectedPoi && showSearchHereBtn && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[140]"><button onClick={() => setShowQuickSetup(true)} className="bg-emerald-600 text-white shadow-xl shadow-emerald-200 rounded-full px-6 py-3 flex items-center gap-3 text-sm font-medium hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95"><Locate size={18} className="text-emerald-100" />{t.searchHere}</button></div>}

      {activeTab === 'home' && !selectedPoi && (
        <header className="fixed top-8 inset-x-8 z-[150] pointer-events-none">
          <div className="pointer-events-auto max-w-lg mx-auto bg-white shadow-xl rounded-[2rem] overflow-hidden">
            <div className="px-6 py-4 flex items-center gap-4">
               <Search size={20} className="text-slate-800" />
               <input type="text" value={searchQuery} placeholder={t.searchPlaceholder} onChange={(e) => {setSearchQuery(e.target.value); if(e.target.value) setSuggestions(PRESET_CITIES.filter(c => c.includes(e.target.value)).slice(0,5)); else setSuggestions([]);}} onKeyDown={(e) => e.key === 'Enter' && handleStartRoute(searchQuery)} className="flex-1 outline-none text-base font-normal bg-transparent placeholder-slate-400 text-slate-900" />
            </div>
            {suggestions.length > 0 && <div className="border-t border-slate-50 py-2">{suggestions.map((city, idx) => <button key={idx} onClick={() => handleStartRoute(city)} className="w-full px-6 py-4 text-right flex items-center gap-4 hover:bg-slate-50 transition-colors"><MapPin size={14} className="text-slate-300" /><span className="text-sm font-normal text-slate-600">{city}</span></button>)}</div>}
          </div>
        </header>
      )}

      <main className="flex-1 relative">
        <div ref={mapRef} className={`absolute inset-0 transition-opacity duration-1000 ${activeTab === 'home' || activeTab === 'route' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
        <div className="relative h-full pointer-events-none z-[100]">
          
          {/* Library Tab with Inner Shelf Logic */}
          {activeTab === 'library' && (
             <div className="absolute inset-0 bg-white pointer-events-auto overflow-y-auto no-scrollbar">
                {!selectedLibraryCity ? (
                  /* Main Library Grid */
                  <div className="p-12 pb-48">
                    <header className="mb-12 text-center"><h2 className="text-3xl font-light tracking-tight text-slate-900">{t.libraryTitle}</h2></header>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      {PRESET_CITIES.map(city => (
                        <button key={city} onClick={() => handleCitySelect(city)} className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                          <img src={CITY_IMAGES[city]} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-8">
                             <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-[0.2em] mb-2">EXPERIENCE</span>
                             <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{city}</h3>
                             <div className="flex items-center gap-2 mt-2 text-white/70 text-[10px]">
                               <LibraryIcon size={10} /> 20+ Routes
                             </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* City Detail "Inner Shelf" */
                  <div className="pb-40">
                     <div className="relative h-64 w-full">
                        <img src={CITY_IMAGES[selectedLibraryCity]} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                        <button onClick={() => setSelectedLibraryCity(null)} className="absolute top-8 left-8 p-3 bg-white/50 backdrop-blur-md rounded-full text-slate-800 hover:bg-white transition-all z-20">
                          {isHe ? <ArrowRight size={24} /> : <ChevronLeft size={24} />}
                        </button>
                        <div className="absolute bottom-8 px-10">
                           <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">{selectedLibraryCity}</h2>
                           <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                              <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {cityConcepts.length} Routes Available
                              </span>
                              {isLoadingConcepts && <span className="flex items-center gap-2 text-violet-500 animate-pulse"><Loader2 size={12} className="animate-spin" /> {t.generatingLibrary}</span>}
                           </div>
                        </div>
                     </div>

                     <div className="px-6 grid gap-4 max-w-3xl mx-auto">
                        {cityConcepts.map((concept) => (
                          <div key={concept.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-50 to-transparent rounded-bl-[4rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="relative z-10 flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                   <div className="flex flex-wrap gap-2">
                                      {concept.tags.map(tag => (
                                        <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{tag}</span>
                                      ))}
                                   </div>
                                   <h3 className="text-xl font-bold text-slate-900 group-hover:text-violet-700 transition-colors">{concept.title}</h3>
                                   <p className="text-sm font-light text-slate-600 leading-relaxed">{concept.description}</p>
                                   <div className="flex items-center gap-4 pt-2 text-xs font-medium text-slate-400">
                                      <span className="flex items-center gap-1"><Clock size={12} /> {concept.duration}</span>
                                      <span className="flex items-center gap-1"><Zap size={12} className={concept.difficulty === 'easy' ? 'text-emerald-400' : 'text-orange-400'} /> {concept.difficulty}</span>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => handleStartRoute(selectedLibraryCity, undefined, concept.title)}
                                  className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-violet-600 hover:text-white transition-all shadow-sm hover:shadow-violet-200 active:scale-95"
                                >
                                  <Play size={20} fill="currentColor" className="ml-0.5" />
                                </button>
                             </div>
                          </div>
                        ))}
                        {/* Loading Skeleton */}
                        {isLoadingConcepts && (
                          [1,2,3].map(i => (
                             <div key={i} className="bg-slate-50 rounded-[2rem] p-6 h-32 animate-pulse" />
                          ))
                        )}
                     </div>
                  </div>
                )}
             </div>
          )}

          {activeTab === 'profile' && <div className="absolute inset-0 bg-white pointer-events-auto overflow-y-auto no-scrollbar"><PreferencesPanel preferences={preferences} setPreferences={setPreferences} savedRoutes={savedRoutes} onLoadRoute={(c, r) => { setCurrentRoute(r); setActiveTab('route'); }} onDeleteRoute={(id) => deleteRouteFromSupabase(id, userId).then(() => getSavedRoutesFromSupabase(userId).then(setSavedRoutes))} /></div>}
          {activeTab === 'route' && currentRoute && <RouteOverview route={currentRoute} preferences={preferences} onUpdatePreferences={setPreferences} onRequestRefine={() => setShowQuickSetup(true)} onGenerate={() => currentRoute.pois[0] && handleStartRoute(currentRoute.city, { lat: currentRoute.pois[0].lat, lng: currentRoute.pois[0].lng })} onPoiClick={(poi) => { setSelectedPoi(poi); setActiveTab('home'); }} />}
          {activeTab === 'home' && selectedPoi && <div className="absolute inset-0 pointer-events-none"><UnifiedPoiCard poi={selectedPoi} route={currentRoute || {id: 't', city: 'L', name: 'D', description: '', durationMinutes: 0, creator: 'AI', pois: [selectedPoi]}} onClose={() => setSelectedPoi(null)} currentIndex={currentRoute?.pois.indexOf(selectedPoi) || 0} totalCount={currentRoute?.pois.length || 0} preferences={preferences} onNext={() => { const idx = currentRoute?.pois.indexOf(selectedPoi); if(idx !== undefined && idx < currentRoute!.pois.length - 1) setSelectedPoi(currentRoute!.pois[idx+1]); }} onPrev={() => { const idx = currentRoute?.pois.indexOf(selectedPoi); if(idx !== undefined && idx > 0) setSelectedPoi(currentRoute!.pois[idx-1]); }} onRemove={() => {}} onAddToRoute={handleAddToRoute} onGoToPoi={setSelectedPoi} /></div>}
        </div>
      </main>

      {!selectedPoi && !showQuickSetup && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[250] bg-white shadow-2xl rounded-full p-2 flex items-center gap-1 pointer-events-auto">
           {/* Route Tab with Loading Logic */}
           <div className="relative">
              {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-violet-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl animate-in fade-in slide-in-from-bottom-2 z-50">
                  {t.loadingTooltip}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-600 rotate-45" />
                </div>
              )}
              <button 
                onClick={() => setActiveTab('route')} 
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative ${
                  isLoading 
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' 
                    : activeTab === 'route' 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                      : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {isLoading && (
                  <div className="absolute inset-0 border-2 border-white/30 rounded-full animate-spin border-t-white" />
                )}
                <RouteIcon size={20} className={isLoading ? "animate-pulse" : ""} />
              </button>
           </div>

           <button onClick={() => setActiveTab('home')} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeTab === 'home' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110' : 'text-slate-400 hover:text-slate-600'}`}><Compass size={24} /></button>
           <button onClick={() => setActiveTab('library')} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeTab === 'library' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600'}`}><LibraryIcon size={20} /></button>
           <button onClick={() => setActiveTab('profile')} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600'}`}><UserIcon size={20} /></button>
        </nav>
      )}
    </div>
  );
};

export default App;