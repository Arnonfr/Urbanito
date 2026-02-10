/**
 * 🚨 CRITICAL: READ DOCS/CORE/DESIGN_GUIDELINES.MD BEFORE EDITING 🚨
 * This file is the core navigation hub. Strict UI rules apply (8px/12px rounding).
 * iOS Compatibility: Ensure all new features work with Capacitor.
 * See: docs/core/IOS_STRATEGY.md
 */
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Compass, Loader2, Route as RouteIcon, Library as LibraryIcon, User as UserIcon, X, Navigation, MapPin, ListTodo, Plus, Heart, Target as TargetIcon, Trash2, CheckCircle, MapPinned, Search, LocateFixed, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight, BookOpen, Key, Eye, Check, AlertCircle, Crosshair, Bookmark, Globe, Settings2, Sliders, ChevronDown, ChevronUp, History, Map as MapIcon, Timer, SearchCode, Maximize2, Layers, Signpost, ArrowDownCircle, Send, Edit3, Crown
} from 'lucide-react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { UserPreferences, Route as RouteType, POI } from './types';


import { generateWalkingRoute, generateStreetWalkRoute, fetchExtendedPoiDetails, enrichRoute } from './services/geminiService';
import { SuspenseLoader } from '~components/SuspenseLoader/SuspenseLoader';
import { LocalGuidesSection } from '~components/LocalGuidesSection';

import { lazyRetry } from './utils/lazyRetry';

const PreferencesPanel = lazyRetry(() => import('~components/PreferencesPanel').then(module => ({ default: module.PreferencesPanel })), "PreferencesPanel");
const UnifiedPoiCard = lazyRetry(() => import('~components/UnifiedPoiCard').then(module => ({ default: module.UnifiedPoiCard })), "UnifiedPoiCard");
const RouteOverview = lazyRetry(() => import('~components/RouteOverview').then(module => ({ default: module.RouteOverview })), "RouteOverview");
const QuickRouteSetup = lazyRetry(() => import('~components/QuickRouteSetup').then(module => ({ default: module.QuickRouteSetup })), "QuickRouteSetup");
import { NavigationDock } from '~components/NavigationDock';
const GoogleImage = lazyRetry(() => import('~components/GoogleImage').then(module => ({ default: module.GoogleImage })), "GoogleImage");
const RouteSkeleton = lazyRetry(() => import('~components/RouteSkeleton').then(module => ({ default: module.RouteSkeleton })), "RouteSkeleton");
const UserGuide = lazyRetry(() => import('~components/UserGuide').then(module => ({ default: module.UserGuide })), "UserGuide");
const VoiceGuideManager = lazyRetry(() => import('~components/VoiceGuideManager').then(module => ({ default: module.VoiceGuideManager })), "VoiceGuideManager");
import { AnimatedCompass } from '~components/AnimatedCompass';
import { CreationMenu } from '~components/CreationMenu';
const Research = lazy(() => import('./pages/Research'));
import { GlobalAudioPlayer } from '~components/GlobalAudioPlayer';
import { RadarView } from '~components/RadarView';
import { CommandCenterPage } from './features/command-center/pages/CommandCenterPage';
import { PremiumProfileSection } from '~components/PremiumProfileSection';
import { DevTestingPanel } from '~components/DevTestingPanel';
import { RouteReadyOverlay } from '~components/RouteReadyOverlay';
import { useWalkMode } from './contexts/WalkModeContext';
import { useGeolocation } from '~hooks/useGeolocation';
import { useNearbyRoutes } from '~features/routes/hooks/useNearbyRoutes';
import { AudioProvider } from './contexts/AudioContext';
import { PremiumProvider, usePremium } from './contexts/PremiumContext';
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
  getRouteById,
  getCachedPoiDetails,
  getUserPreferences,
  saveUserPreferences,
  normalize,
  logUsage,
  saveToCuratedRoutes,
  getAllRecentRoutes,
  getSavedPoisFromSupabase,
  savePoiToSupabase,
  deletePoiFromSupabase,
  forkRoute,
  cityCache,
  globalCache
} from './services/supabase';

import { nativeBridge } from './utils/nativeBridge';
import { ImpactStyle } from '@capacitor/haptics';


// google is declared globally in types/globals.d.ts

const PARIS_COORDS = { lat: 48.8566, lng: 2.3522 };

const FALLBACK_CITIES = [
  { id: 'f1', name: 'ירושלים', name_en: 'Jerusalem', lat: 31.7683, lng: 35.2137, img_url: 'https://images.unsplash.com/photo-1542666281-9958e32c32ee?w=800&q=80' },
  { id: 'f2', name: 'חדרה', name_en: 'Hadera', lat: 32.4340, lng: 34.9207, img_url: 'https://images.unsplash.com/photo-1628151474248-18567675f928?w=800&q=80' },
  { id: 'f3', name: 'תל אביב', name_en: 'Tel Aviv', lat: 32.0853, lng: 34.7818, img_url: 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?w=800&q=80' },
  { id: 'f4', name: 'פריז', name_en: 'Paris', lat: 48.8566, lng: 2.3522, img_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80' },
  { id: 'f5', name: 'לונדון', name_en: 'London', lat: 51.5074, lng: -0.1278, img_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80' },
  { id: 'f6', name: 'ברצלונה', name_en: 'Barcelona', lat: 41.3851, lng: 2.1734, img_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80' },
  { id: 'f7', name: 'ברלין', name_en: 'Berlin', lat: 52.5200, lng: 13.4050, img_url: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80' },
  { id: 'f8', name: 'רומא', name_en: 'Rome', lat: 41.9028, lng: 12.4964, img_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80' },
  { id: 'f9', name: 'ניו יורק', name_en: 'New York', lat: 40.7128, lng: -74.0060, img_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80' }
];

const CATEGORY_FILTERS = [
  // { id: 'all', he: 'הכל', en: 'All', icon: <Globe size={14} /> }, // Optional 'All' button, or just deselect
  { id: 'europe', he: 'אירופה', en: 'Europe', icon: '🇪🇺' },
  { id: 'asia', he: 'אסיה והמזה״ת', en: 'Asia', icon: '🌏' },
  { id: 'urban', he: 'אורבני', en: 'Urban', icon: '🏙️' },
  { id: 'exotic', he: 'אקזוטי', en: 'Exotic', icon: '🏝️' },
];

const getCityCategories = (city: any) => {
  const name = (city.name_en || city.name).toLowerCase();
  const cats = new Set(['urban']); // Default all to urban

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

import { extractStandardCity } from '~utils/geocoding';

export const RouteTravelIcon = ({ className = "", animated = true }: { className?: string, animated?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 11.3137 20 8" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" className={animated ? "climbing-path" : ""} />
    <circle r="3" fill="#6366F1" className={animated ? "climbing-dot" : ""} />
  </svg>
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const locationPath = useLocation();
  const isResearchMode = locationPath.pathname === '/research';

  const [user, setUser] = useState<any>(undefined);
  const [preferences, setPreferences] = useState<UserPreferences>({
    hiddenGemsLevel: 30, interests: ['היסטוריה'], walkingDistance: 3, desiredPoiCount: 5, language: 'he', explanationStyle: 'standard', religiousFriendly: true
  });

  if (isResearchMode) {
    return (
      <>
        <Suspense fallback={<SuspenseLoader />}>
          <Routes>
            <Route path="/research" element={<Research />} />
          </Routes>
        </Suspense>

        {/* Global Dev Panel - Accessible from any route */}
        <DevTestingPanel user={user} />
      </>
    );
  }

  const { isPremium } = usePremium();
  const [openRoutes, setOpenRoutes] = useState<RouteType[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const [areTabsExpanded, setAreTabsExpanded] = useState(false);
  const [generatingRouteIds, setGeneratingRouteIds] = useState<Set<string>>(new Set());

  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [showRouteReady, setShowRouteReady] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [showGeneratingTooltip, setShowGeneratingTooltip] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCity, setViewingCity] = useState<string | null>(null);
  const [viewingCityData, setViewingCityData] = useState<any>(null);
  const [citySpecificRoutes, setCitySpecificRoutes] = useState<RouteType[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [recentGlobalRoutes, setRecentGlobalRoutes] = useState<RouteType[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [savedPois, setSavedPois] = useState<any[]>([]);
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<string | null>(null);
  const citiesScrollRef = useRef<HTMLDivElement>(null);
  const [isCarouselDragging, setIsCarouselDragging] = useState(false);
  const carouselDragStartX = useRef(0);
  const carouselDragStartScrollLeft = useRef(0);

  const hasDragged = useRef(false);
  const [isPeekMapMode, setIsPeekMapMode] = useState(false);


  // Clean helper just in case it's called elsewhere (though we used separate refs now)
  const clearOverviewMarkers = () => { /* No-op or clear unused ref */ };

  const [popularCities, setPopularCities] = useState<any[]>(FALLBACK_CITIES);
  const [isLoadingCityRoutes, setIsLoadingCityRoutes] = useState(false);
  const [generatingSuggestionId, setGeneratingSuggestionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const activeTab = locationPath.pathname.split('/')[1] || 'navigation';
  const setActiveTab = (tab: string) => navigate(tab === 'navigation' ? '/' : `/${tab}`);

  const { location, isLocating, locateUser, setLocation } = useGeolocation();
  const [streetConfirmData, setStreetConfirmData] = useState<{ city: string, street: string, type: 'area' | 'street' } | null>(null);
  const [isConfirmPrefsExpanded, setIsConfirmPrefsExpanded] = useState(false);
  const [dynamicRadius, setDynamicRadius] = useState<number>(3);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const isTypingLocation = useRef(false);

  // Use the new hook for nearby routes
  const { isSearching: isSearchingNearby, searchNearby } = useNearbyRoutes();
  const { toggleWalkMode, isWalkModeActive } = useWalkMode();

  const isHe = preferences.language === 'he';
  const currentRoute = openRoutes[activeRouteIndex] || null;
  const isGeneratingActive = currentRoute ? generatingRouteIds.has(currentRoute.id) : false;

  const isCurrentRouteSaved = currentRoute && savedRoutes.some(r =>
    normalize(r.route_data.name) === normalize(currentRoute.name) &&
    normalize(r.route_data.city) === normalize(currentRoute.city)
  );

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

  // Dedicated refs for the "City Header Map"
  const cityMapContainerRef = useRef<HTMLDivElement>(null);
  const cityMapInstance = useRef<any>(null);
  const cityMapMarkers = useRef<any[]>([]);
  useEffect(() => {
    streetConfirmDataRef.current = streetConfirmData;
  }, [streetConfirmData]);

  // @Supabase Agent: Auto-Hydration for Sparse Routes
  // Triggers when a route is active but missing content or translations
  useEffect(() => {
    if (!currentRoute || !user?.id) return;
    if (generatingRouteIds.has(currentRoute.id)) return; // Already working

    // Heuristic: Is it sparse?
    const isHe = preferences.language === 'he';
    const missingHeTitle = isHe && !((currentRoute as any).preferences?.names?.he || (currentRoute as any).name_he);
    // Fix: If description exists, it's valid enough. Don't force re-generation for historicalContext.
    const isSparse = currentRoute.pois.length > 0 && currentRoute.pois.slice(0, 2).some(p =>
      !p.isFullyLoaded &&
      !p.historicalContext &&
      !p.description &&
      !(p as any).data?.historicalAnalysis
    );

    if ((missingHeTitle || isSparse) && !isGeocoding) {
      console.log(`[Auto-Hydrate] Detected sparse route: ${currentRoute.id}. Missing: ${missingHeTitle ? 'HE_Title' : ''} ${isSparse ? 'Content' : ''}`);

      // Removed annoying toast and UI blocking state (setGeneratingRouteIds)
      // This allows enrichment to happen in the background without locking the UI or confusing the user

      // Use a timeout wrapper to ensure the UI never gets stuck on a spinner, even if AI hangs
      const safeEnrich = async () => {
        try {
          const enriched = await Promise.race([
            enrichRoute(currentRoute, preferences, isPremium),
            new Promise<RouteType>((resolve) => setTimeout(() => {
              console.warn("[Auto-Hydrate] Enrichment timed out - forcing UI unlock");
              resolve({
                ...currentRoute,
                pois: currentRoute.pois.map(p => ({ ...p, isFullyLoaded: true }))
              });
            }, 8000)) // 8s max wait
          ]);

          // Update Local State
          setOpenRoutes(prev => prev.map(r => r.id === currentRoute.id ? enriched : r));

          // Only update in Supabase if this route was already saved by the user OR if the user is the creator.
          // This prevents creating duplicate entries or zombie data, but allows creators to "repair" their own broken routes.
          const isAlreadySaved = savedRoutes.some(r =>
            normalize(r.route_data.name) === normalize(currentRoute.name) &&
            normalize(r.route_data.city) === normalize(currentRoute.city)
          );
          const isCreator = currentRoute.creator === user?.id;

          if ((isAlreadySaved || isCreator) && user?.id) {
            // We save it once to DB so it persists in Recent Global too. 
            // Preserve is_favorite status if it was already saved, otherwise false.
            await saveRouteToSupabase(user.id, enriched, { ...enriched.preferences, is_favorite: isAlreadySaved }, false, enriched.parent_route_id);
            console.log(`[Auto-Hydrate] Updated route in DB (Saved/Creator): ${enriched.name}`);
          } else {
            console.log(`[Auto-Hydrate] Enriched route (local only): ${enriched.name}`);
          }
        } catch (err) {
          console.error("[Auto-Hydrate] Failed:", err);
        }
      };

      safeEnrich();
    }

  }, [currentRoute?.id]);

  // Handle City Overview Map Logic (Header Map)
  useEffect(() => {
    // Only run if we are in "Map Mode" and the container exists
    if (!isPeekMapMode || !cityMapContainerRef.current) return;

    const initHeaderMap = async () => {
      // Determine coordinates: prefer viewingCityData, fallback to global list, then Geocoding
      let lat = viewingCityData?.lat;
      let lng = viewingCityData?.lng;

      if ((!lat || !lng) && viewingCity) {
        const fallback = FALLBACK_CITIES.find(c => c.name === viewingCity || c.name_en === viewingCity);
        if (fallback) { lat = fallback.lat; lng = fallback.lng; }
      }

      // Try Geocoding if still missing (real-world fallback)
      if ((!lat || !lng) && viewingCity && window.google?.maps?.Geocoder) {
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ address: viewingCity });
          if (result.results[0]?.geometry?.location) {
            lat = result.results[0].geometry.location.lat();
            lng = result.results[0].geometry.location.lng();
          }
        } catch (e) { console.warn("Geocoding failed for city preview", e); }
      }

      // Final fallback to Paris
      if (!lat || !lng) { lat = 48.8566; lng = 2.3522; }

      if (!cityMapInstance.current) {
        cityMapInstance.current = new google.maps.Map(cityMapContainerRef.current, {
          center: { lat, lng },
          zoom: 14, // Significant zoom in
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "landscape", stylers: [{ saturation: -100 }, { lightness: 65 }, { visibility: "on" }] }
          ]
        });
      } else {
        // Just recenter if reused
        cityMapInstance.current.setCenter({ lat, lng });
        google.maps.event.trigger(cityMapInstance.current, 'resize');
      }

      // Clear old markers
      cityMapMarkers.current.forEach(m => m.setMap(null));
      cityMapMarkers.current = [];

      const routesToShow = citySpecificRoutes.filter(r => {
        if (!librarySearchQuery) return true;
        const q = librarySearchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      });

      routesToShow.forEach((route, idx) => {
        if (!route.pois || route.pois.length === 0) return;
        const startPoi = route.pois[0];
        if (!startPoi.lat || !startPoi.lng) return;

        const marker = new google.maps.Marker({
          position: { lat: startPoi.lat, lng: startPoi.lng },
          map: cityMapInstance.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5, // Smaller, cleaner dot
            fillColor: "#4F46E5",
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          title: route.name
        });

        marker.addListener('click', () => handleLoadSavedRoute(route.city, route));
        cityMapMarkers.current.push(marker);
      });

      // Show User Location if available
      if (location) {
        // Simple check: is user roughly in the same region? (within ~50km)
        // Just adding it to the map is enough, if it's far it behaves like Google Maps
        const userMarker = new google.maps.Marker({
          position: location,
          map: cityMapInstance.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#0EA5E9", // Sky Blue for user
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          zIndex: 999,
          title: isHe ? "המיקום שלך" : "Your Location"
        });

        // Add a pulsing effect (outer circle)
        const pulse = new google.maps.Marker({
          position: location,
          map: cityMapInstance.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#0EA5E9",
            fillOpacity: 0.2,
            strokeWeight: 0,
          },
          zIndex: 998,
          clickable: false
        });

        cityMapMarkers.current.push(userMarker);
        cityMapMarkers.current.push(pulse);
      }

    };

    initHeaderMap();

  }, [isPeekMapMode, viewingCityData, viewingCity, citySpecificRoutes, librarySearchQuery, location]);

  // Clean up map instance when exiting map mode
  useEffect(() => {
    if (!isPeekMapMode && cityMapInstance.current) {
      cityMapInstance.current = null;
    }
  }, [isPeekMapMode]);





  const refreshSavedContent = async (userId: string) => {
    try {
      // Clean duplicates first (runs once, then returns cached results)
      const { cleanDuplicateRoutes } = await import('./services/cleanDuplicates');
      const deletedCount = await cleanDuplicateRoutes(userId);
      if (deletedCount > 0) {
        console.log(`[refreshSavedContent] Cleaned ${deletedCount} duplicate routes`);
        // Refresh global routes too since duplicates might be public
        loadGlobalContent();
      }

      const routesPromise = getSavedRoutesFromSupabase(userId);
      const poisPromise = getSavedPoisFromSupabase(userId);
      const [routes, pois] = await Promise.all([routesPromise, poisPromise]);
      // Deduplicate routes by ID just in case
      const uniqueRoutes = routes ? Array.from(new Map(routes.map(item => [item['id'], item])).values()) : [];
      setSavedRoutes(uniqueRoutes);
      setSavedPois(pois || []);
    } catch (err) {
      setSavedRoutes([]);
      setSavedPois([]);
    }
  };

  const lastLibraryRefresh = useRef(0);
  const isLoadingGlobal = useRef(false);
  const loadGlobalContent = async () => {
    if (isLoadingGlobal.current) return;
    isLoadingGlobal.current = true;
    try {
      console.log('🔄 loadGlobalContent: Fetching...');
      const global = await getAllRecentRoutes(30, user?.id);

      // 1. Load and Validate Local Routes
      let localRoutes: RouteType[] = [];
      try {
        const rawLocal = JSON.parse(localStorage.getItem('urbanito_local_routes') || '[]');
        // Filter out garbage: must have ID, Name, City, and Content
        // Also remove "Stuck" routes: created > 24h ago and NOT in global (orphaned drafts)
        const now = Date.now();
        const globalIds = new Set((global || []).map(g => g.id));

        localRoutes = rawLocal.filter((r: RouteType) => {
          if (!r.id || !r.name || !r.city) return false;
          if (!r.pois || r.pois.length === 0) return false;

          const created = new Date(r.created_at || 0).getTime();
          // Keep if recent (< 24h) OR if it exists in global (synced)
          if ((now - created) > 86400000 && !globalIds.has(r.id)) return false;

          return true;
        });

        // Update storage if we cleaned anything (fixes "stuck" elements)
        if (localRoutes.length !== rawLocal.length) {
          console.log(`🧹 Cleaned ${rawLocal.length - localRoutes.length} invalid/stuck local routes`);
          localStorage.setItem('urbanito_local_routes', JSON.stringify(localRoutes));
        }
      } catch (e) {
        console.error("Failed to parse local routes", e);
      }

      // 2. Robust Merge Strategy
      // Start with Global (Truth)
      const uniqueRoutes = [...(global || [])];
      const globalKeyMap = new Set(uniqueRoutes.map(r =>
        `${normalize(r.city)}:${normalize(r.name)}`.toLowerCase()
      ));
      const globalIdMap = new Set(uniqueRoutes.map(r => r.id));

      // Merge Local: Only add if truly unique
      localRoutes.forEach(local => {
        // If exact ID match exists, skip (Global wins)
        if (globalIdMap.has(local.id)) return;

        // If Name+City match exists AND local is temporary ID -> Skip (Assume Global is the synced UUID version)
        // If local is UUID (persistent) but different ID -> Keep (It's a different route with same name)
        const key = `${normalize(local.city)}:${normalize(local.name)}`.toLowerCase();
        const isTemp = local.id.startsWith('gen-') || local.id.startsWith('r-');

        if (globalKeyMap.has(key) && isTemp) return;

        // Otherwise add unique local route
        uniqueRoutes.push(local);
      });

      setRecentGlobalRoutes(uniqueRoutes);
    } catch (err) {
      console.error("❌ Failed to load global routes:", err);
      // Fallback: show local routes
      try {
        const local = JSON.parse(localStorage.getItem('urbanito_local_routes') || '[]');
        setRecentGlobalRoutes(local);
      } catch (e) { }
    } finally {
      isLoadingGlobal.current = false;
    }
  };

  // Refresh library content when navigating to library tab
  useEffect(() => {
    if (activeTab === 'library') {
      const now = Date.now();
      // Only refresh if empty or 1 minute has passed
      if (recentGlobalRoutes.length === 0 || (now - lastLibraryRefresh.current > 60000)) {
        console.log('Navigated to library - refreshing content');
        loadGlobalContent();
        if (user?.id) refreshSavedContent(user.id);
        lastLibraryRefresh.current = now;
      }
    }
  }, [activeTab, user?.id]);

  // IMMEDIATE LOAD: Load local routes on mount to ensure they are visible ASAP
  useEffect(() => {
    try {
      const localRoutes = JSON.parse(localStorage.getItem('urbanito_local_routes') || '[]');
      if (localRoutes.length > 0) {
        console.log('📂 Loaded local routes on mount:', localRoutes.length);
        setRecentGlobalRoutes(prev => {
          // Merge to avoid duplicates if network already loaded something (unlikely on mount)
          const combined = [...localRoutes, ...prev];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique;
        });
      }
    } catch (e) {
      console.error("Failed to load local routes on mount", e);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
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
    locateUser(
      (pos) => {
        if (googleMap.current) {
          googleMap.current.panTo(pos);
          googleMap.current.setZoom(16);
        }
      },
      () => {
        if (!panOnly) {
          showToast(isHe ? "לא ניתן לגשת למיקום שלך, עוברים לפריז" : "Unable to access location, going to Paris", "error");
        }
        if (googleMap.current) {
          googleMap.current.panTo(PARIS_COORDS);
        }
        setLocation(PARIS_COORDS);
      }
    );
  };

  const handleFindNearbyRoutes = async () => {
    if (!googleMap.current) return;
    setIsAiMenuOpen(false);

    const mapCenter = {
      lat: googleMap.current.getCenter()?.lat() || 0,
      lng: googleMap.current.getCenter()?.lng() || 0
    };

    console.log("[handleFindNearbyRoutes] Searching at map center:", mapCenter);

    // We search at map center directly now, fulfilling the user request: 
    // "environment where the map is located, not where I am"
    const routes = await searchNearby(mapCenter.lat, mapCenter.lng);

    if (routes.length > 0) {
      // Filter primarily by distance to avoid "World View" zoom
      // 1. Try to find routes within 15km (True Local)
      let relevantRoutes = routes.filter((r: any) => (r.dist || Infinity) < 15000);

      // 2. If none, try 30km (Regional)
      if (relevantRoutes.length === 0) {
        relevantRoutes = routes.filter((r: any) => (r.dist || Infinity) < 30000);
      }

      // 3. Fallback: If still none, assume "Remote" but only if we really found something valid (distance check in searchNearby handles the 100km limit)
      // Since we added 100km limit in useNearbyRoutes, we shouldn't get "Europe" results if we are in Israel.

      if (relevantRoutes.length === 0) {
        // If we are here, it means we found routes within 100km but not within 30km.
        // Still show them as they are better than nothing.
        relevantRoutes = routes.slice(0, 5);
      }

      renderNearbyMarkersOnMap(relevantRoutes);

      const firstPoi = relevantRoutes[0]?.pois?.[0];
      if (firstPoi) {
        // Just pan to first, don't bound spread-out remote routes
        googleMap.current.panTo({ lat: firstPoi.lat, lng: firstPoi.lng });
        googleMap.current.setZoom(13);
      } else if (relevantRoutes.length > 0) {
        // Fit bounds for local routes, but with a sanity check on zoom
        const bounds = new google.maps.LatLngBounds();
        let validPoints = 0;

        relevantRoutes.forEach((r: any) => {
          if (r.pois && r.pois[0] && Math.abs(r.pois[0].lat) > 0.1) {
            bounds.extend(new google.maps.LatLng(r.pois[0].lat, r.pois[0].lng));
            validPoints++;
          }
        });

        if (location) {
          bounds.extend(new google.maps.LatLng(location.lat, location.lng));
          validPoints++;
        }

        if (validPoints > 0) {
          googleMap.current.fitBounds(bounds);
          // Safety: Don't zoom out too much. If fitBounds goes to level 5 (continent), zoom back in.
          const listener = google.maps.event.addListener(googleMap.current, 'idle', () => {
            if (googleMap.current && googleMap.current.getZoom()! < 11) {
              googleMap.current.setZoom(11);
            }
            google.maps.event.removeListener(listener);
          });
        }
      }

      const isRemoteEnabled = false; // Legacy logic
      if (!isRemoteEnabled) {
        showToast(isHe ? `מצאנו ${relevantRoutes.length} מסלולים קרובים!` : `Found ${relevantRoutes.length} nearby tours!`);
      }
    } else {
      showToast(isHe ? "לא נמצאו מסלולים קרובים" : "No nearby tours found", "error");
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

    // Clear existing circle if any
    if (selectionCircle.current) selectionCircle.current.setMap(null);

    setActiveTab('navigation');
    setSelectedPoi(null);
    setIsCardExpanded(false);
    setIsAiMenuOpen(false);

    if (type === 'area') {
      const initialRadius = preferences.walkingDistance || 3;
      setDynamicRadius(initialRadius);

      const centerPosition = location ?
        new google.maps.LatLng(location.lat, location.lng) :
        googleMap.current.getCenter();

      // Move map to the center position first
      googleMap.current.panTo(centerPosition);



      googleMap.current.setZoom(14); // Slightly tighter zoom for better context

      // The selection circle represents the search area. 
      // A 3km walk usually stays within a ~700m-1km radius of the center.
      selectionCircle.current = new google.maps.Circle({
        strokeColor: "#6366F1",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#6366F1",
        fillOpacity: 0.15,
        map: googleMap.current,
        center: centerPosition,
        radius: (initialRadius * 1000) / 4, // Visual circle is 1/4 of total walking distance to feel "right"
        clickable: false,
        zIndex: 9500
      });
    }

    // Get street/city info for the center position
    const center = type === 'area' && location ?
      new google.maps.LatLng(location.lat, location.lng) :
      googleMap.current.getCenter();

    getStreetAtPosition(center, (data) => {
      setStreetConfirmData({ type, city: data.city, street: type === 'street' ? data.street : "" });
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
        // Better zoom logic: if it looks like a specific address (street_address), zoom in more. If locality, zoom 13-14.
        const isPrecise = results[0].types.includes('street_address') || results[0].types.includes('point_of_interest');
        googleMap.current.setZoom(isPrecise ? 17 : 14);
        setSearchQuery(results[0].formatted_address);
        searchInputRef.current?.blur(); // Dismiss keyboard
      } else {
        showToast(isHe ? "לא מצאנו את המיקום הזה" : "Location not found", "error");
      }
    });
  };

  const handleCitySelect = async (city: any) => {
    console.log('[handleCitySelect] Starting for city:', city.name);
    setViewingCity(city.name);
    setViewingCityData(city);
    setIsLoadingCityRoutes(true);

    try {
      console.log('[handleCitySelect] Fetching routes...');
      const routes = await getRoutesByCityHub(city.name, city.name_en);
      console.log('[handleCitySelect] Routes fetched:', routes?.length || 0);
      setCitySpecificRoutes(routes || []);

      // Generate suggestions if we have fewer than 20 routes
      if ((routes?.length || 0) < 20) {
        const suggestions = generateCitySuggestions(city, routes?.length || 0);
        setCitySuggestions(suggestions);
      } else {
        setCitySuggestions([]);
      }
    } catch (err) {
      console.error('[handleCitySelect] Error:', err);
      setCitySpecificRoutes([]);
      setCitySuggestions([]);
      showToast?.(isHe ? 'שגיאה בטעינת מסלולים' : 'Error loading routes', 'error');
    } finally {
      setIsLoadingCityRoutes(false);
    }

    // Scroll to top
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  };

  const generateCitySuggestions = (city: any, existingCount: number) => {
    const needed = Math.max(0, 20 - existingCount);
    const themes = [
      { id: 'historic', nameHe: 'מסלול היסטורי', nameEn: 'Historic Tour', icon: '🏛️' },
      { id: 'food', nameHe: 'מסלול קולינרי', nameEn: 'Food Tour', icon: '🍽️' },
      { id: 'art', nameHe: 'מסלול אמנות', nameEn: 'Art Tour', icon: '🎨' },
      { id: 'architecture', nameHe: 'מסלול ארכיטקטורה', nameEn: 'Architecture Tour', icon: '🏗️' },
      { id: 'nature', nameHe: 'מסלול טבע', nameEn: 'Nature Tour', icon: '🌳' },
      { id: 'nightlife', nameHe: 'מסלול חיי לילה', nameEn: 'Nightlife Tour', icon: '🌙' },
      { id: 'shopping', nameHe: 'מסלול קניות', nameEn: 'Shopping Tour', icon: '🛍️' },
      { id: 'religious', nameHe: 'מסלול דתי', nameEn: 'Religious Sites Tour', icon: '🕌' },
      { id: 'modern', nameHe: 'מסלול מודרני', nameEn: 'Modern Tour', icon: '🏙️' },
      { id: 'romantic', nameHe: 'מסלול רומנטי', nameEn: 'Romantic Tour', icon: '💕' },
    ];

    return themes.slice(0, needed).map(theme => ({
      id: `suggestion-${city.id}-${theme.id}`,
      cityName: city.name,
      cityNameEn: city.name_en,
      theme: theme.id,
      nameHe: theme.nameHe,
      nameEn: theme.nameEn,
      icon: theme.icon,
      isSuggestion: true
    }));
  };

  const handleGenerateSuggestion = async (suggestion: any) => {
    setGeneratingSuggestionId(suggestion.id);

    try {
      // Get city center coordinates
      const geocoder = new google.maps.Geocoder();
      const result = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ address: suggestion.cityNameEn || suggestion.cityName }, (results: any, status: string) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error('Geocoding failed'));
          }
        });
      });

      const pos = {
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng()
      };

      // Generate route with theme-specific preferences
      const themePrefs = {
        ...preferences,
        interests: [suggestion.nameHe],
        walkingDistance: 3,
        desiredPoiCount: 5
      };

      const route = await generateWalkingRoute(
        suggestion.cityName,
        pos,
        themePrefs,
        suggestion.theme,
        user?.id
      );

      if (route) {
        // Calculate distances between POIs
        const routeWithDistances = await calculateRouteDistances(route);

        // Save to database
        await saveToCuratedRoutes(routeWithDistances, suggestion.theme);

        // Load the route
        handleLoadSavedRoute(routeWithDistances.city, routeWithDistances);

        // Refresh city routes
        if (viewingCityData) {
          handleCitySelect(viewingCityData);
        }

        showToast(isHe ? 'המסלול נוצר בהצלחה!' : 'Tour created successfully!');
      }
    } catch (err) {
      console.error('Failed to generate suggestion:', err);
      showToast(isHe ? 'שגיאה ביצירת המסלול' : 'Error creating tour', 'error');
    } finally {
      setGeneratingSuggestionId(null);
    }
  };

  const handleGuidePostClick = async (post: any) => {
    // Navigate to map and focus on the POI
    if (post.poi_data) {
      // Close library/city view
      setViewingCity(null);
      setActiveTab('navigation');

      // Center map
      if (post.poi_data.lat && post.poi_data.lng && googleMap.current) {
        googleMap.current.panTo({ lat: post.poi_data.lat, lng: post.poi_data.lng });
        googleMap.current.setZoom(17);
      }

      // Set search query to show context
      setSearchQuery(post.poi_data.name);

      // Create a temporary POI object to show in the UI
      const tempPoi = {
        id: `guide-${post.id}`,
        name: post.poi_data.name,
        lat: post.poi_data.lat,
        lng: post.poi_data.lng,
        description: post.content_text,
        imageUrl: post.media_url,
        summary: `Recommended by ${post.guide?.name}`,
        category: 'history', // Default or extracted from tags
        isFullyLoaded: true
      };

      setSelectedPoi(tempPoi as any);
      setIsCardExpanded(true);
    } else {
      // Fallback: just search for the place
      setViewingCity(null);
      setActiveTab('navigation');
      setSearchQuery(`${post.city} ${post.content_text.substring(0, 20)}`);
      handleManualSearch();
    }
  };

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user ?? null;
        setUser(u);

        // Fetch Metadata for known cities (curated list)
        const { data: cityMetadata } = await supabase
          .from('popular_cities')
          .select('*')
          .eq('is_active', true)
          .order('name_en', { ascending: true });

        if (cityMetadata && cityMetadata.length > 0) {
          // Rank Logic: Instead of fetching ALL routes (heavy!), we pin the user's favorites 
          // and use the curated order from the DB.
          const pinnedNames = ['Tel Aviv', 'Jerusalem'];
          const topCities = cityMetadata.filter(c => pinnedNames.includes(c.name_en) || pinnedNames.includes(c.name));
          const otherCities = cityMetadata.filter(c => !topCities.some(tc => tc.id === c.id));

          let finalCities = [...topCities, ...otherCities];

          // Ensure Berlin is there as per requirement
          const berlin = FALLBACK_CITIES.find(c => c.name_en === 'Berlin');
          if (berlin && !finalCities.some(c => c.name_en === 'Berlin')) {
            finalCities.push(berlin);
          }

          setPopularCities(finalCities);
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
        setPopularCities(FALLBACK_CITIES);
      }
    };

    initApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      // Only load global content on sign in/out or the very first time.
      // event === 'INITIAL_SESSION' is also fine.
      loadGlobalContent();

      if (u) {
        refreshSavedContent(u.id);
        const prefs = await getUserPreferences(u.id);
        if (prefs) setPreferences(prev => ({ ...prev, ...prefs }));
      } else if (event === 'SIGNED_OUT') {
        setSavedRoutes([]);
        setSavedPois([]);
      }
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  // Native Initialization & Back Button Handling
  useEffect(() => {
    // Style Status Bar
    nativeBridge.initStatusBar('#ffffff', true);

    // Handle Android hardware back button
    const cleanupBack = nativeBridge.onBackButton(() => {
      if (selectedPoi) {
        setSelectedPoi(null);
        setIsCardExpanded(false);
      } else if (isAiMenuOpen) {
        setIsAiMenuOpen(false);
      } else if (viewingCity) {
        setViewingCity(null);
        setViewingCityData(null);
      } else if (locationPath.pathname !== '/' && locationPath.pathname !== '/navigation') {
        navigate(-1);
      }
    });

    return () => cleanupBack();
  }, [selectedPoi, isAiMenuOpen, viewingCity, locationPath.pathname]);

  // Handle deep linking for routes
  useEffect(() => {
    const pathParts = locationPath.pathname.split('/');
    if (pathParts[1] === 'route' && pathParts[2]) {
      const routeId = pathParts[2];
      const isAlreadyOpen = openRoutes.find(r => r.id === routeId);

      if (!isAlreadyOpen) {
        const loadRoute = async () => {
          const route = await getRouteById(routeId);
          if (route) {
            handleLoadSavedRoute(route.city, route);
          } else {
            showToast(isHe ? "המסלול לא נמצא" : "Route not found", "error");
            navigate('/');
          }
        };
        loadRoute();
      }
    }
  }, [locationPath.pathname]);

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

      if (searchInputRef.current) {
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
      }

      googleMap.current.addListener('center_changed', () => {
        const center = googleMap.current.getCenter();
        const activeConfirm = streetConfirmDataRef.current;
        if (activeConfirm) {
          if (selectionCircle.current && activeConfirm.type === 'area') {
            selectionCircle.current.setCenter(center);
          }
          if (isTypingLocation.current) return;
          if (geocodeTimeoutRef.current) window.clearTimeout(geocodeTimeoutRef.current);
          geocodeTimeoutRef.current = window.setTimeout(() => {
            getStreetAtPosition(center, (data) => {
              setStreetConfirmData(prev => {
                if (!prev) return null;
                return { ...prev, city: data.city, street: prev.type === 'street' ? data.street : "" };
              });
            });
          }, 350);
        }
      });

      // Update radius when zoom changes (for area tours)
      googleMap.current.addListener('zoom_changed', () => {
        const activeConfirm = streetConfirmDataRef.current;
        if (activeConfirm && activeConfirm.type === 'area' && selectionCircle.current) {
          const zoom = googleMap.current.getZoom();
          // Calculate radius based on zoom level
          // Zoom 13 = 3km, Zoom 14 = 2km, Zoom 15 = 1km, Zoom 12 = 5km, Zoom 11 = 8km
          let newRadius = 3; // default 3km
          if (zoom >= 15) newRadius = 1;
          else if (zoom >= 14) newRadius = 2;
          else if (zoom >= 13) newRadius = 3;
          else if (zoom >= 12) newRadius = 5;
          else newRadius = 8;

          setDynamicRadius(newRadius);
          selectionCircle.current.setRadius(newRadius * 1000); // Convert km to meters
        }
      });
    }
  }, []);

  // Sync Map with Location State changes (e.g. from "Maximize" button or Search)
  useEffect(() => {
    if (location && googleMap.current) {
      googleMap.current.panTo(new google.maps.LatLng(location.lat, location.lng));
      // Only zoom if fairly zoomed out? modifying zoom might be annoying if user is interacting.
      // But for "Go to City", we usually want a restart.
      // Let's check current zoom.
      // If we just navigated to a city, we likely want Zoom 14 or 15.
      const currentZoom = googleMap.current.getZoom();
      if (currentZoom < 13) googleMap.current.setZoom(14);
    }
  }, [location]);

  const calculateRouteDistances = async (route: RouteType): Promise<RouteType> => {
    if (!route.pois || route.pois.length < 2) return route;

    try {
      // Check if we already have travel data for all POIs (to save Google API costs)
      const allHaveData = route.pois.slice(1).every(p => p.travelFromPrevious?.distance && p.travelFromPrevious?.duration);
      if (allHaveData) {
        console.log("🚀 Skipping Distance Matrix API - estimates already provided by AI");
        return route;
      }

      const service = new google.maps.DistanceMatrixService();
      const updatedPois = [...route.pois];

      for (let i = 1; i < updatedPois.length; i++) {
        // Skip if this POI already has specific data from Gemini
        if (updatedPois[i].travelFromPrevious) continue;

        const origin = new google.maps.LatLng(updatedPois[i - 1].lat, updatedPois[i - 1].lng);
        const destination = new google.maps.LatLng(updatedPois[i].lat, updatedPois[i].lng);

        try {
          const result = await new Promise<any>((resolve, reject) => {
            service.getDistanceMatrix(
              {
                origins: [origin],
                destinations: [destination],
                travelMode: google.maps.TravelMode.WALKING,
              },
              (response: any, status: string) => {
                if (status === 'OK' && response?.rows[0]?.elements[0]) {
                  resolve(response.rows[0].elements[0]);
                } else {
                  reject(new Error('Distance calculation failed'));
                }
              }
            );
          });

          if (result.status === 'OK') {
            updatedPois[i] = {
              ...updatedPois[i],
              travelFromPrevious: {
                distance: result.distance.text,
                duration: result.duration.text
              }
            };
          }
        } catch (err) {
          console.warn(`Failed to calculate distance for POI ${i}:`, err);
        }
      }

      return { ...route, pois: updatedPois };
    } catch (err) {
      console.error('Error calculating route distances:', err);
      return route;
    }
  };

  const handlePoiDataLoaded = (routeId: string, poiId: string, data: any) => {
    setOpenRoutes(prev => prev.map(route => {
      if (route.id !== routeId) return route;
      return {
        ...route,
        pois: route.pois.map(p => {
          if (p.id !== poiId) return p;
          return { ...p, ...data, isFullyLoaded: true, isLoading: false };
        })
      };
    }));

    // Also update selectedPoi if it's the one being modified
    setSelectedPoi(prev => {
      if (prev && prev.id === poiId) {
        return { ...prev, ...data, isFullyLoaded: true, isLoading: false };
      }
      return prev;
    });
  };

  const enrichPoi = async (routeId: string, poi: POI, routeCity: string, userPrefs: UserPreferences) => {
    if (poi.isFullyLoaded || poi.isLoading) return;

    // Mark as loading
    setOpenRoutes(prev => prev.map(r => {
      if (r.id !== routeId) return r;
      return {
        ...r,
        pois: r.pois.map(p => p.id === poi.id ? { ...p, isLoading: true } : p)
      };
    }));

    try {
      const data = await fetchExtendedPoiDetails(poi.name, routeCity, userPrefs, poi.lat, poi.lng);
      if (data) {
        handlePoiDataLoaded(routeId, poi.id, data);
        // Save enriched POI to DB
        if (user) {
          // We might want to update the route in DB or save the POI details separately
          // For now, caching is handled in fetchExtendedPoiDetails (supabase cache)
        }
      } else {
        // Failed or empty, unset loading properly to allow retry? Or just leave it.
        // Let's reset loading so it can be retried if needed
        setOpenRoutes(prev => prev.map(r => {
          if (r.id !== routeId) return r;
          return {
            ...r,
            pois: r.pois.map(p => p.id === poi.id ? { ...p, isLoading: false } : p)
          };
        }));
      }
    } catch (e) {
      console.error("Enrichment failed", e);
      setOpenRoutes(prev => prev.map(r => {
        if (r.id !== routeId) return r;
        return {
          ...r,
          pois: r.pois.map(p => p.id === poi.id ? { ...p, isLoading: false } : p)
        };
      }));
    }
  };

  // Effect to pre-fetch next stops when a POI is selected
  useEffect(() => {
    if (!selectedPoi || !currentRoute) return;

    const currentIndex = currentRoute.pois.findIndex(p => p.id === selectedPoi.id);
    if (currentIndex === -1) return;

    // Enrich current
    enrichPoi(currentRoute.id, currentRoute.pois[currentIndex], currentRoute.city, preferences);

    // Enrich next 2
    const next1 = currentRoute.pois[currentIndex + 1];
    if (next1) enrichPoi(currentRoute.id, next1, currentRoute.city, preferences);

    const next2 = currentRoute.pois[currentIndex + 2];
    if (next2) enrichPoi(currentRoute.id, next2, currentRoute.city, preferences);

  }, [selectedPoi?.id]); // Trigger when selected POI changes

  // Effect to handle Map View based on selection (Route Overview vs Single POI)
  useEffect(() => {
    if (!googleMap.current) return;

    if (selectedPoi) {
      // Focus on specific POI
      const pos = { lat: selectedPoi.lat, lng: selectedPoi.lng };
      googleMap.current.panTo(pos);
      googleMap.current.setZoom(17);

      // Shift map view down by 200px (moving the content UP) so the POI is visible above the bottom sheet
      // We use a small timeout to let the panTo start/finish smoothly
      setTimeout(() => {
        if (googleMap.current) {
          googleMap.current.panBy(0, 200);
        }
      }, 400);

    } else {
      // Reset view to full route
      if (currentRoute && activeTab === 'route' && !isGeneratingActive) {
        const bounds = new google.maps.LatLngBounds();
        const validPois = currentRoute.pois.filter(p => p.lat && p.lng && (p.lat !== 0 || p.lng !== 0));

        if (validPois.length > 0) {
          if (validPois.length === 1) {
            googleMap.current.setCenter({ lat: validPois[0].lat, lng: validPois[0].lng });
            googleMap.current.setZoom(16);
          } else {
            validPois.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
            googleMap.current.fitBounds(bounds);
            // Clamp zoom if fitBounds goes too crazy (rare but possible with very close points)
            const listener = google.maps.event.addListenerOnce(googleMap.current, "idle", () => {
              if (googleMap.current.getZoom() > 18) googleMap.current.setZoom(18);
            });
          }
        } else {
          showToast(isHe ? "לא נמצאו מסלולים בקרבת מקום (100 ק\"מ)" : "No routes found nearby (100km)", "error");
        }
      }
    }
  }, [selectedPoi, activeTab]); // Re-run when selection changes or tab changes

  const handleActionCreateRoute = async () => {
    // 1. Fork/Update existing route logic
    if (!streetConfirmData && currentRoute && activeTab === 'route') {
      const parentRoute = currentRoute;
      const finalPrefs = preferences;

      // Do NOT set generatingRouteIds or ShowGeneratingTooltip to avoid blocking UI with a full-screen skeleton.
      // The "Update" button in RouteOverview will handle its own loading state via 'isRegenerating' prop passed down.
      // NOTE: We need to pass the regeneration state down to RouteOverview. 
      // Currently, RouteOverview receives `isRegenerating` which might be tied to `generatingRouteIds`.
      // To fix this properly, we should rely on a local loading state in this function if the architecture allows, 
      // or simply rely on the fact that existing route is visible while we await.

      // Let's rely on the fact that the caller will set the button to loading state.
      // But we must NOT set the global `setGeneratingRouteIds` if that triggers the Skeleton overlay.

      try {
        const startLoc = parentRoute.pois[0] ? { lat: parentRoute.pois[0].lat, lng: parentRoute.pois[0].lng } : { lat: PARIS_COORDS.lat, lng: PARIS_COORDS.lng };

        const newRoute = await generateWalkingRoute(parentRoute.city, startLoc, finalPrefs, "general", user?.id);

        if (newRoute) {
          const routeWithDistances = await calculateRouteDistances(newRoute);
          const validatedRoute = {
            ...routeWithDistances,
            parent_route_id: parentRoute.id,
            originalPoiCount: routeWithDistances.pois.length
          };

          if (user) {
            const forked = await forkRoute(user.id, parentRoute, validatedRoute, true); // Update is Public
            if (forked) {
              validatedRoute.id = forked.id;
            }
          }

          setOpenRoutes(prev => prev.map(r => r.id === parentRoute.id ? validatedRoute : r));
          renderRouteMarkers(validatedRoute);
          showToast(isHe ? 'המסלול עודכן בהצלחה!' : 'Route updated successfully!', 'success');

          if (validatedRoute.pois.length > 0) {
            enrichPoi(validatedRoute.id, validatedRoute.pois[0], validatedRoute.city, finalPrefs);
          }
        }
      } catch (e) {
        console.error("Update failed:", e);
        showToast(isHe ? 'שגיאה בעדכון המסלול' : 'Failed to update route', 'error');
      }

      return;
    }

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
    // DON'T navigate to route tab yet - let user stay on map and see the tooltip
    // setActiveTab('route'); // REMOVED - will navigate after route is ready (line 760)
    setIsAiMenuOpen(false);
    setShowGeneratingTooltip(true);

    const center = googleMap.current.getCenter();
    const pos = { lat: center.lat(), lng: center.lng() };
    const finalPrefs = { ...preferences, walkingDistance: dynamicRadius };

    setStreetConfirmData(null);
    setTimeout(() => setShowGeneratingTooltip(false), 3000);

    try {
      // DUPLICATE CHECK: If "Area Tour" (City level), check if we already have a generic tour for this city.
      if (mode === 'area') {
        // Helper to check if route matches language
        const matchesLanguage = (r: RouteType) => {
          const firstPoiName = r.pois?.[0]?.name || r.name || '';
          const hasHebrewChars = /[\u0590-\u05FF]/.test(firstPoiName);
          return preferences.language === 'he' ? hasHebrewChars : !hasHebrewChars;
        };

        // First check local list for speed
        let existingRoute = recentGlobalRoutes.find(r =>
          (normalize(r.city) === normalize(finalCity) || (r.city && normalize(r.city).includes(normalize(finalCity)))) &&
          r.pois.length > 0 &&
          matchesLanguage(r)
        );

        // If not in local list, check the database hub with language filter
        if (!existingRoute) {
          console.log("Checking DB for existing route for city:", finalCity, "language:", preferences.language);
          const cityRoutes = await getRoutesByCityHub(finalCity, undefined, preferences.language);
          if (cityRoutes && cityRoutes.length > 0) {
            existingRoute = cityRoutes[0]; // Take the most recent/curated one
          }
        }

        if (existingRoute) {
          console.log("Found existing route for city, loading instead of generating:", existingRoute.id);
          showToast(isHe ? 'נמצא מסלול קיים בעיר, טוען...' : 'Found existing tour, loading...', 'success');

          // Mimic loading logic
          setOpenRoutes(prev => prev.filter(r => r.id !== tempId)); // Remove placeholder
          handleLoadSavedRoute(existingRoute.city, existingRoute);
          setGeneratingRouteIds(prev => { const next = new Set(prev); next.delete(tempId); return next; });
          setIsAiMenuOpen(false);
          setShowGeneratingTooltip(false);
          return;
        }
      }

      const route = mode === 'street'
        ? await generateStreetWalkRoute(`${finalStreet}, ${finalCity}`, pos, finalPrefs, user?.id)
        : await generateWalkingRoute(finalCity, pos, finalPrefs, "general", user?.id);

      if (route) {
        // Calculate distances between POIs
        const routeWithDistances = await calculateRouteDistances(route);
        const validatedRoute = {
          ...routeWithDistances,
          id: tempId,
          city: finalCity,
          name: mode === 'street' ? finalStreet : routeWithDistances.name,
          originalPoiCount: routeWithDistances.pois.length
        };
        setOpenRoutes(prev => prev.map(r => r.id === tempId ? validatedRoute : r));
        setGeneratingRouteIds(prev => { const next = new Set(prev); next.delete(tempId); return next; });

        setActiveTab('route');
        showToast(isHe ? 'המסלול שלך מוכן!' : 'Your tour is ready!', 'success');
        setShowRouteReady(true); // Trigger celebration overlay

        renderRouteMarkers(validatedRoute);
        logUsage(user?.id || null, finalCity);

        // Optimistic UI Update: Show it immediately in the "Recent Routes" list
        setRecentGlobalRoutes(prev => [validatedRoute, ...prev]);

        // 1. SAVE LOCALLY FIRST (Critical for data safety)
        try {
          const localRoutes = JSON.parse(localStorage.getItem('urbanito_local_routes') || '[]');
          const updatedLocalRoutes = [validatedRoute, ...localRoutes.filter((r: any) => r.id !== validatedRoute.id)].slice(0, 50);
          localStorage.setItem('urbanito_local_routes', JSON.stringify(updatedLocalRoutes));
          console.log("💾 Route saved locally:", validatedRoute.name);
        } catch (e) {
          console.error("Local save failed:", e);
        }

        // 2. Try to save to server in background
        saveToCuratedRoutes(validatedRoute).then(res => {
          if (res?.error) {
            console.warn("Background save failed (likely Guest RLS/Rate Limit), but route is active locally:", res.error);
            showToast(isHe ? "המסלול נוצר אך שמירה לשרת נכשלה. הוא נשמר מקומית." : "Route created, but server sync failed. It is saved locally.", "error");
          } else if (res?.data && res.data[0]?.id) {
            // CRITICAL: Update the persistent ID to prevent duplicates!
            const finalId = res.data[0].id;
            console.log("✅ Route saved to server with ID:", finalId);

            // Update open routes with the real ID
            setOpenRoutes(prev => prev.map(r => r.id === tempId ? { ...r, id: finalId } : r));

            // Update local storage to use the persistent ID
            try {
              const localRoutes = JSON.parse(localStorage.getItem('urbanito_local_routes') || '[]');
              const updatedLocalRoutes = localRoutes.map((r: any) =>
                r.id === tempId ? { ...r, id: finalId } : r
              );
              localStorage.setItem('urbanito_local_routes', JSON.stringify(updatedLocalRoutes));
            } catch (e) {
              console.error("Local ID sync failed:", e);
            }

            // Now reload - the deduplication by ID in loadGlobalContent will handle it.
            loadGlobalContent();
          }
        }).catch(e => console.error("Save crashed:", e));

        // Trigger enrichment for the first POI immediately
        if (validatedRoute.pois.length > 0) {
          enrichPoi(validatedRoute.id, validatedRoute.pois[0], validatedRoute.city, finalPrefs);
          // And maybe the second one too, why not?
          if (validatedRoute.pois[1]) enrichPoi(validatedRoute.id, validatedRoute.pois[1], validatedRoute.city, finalPrefs);
        }

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
    const routeWithMeta = { ...route, originalPoiCount: route.pois.length };
    setOpenRoutes(prev => {
      const existingIdx = prev.findIndex(r => normalize(r.name) === normalize(route.name) && normalize(r.city) === normalize(route.city));
      if (existingIdx !== -1) { setActiveRouteIndex(existingIdx); return prev; }
      setActiveRouteIndex(prev.length);
      return [...prev, routeWithMeta];
    });
    renderRouteMarkers(routeWithMeta);
    setActiveTab('route');
    setIsAiMenuOpen(false);
    setIsCardExpanded(false);
    setStreetConfirmData(null);
    setViewingCity(null);
    if (route.id) navigate(`/route/${route.id}`);

  };

  const handleSaveRoute = async () => {
    if (!currentRoute) return;
    if (!user) {
      showToast(isHe ? 'יש להתחבר כדי לשמור מסלולים' : 'Please login to save routes', 'error');
      setActiveTab('profile');
      return;
    }

    try {
      if (isCurrentRouteSaved) {
        // Try finding by ID first
        let savedEntry = savedRoutes.find(r => r.id === currentRoute.id);

        // If not found by ID, find by Name+City logic (which is what drives the UI state isCurrentRouteSaved)
        if (!savedEntry) {
          savedEntry = savedRoutes.find(r =>
            normalize(r.route_data.name) === normalize(currentRoute.name) &&
            normalize(r.route_data.city) === normalize(currentRoute.city)
          );
        }

        if (savedEntry) {
          await deleteRouteFromSupabase(savedEntry.id, user.id);
          nativeBridge.hapticImpact(ImpactStyle.Medium);
          showToast(isHe ? 'המסלול הוסר מהמועדפים' : 'Route removed from favorites');
        } else {
          // Fallback if ID mismatch but logic says saved
          await deleteRouteFromSupabase(currentRoute.id, user.id);
          nativeBridge.hapticImpact(ImpactStyle.Medium);
          showToast(isHe ? 'המסלול הוסר מהמועדפים' : 'Route removed from favorites');
        }
      } else {
        // Check for content modification (Wiki Logic)
        // If POIs changed -> Public Fork (updates Main Route)
        // If only Prefs -> Private Save (Personal)
        const isContentModified = currentRoute.originalPoiCount !== undefined &&
          currentRoute.pois.length !== currentRoute.originalPoiCount;

        const saved = await saveRouteToSupabase(
          user.id,
          currentRoute,
          { ...preferences, is_favorite: true }, // Explicitly marked as favorite when clicking heart
          isContentModified, // Public if modified
          currentRoute.id // Parent is current ID
        );

        if (saved) {
          nativeBridge.hapticSuccess();
          nativeBridge.showNotification(
            isHe ? 'מסלול נשמר!' : 'Route Saved!',
            isHe ? `המסלול "${currentRoute.name}" נוסף למועדפים שלך.` : `"${currentRoute.name}" has been added to your favorites.`
          );
          showToast(isHe ? 'המסלול נשמר בהצלחה!' : 'Route saved successfully!');

          // Update local route ID to match the new forked ID
          const newId = (saved as any).id || (saved as any).routeId;

          if (newId && newId !== currentRoute.id) {
            setOpenRoutes(prev => prev.map(r => {
              if (r.id === currentRoute.id) return { ...r, id: newId, originalPoiCount: r.pois.length };
              return r;
            }));
          }
        } else {
          console.error("Save failed: saveRouteToSupabase returned null/false.");
          showToast(isHe ? 'שגיאה בשמירת המסלול' : 'Error saving route', 'error');
        }
      }
      // Wait a moment for DB propagation then refresh
      setTimeout(() => {
        refreshSavedContent(user.id);
        // Force invalidate the city cache to reflect the new state in hubs
        if (currentRoute?.city) {
          cityCache.invalidatePattern(`city-hub-${normalize(currentRoute.city)}`);
        }
      }, 100);
    } catch (err) {
      showToast(isHe ? 'שגיאה בפעולה' : 'Action failed', 'error');
    }
  };


  const handleTogglePoiSave = async (poi: POI) => {
    if (!user) {
      showToast(isHe ? 'יש להתחבר כדי לשמור מקומות' : 'Please login to save places', 'error');
      return;
    }
    const isSaved = savedPois.some(p => p.id === poi.id);
    if (isSaved) {
      await deletePoiFromSupabase(poi.id, user.id);
      showToast(isHe ? 'המקום הוסר מהשמורים' : 'Place removed from saved');
    } else {
      await savePoiToSupabase(user.id, poi);
      showToast(isHe ? 'המקום נשמר!' : 'Place saved!');
    }
    refreshSavedContent(user.id);
  };



  // Update map selection circle when radius preference changes
  useEffect(() => {
    if (selectionCircle.current && streetConfirmData?.type === 'area') {
      const radiusInMeters = (preferences.walkingDistance * 1000) / 4; // Half of the selected walking distance
      selectionCircle.current.setRadius(radiusInMeters);
      setDynamicRadius(preferences.walkingDistance);
    }
  }, [preferences.walkingDistance, streetConfirmData?.type]);

  const handleAddPoi = async (poi: POI) => {
    if (!currentRoute) return;

    // Add the POI to the end of the current route
    setOpenRoutes(prev => prev.map(route => {
      if (route.id !== currentRoute.id) return route;

      return {
        ...route,
        pois: [...route.pois, poi]
      };
    }));

    // Enrich the newly added POI
    enrichPoi(currentRoute.id, poi, currentRoute.city, preferences);

    // Re-render markers to include the new POI
    const updatedRoute = { ...currentRoute, pois: [...currentRoute.pois, poi] };
    renderRouteMarkers(updatedRoute);

    showToast(isHe ? 'התחנה נוספה למסלול!' : 'Stop added to route!');
  };


  const renderRouteMarkers = (route: RouteType) => {
    clearMarkers();
    clearPreviewMarkers();
    clearOverviewMarkers(); // Ensure overview markers are gone when loading a route
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
    if (route.directionsData) {
      console.log("🚀 Using cached directions for:", route.name);
      directionsRenderer.current.setDirections(route.directionsData);
    } else {
      console.log("📍 Fetching new directions for:", route.name);
      const directionsService = new google.maps.DirectionsService();
      directionsService.route({
        origin: { lat: route.pois[0].lat, lng: route.pois[0].lng },
        destination: { lat: route.pois[route.pois.length - 1].lat, lng: route.pois[route.pois.length - 1].lng },
        waypoints: route.pois.slice(1, -1).map(p => ({ location: { lat: p.lat, lng: p.lng }, stopover: true })),
        travelMode: google.maps.TravelMode.WALKING
      }, (res: any, status: string) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(res);

          // Cache in local state
          setOpenRoutes(prev => prev.map(r => {
            if (r.id === route.id) return { ...r, directionsData: res };
            return r;
          }));
        }
      });
    }
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
    // 3-col logic: map tabs to 0, 1, 2
    // Navigation -> 0
    // Library / Route -> 2 (since I put it last)
    // Plus -> 1 (Middle) - but Pulse is separate.
    // The grid is 3 cols.
    // Col 0: Navigation
    // Col 1: Middle (Plus)
    // Col 2: Route / Library

    // In LTR: 0% is left. 100% is middle. 200% is right.
    // In RTL: 0% is right. -100% is middle. -200% is left.

    let index = 0;
    if (activeTab === 'navigation') index = 0;
    else if (activeTab === 'route' || activeTab === 'library') index = 2;
    else index = 0; // Default to nav for safety

    return `translateX(${isHe ? (index * -100) : (index * 100)}%)`;
  };

  const handleCarouselMouseDown = (e: React.MouseEvent) => {
    isLoadingCityRoutes || setIsCarouselDragging(true); // Reusing logic kind of
    setIsCarouselDragging(true);
    hasDragged.current = false;
    carouselDragStartX.current = e.pageX;
    carouselDragStartScrollLeft.current = citiesScrollRef.current?.scrollLeft || 0;
  };

  const handleCarouselMouseMove = (e: React.MouseEvent) => {
    if (!isCarouselDragging || !citiesScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - carouselDragStartX.current) * 2; // scroll-fast
    citiesScrollRef.current.scrollLeft = carouselDragStartScrollLeft.current - walk;
    if (Math.abs(x - carouselDragStartX.current) > 5) {
      hasDragged.current = true;
    }
  };

  const handleCarouselMouseUp = () => {
    setIsCarouselDragging(false);
  };

  const handleCarouselMouseLeave = () => {
    setIsCarouselDragging(false);
  };

  const handleCloseRoute = (idx: number) => {
    const next = openRoutes.filter((_, i) => i !== idx);
    setOpenRoutes(next);
    if (activeRouteIndex >= idx) setActiveRouteIndex(Math.max(0, activeRouteIndex - 1));
  };

  const isCardOpen = selectedPoi !== null || (activeTab === 'route' && currentRoute !== null);

  return (
    <AudioProvider>
      <div className="h-[100dvh] w-full flex flex-col relative bg-white overflow-hidden" dir={isHe ? 'rtl' : 'ltr'}>
        <style>{`.liquid-indicator { transition: transform 0.4s cubic-bezier(0.68, -0.6, 0.32, 1.6); width: 33.33%; display: flex; justify-content: center; align-items: center; pointer-events: none; } .indicator-pill { width: 50%; height: 80%; background-color: #6366F1; border-radius: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); } .crosshair-container { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 9000; display: flex; flex-direction: column; align-items: center; transition: top 0.5s ease-in-out; } .crosshair-container.shifted { top: 65%; } .gen-tooltip { position: absolute; bottom: calc(100px + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); background: #0F172A; color: white; padding: 12px 24px; border-radius: 8px; font-size: 11px; font-medium: 500; z-index: 5000; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 12px; animation: in-out 0.3s ease-out; } @keyframes in-out { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } } .bottom-nav-safe { padding-bottom: env(safe-area-inset-bottom, 16px); min-height: calc(64px + env(safe-area-inset-bottom, 0px)); } .top-safe-area { padding-top: env(safe-area-inset-top, 24px); }`}</style>



        <Suspense fallback={null}>
          {showOnboarding && <UserGuide isHe={isHe} onClose={() => { setShowOnboarding(false); localStorage.setItem('urbanito_onboarding_v2', 'true'); }} />}
        </Suspense>
        {toast && <div className={`fixed top-[calc(env(safe-area-inset-top)+12px)] left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 rounded-[12px] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 ${toast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}><CheckCircle size={18} /><span className="text-sm font-medium whitespace-nowrap">{toast.message}</span></div>}
        {showGeneratingTooltip && <div className="gen-tooltip"><RouteTravelIcon className="w-6 h-6" /><span className="font-normal">{isHe ? 'המסלול בבנייה...' : 'Preparing route...'}</span></div>}
        {isSearchingNearby && <div className="fixed inset-0 z-[8000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center"><div className="bg-white p-8 rounded-[8px] shadow-2xl flex flex-col items-center gap-4"><Loader2 size={40} className="animate-spin text-indigo-500" /><p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{isHe ? 'מחפש מסלולים בסביבה...' : 'Searching nearby...'}</p></div></div>}

        {/* Route Tabs - REMOVED per user request (replaced by header carousel) */}
        {/* <RouteTabs ... /> */}


        <main className="flex-1 relative h-full">
          <div ref={mapRef} className="w-full h-full" />

          <Suspense fallback={<div className="absolute inset-0 z-[2000] flex items-center justify-center pointer-events-none"><SuspenseLoader isHe={isHe} /></div>}>
            <Routes>
              <Route path="/" element={
                <>
                  {streetConfirmData && !isAiMenuOpen && (
                    <>
                      <div className={`crosshair-container ${streetConfirmData.type === 'area' ? 'shifted' : ''}`}>
                        <div className="animate-in zoom-in duration-300 flex flex-col items-center mb-2">
                          {streetConfirmData.type === 'street' ? <MapPin size={28} className="text-[#6366F1] fill-indigo-100/50" strokeWidth={1.2} /> : <TargetIcon size={28} className="text-[#6366F1] animate-pulse" />}
                        </div>
                        <div className="pointer-events-auto animate-in slide-in-from-top-4 duration-500">
                          <div className="w-[300px] bg-white rounded-[8px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100/50 overflow-hidden flex flex-col">
                            <div className="p-5 pb-2">
                              <div className="flex justify-between items-start mb-4">
                                <div className="text-right flex-1 min-w-0">
                                  <h4 className="text-[9px] font-medium text-[#6366F1] uppercase tracking-[0.2em] mb-1">
                                    {streetConfirmData.type === 'street'
                                      ? (isHe ? 'מסלול רחוב - צור מסלול על רחוב ספיציפי' : 'Street Tour - Create a tour on a specific street')
                                      : (isHe ? 'מסלול איזורי (צור מסלול ברדיוס סביבך)' : 'Area Tour (Create a route in a radius around you)')}
                                  </h4>
                                  <div className="relative group">
                                    <input
                                      type="text"
                                      value={streetConfirmData.type === 'street' ? streetConfirmData.street : streetConfirmData.city}
                                      onFocus={() => { isTypingLocation.current = true; }}
                                      onBlur={() => {
                                        setTimeout(() => { isTypingLocation.current = false; }, 500);
                                      }}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setStreetConfirmData(prev => prev ? {
                                          ...prev,
                                          street: prev.type === 'street' ? val : "",
                                          city: prev.type === 'area' ? val : prev.city
                                        } : null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const val = (e.target as HTMLInputElement).value;
                                          const geocoder = new google.maps.Geocoder();
                                          setIsGeocoding(true);
                                          geocoder.geocode({ address: val }, (results: any, status: string) => {
                                            setIsGeocoding(false);
                                            if (status === 'OK' && results[0] && googleMap.current) {
                                              const pos = results[0].geometry.location;
                                              googleMap.current.panTo(pos);
                                              if (selectionCircle.current) selectionCircle.current.setCenter(pos);
                                            }
                                          });
                                        }
                                      }}
                                      className={`w-full text-lg font-bold text-slate-900 bg-slate-50 border-none rounded-[12px] px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 transition-all ${isGeocoding ? 'opacity-30' : 'opacity-100'}`}
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                                      <Edit3 size={14} />
                                    </div>
                                  </div>
                                  {streetConfirmData.type === 'area' && (
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium tracking-wide">
                                      {isHe ? 'רדיוס סיור:' : 'Radius:'} <span className="text-[#6366F1] font-medium">{dynamicRadius}km</span>
                                    </p>
                                  )}
                                </div>
                                <button onClick={() => { setStreetConfirmData(null); if (selectionCircle.current) { selectionCircle.current.setMap(null); selectionCircle.current = null; } }} className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors bg-slate-50 rounded-[8px]"><X size={16} /></button>
                              </div>
                              <button onClick={() => setIsConfirmPrefsExpanded(true)} className="w-full flex items-center justify-between py-2 text-[10px] font-medium text-slate-400 border-t border-slate-50 mt-1 hover:text-[#6366F1] transition-colors">
                                <span className="flex items-center gap-2"><Settings2 size={14} /> {isHe ? 'העדפות מסלול' : 'Route Preferences'}</span>
                                <ChevronUp size={14} className="rotate-90" />
                              </button>
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

                      {/* Full Screen Preferences Modal */}
                      {isConfirmPrefsExpanded && (
                        <div className="fixed inset-0 z-[9000] bg-white/60 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom duration-500">
                          <div className="p-6 pb-2 top-safe-area bg-white border-b border-slate-100 flex items-center justify-between shadow-sm relative z-10">
                            <button onClick={() => setIsConfirmPrefsExpanded(false)} className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                              <ChevronDown size={20} />
                            </button>
                            <h3 className="text-lg font-bold text-slate-800">{isHe ? 'העדפות מסלול' : 'Route Preferences'}</h3>
                            <div className="w-10" />
                          </div>
                          <div className="flex-1 overflow-y-auto p-6 pb-32 bg-white">
                            <div className="max-w-md mx-auto">
                              <Suspense fallback={<div className="p-4 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>}>
                                <QuickRouteSetup preferences={preferences} onUpdatePreferences={setPreferences} onGenerate={() => { }} onCancel={() => setIsConfirmPrefsExpanded(false)} isEmbedded={false} hideActionButton={true} />
                              </Suspense>
                            </div>
                          </div>
                          <div className="p-6 bg-white border-t border-slate-100 bottom-nav-safe">
                            <div className="max-w-md mx-auto">
                              <button onClick={() => setIsConfirmPrefsExpanded(false)} className="w-full py-4 bg-[#0F172A] text-white rounded-[16px] font-bold text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                                {isHe ? 'שמור וסגור' : 'Save & Close'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {!selectedPoi && !isAiMenuOpen && !streetConfirmData && (
                    <div className="absolute top-0 inset-x-0 z-[1000] p-4 pt-12 transform transition-all duration-300">
                      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 p-2 flex items-center gap-3">
                        <Search className="text-slate-400 ml-2" size={20} />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder={isHe ? "לאן מטיילים?" : "Where to?"}
                          className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-[15px] outline-none font-medium h-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                          dir={isHe ? "rtl" : "ltr"}
                        />
                        {searchQuery && (
                          <button
                            onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                            className="p-1 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100 transition-all"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <div className="w-px h-6 bg-slate-100 mx-1"></div>
                        <button
                          onClick={() => toggleTab('profile')}
                          className="w-9 h-9 rounded-[10px] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all overflow-hidden relative"
                        >
                          {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                          ) : (
                            <UserIcon size={18} />
                          )}

                          {/* Premium Indicator Badge */}
                          {isPremium && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                              <Crown size={8} className="text-white fill-white" />
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {!selectedPoi && (
                    <button onClick={() => handleLocateUser()} className={`absolute bottom-24 ${isHe ? 'left-6' : 'right-6'} z-[1000] w-12 h-12 bg-white rounded-[16px] shadow-2xl border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-all`}>
                      {isLocating ? <Loader2 size={20} className="animate-spin text-[#6366F1]" /> : <LocateFixed size={20} />}
                    </button>
                  )}
                </>
              } />


              <Route path="/route" element={
                <div className="absolute inset-0 z-[3000] pointer-events-none">
                  {currentRoute && (
                    <Suspense fallback={null}>
                      <VoiceGuideManager route={currentRoute} language={preferences.language} />
                    </Suspense>
                  )}
                  {/* Route tabs removed per user request */}

                  {/* DISABLED: This duplicate library block was causing cache issues.
                      Library is now only rendered at /library path.
                      See lines 2289+ for the actual library implementation. */}
                  {false && (
                    <div
                      key={viewingCity || 'library-main'}
                      className={`absolute inset-0 bg-slate-50 z-[3000] overflow-y-auto pb-32 animate-in slide-in-from-bottom duration-500 pointer-events-auto ${viewingCity ? 'p-0' : 'px-6'}`}
                    >
                      {(() => {
                        console.log('[Library Render] viewingCity:', viewingCity, 'citySpecificRoutes:', citySpecificRoutes?.length);
                        return null;
                      })()}
                      {!viewingCity && <div className="flex justify-between items-center mb-8 pt-4 mt-6 top-safe-area"><h2 className="text-3xl font-medium tracking-tight">{isHe ? 'ספריה' : 'Library'}</h2></div>}
                      {!viewingCity ? (
                        <div className="space-y-8">
                          {/* Library Header Stack */}
                          <div className="sticky top-0 -mx-6 px-6 bg-slate-50/95 backdrop-blur-md pt-4 pb-4 z-10 space-y-3 border-b border-slate-100/50">
                            {/* Search */}
                            <div className="relative shadow-sm rounded-[12px]">
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input
                                type="text"
                                value={librarySearchQuery}
                                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                                placeholder={isHe ? 'חיפוש עיר...' : 'Search city...'}
                                className="w-full bg-white border border-slate-200 rounded-[12px] py-3 pr-10 pl-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                              />
                            </div>

                            {/* Category Badges */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
                              <button
                                onClick={() => setSelectedLibraryCategory(null)}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1.5 ${!selectedLibraryCategory ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600'}`}
                              >
                                <Globe size={12} /> {isHe ? 'הכל' : 'All'}
                              </button>
                              {CATEGORY_FILTERS.map(cat => (
                                <button
                                  key={cat.id}
                                  onClick={() => setSelectedLibraryCategory(selectedLibraryCategory === cat.id ? null : cat.id)}
                                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1.5 ${selectedLibraryCategory === cat.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600'}`}
                                >
                                  <span>{cat.icon}</span>
                                  <span>{isHe ? cat.he : cat.en}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <section>
                            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <BookOpen size={12} className="text-[#6366F1]" /> {isHe ? 'ערים פופולריות' : 'Popular Cities'}
                            </h3>
                            <div
                              ref={citiesScrollRef}
                              className="flex overflow-x-auto snap-x scroll-pl-6 pb-4 -mx-6 px-6 gap-3 no-scrollbar"
                            >
                              {(popularCities && popularCities.length > 0 ? popularCities : FALLBACK_CITIES)
                                .filter(city => {
                                  // Filter by City Name
                                  const matchesSearch = !librarySearchQuery ||
                                    city.name.includes(librarySearchQuery) ||
                                    city.name_en?.toLowerCase().includes(librarySearchQuery.toLowerCase());

                                  // Filter by Routes content within the city (Deep Search) - Fixed per user request
                                  const cityRoutes = recentGlobalRoutes.filter(r => r.city === city.name || r.city === city.name_en);
                                  const hasMatchingRoute = !librarySearchQuery || cityRoutes.some(r =>
                                    (r.name && r.name.toLowerCase().includes(librarySearchQuery.toLowerCase())) ||
                                    (r.description && r.description.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                                  );

                                  const matchesCategory = !selectedLibraryCategory || getCityCategories(city).has(selectedLibraryCategory);

                                  return (matchesSearch || hasMatchingRoute) && matchesCategory;
                                })
                                .map(city => {
                                  // Calculate route count for this city
                                  const routeCount = recentGlobalRoutes.filter(r =>
                                    r.city === city.name ||
                                    r.city === city.name_en ||
                                    (r.city && city.name_en && r.city.toLowerCase() === city.name_en.toLowerCase())
                                  ).length;

                                  return (
                                    <button
                                      key={city.id}
                                      type="button"
                                      onClick={(e) => {
                                        console.log('City clicked:', city.name);
                                        handleCitySelect(city);
                                      }}
                                      className="group flex flex-col gap-2 shrink-0 w-[160px] snap-start text-right relative z-10 transition-transform active:scale-[0.98] focus:outline-none cursor-pointer"
                                    >
                                      {/* Removed pointer-events-none from here */}
                                      <div className="relative aspect-[4/5] overflow-hidden shadow-md group-hover:shadow-xl rounded-[24px] bg-slate-200 w-full transition-all duration-300 group-hover:-translate-y-1">
                                        <img
                                          src={city.img_url}
                                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                          alt={city.name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                                        {/* Route Count Badge */}
                                        {routeCount > 0 && (
                                          <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                            <MapPin size={8} className="fill-white" />
                                            {routeCount}
                                          </div>
                                        )}

                                        <div className="absolute bottom-4 right-4 left-4 text-right">
                                          <span className="text-white text-[18px] font-bold leading-none block drop-shadow-md mb-1">{city.name}</span>
                                          <span className="text-white/80 text-[11px] font-medium tracking-wide block font-serif italic">{city.name_en}</span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                            </div>
                            {/* Empty State for Search */}
                            {(popularCities && popularCities.length > 0 ? popularCities : FALLBACK_CITIES)
                              .filter(city => {
                                const matchesSearch = !librarySearchQuery || city.name.includes(librarySearchQuery) || city.name_en?.toLowerCase().includes(librarySearchQuery.toLowerCase());

                                const cityRoutes = recentGlobalRoutes.filter(r => r.city === city.name || r.city === city.name_en);
                                const hasMatchingRoute = !librarySearchQuery || cityRoutes.some(r =>
                                  (r.name && r.name.toLowerCase().includes(librarySearchQuery.toLowerCase())) ||
                                  (r.description && r.description.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                                );

                                const matchesCategory = !selectedLibraryCategory || getCityCategories(city).has(selectedLibraryCategory);
                                return (matchesSearch || hasMatchingRoute) && matchesCategory;
                              }).length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                  {isHe ? 'לא נמצאו ערים תואמות' : 'No matching cities found'}
                                </div>
                              )}
                          </section>

                          {recentGlobalRoutes.length > 0 && (
                            <section>
                              <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <History size={12} className="text-amber-500" /> {isHe ? 'מסלולים אחרונים בקהילה' : 'Recent Community Tours'}
                              </h3>
                              <div className="grid grid-cols-1 gap-3">
                                {recentGlobalRoutes.slice(0, 30).map((route, idx) => {
                                  // Resolve Localized Names
                                  const localizedName = (isHe && (route.preferences?.names?.he || (route as any).name_he)
                                    ? (route.preferences?.names?.he || (route as any).name_he)
                                    : route.name).replace(/✨/g, '').trim();

                                  // Get the original name (opposite language)
                                  const originalName = isHe
                                    ? route.name.replace(/✨/g, '').trim()
                                    : (route.preferences?.names?.he || (route as any).name_he || '').replace(/✨/g, '').trim();

                                  // Resolve Localized City Name
                                  const cityObj = popularCities.find(c =>
                                    c.name === route.city ||
                                    c.name_en === route.city ||
                                    (route.city && c.name_en && route.city.toLowerCase() === c.name_en.toLowerCase())
                                  );
                                  const localizedCity = isHe && cityObj ? cityObj.name : (cityObj?.name_en || route.city);

                                  // Parse title: "Long Description (Short Name)" -> use Short Name
                                  const parenMatch = localizedName.match(/(.*?)\s*\((.*?)\)/);
                                  const shortTitle = parenMatch ? parenMatch[2].trim() : localizedName;

                                  const originalParenMatch = originalName.match(/(.*?)\s*\((.*?)\)/);
                                  const shortOriginalTitle = originalParenMatch ? originalParenMatch[2].trim() : originalName;

                                  // Only show original if it's different from localized
                                  const showOriginal = originalName && shortOriginalTitle !== shortTitle;

                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => handleLoadSavedRoute(route.city, route)}
                                      className="w-full flex items-center gap-4 bg-white p-4 rounded-[12px] shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-[0.98] transition-all group"
                                      dir={isHe ? 'rtl' : 'ltr'}
                                    >
                                      <div className="w-20 h-20 rounded-[10px] overflow-hidden bg-slate-100 shrink-0 shadow-sm">
                                        <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
                                      </div>
                                      <div className="flex-1 min-w-0 text-right">
                                        <h4 className="text-[15px] font-semibold text-slate-900 truncate leading-tight mb-1" dir={isHe ? 'rtl' : 'ltr'}>
                                          {shortTitle}
                                        </h4>
                                        {showOriginal && (
                                          <p className="text-[11px] text-slate-400 truncate leading-tight" dir={!isHe ? 'rtl' : 'ltr'}>
                                            {shortOriginalTitle}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-col items-center gap-1 shrink-0">
                                        <MapPin size={14} className="text-indigo-500" />
                                        <span className="text-[10px] font-medium text-indigo-600 whitespace-nowrap">{localizedCity}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </section>
                          )}
                        </div>
                      ) : (
                        <div className="animate-in slide-in-from-bottom duration-500 pb-20">
                          {/* Hero Section */}
                          {/* Hero Section - Static Image */}
                          <div className="relative w-full h-[320px] mb-6 shadow-2xl">
                            <div className="absolute inset-0 animate-in fade-in duration-500">
                              {viewingCityData?.img_url ? (
                                <img src={viewingCityData.img_url} className="w-full h-full object-cover" alt={viewingCity || undefined} />
                              ) : (
                                <GoogleImage query={`${viewingCity} landmark`} className="w-full h-full object-cover" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
                            </div>

                            <div className="absolute top-0 left-0 right-0 p-6 pt-16 flex justify-between items-start z-10">
                              <button onClick={() => setViewingCity(null)} className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/30 rounded-[12px] flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg">
                                <ArrowRight size={18} />
                              </button>
                            </div>

                            <div className="absolute bottom-8 right-6 left-6 text-right z-10">
                              <span className="text-indigo-300 font-bold uppercase tracking-[0.2em] text-[11px] mb-2 block animate-in slide-in-from-right duration-700 delay-100 drop-shadow-md">{isHe ? 'מדריך טיולים' : 'Travel Guide'}</span>
                              <h1 className="text-5xl font-bold text-white mb-1 drop-shadow-xl animate-in slide-in-from-bottom duration-700 delay-200">{viewingCity}</h1>
                              <p className="text-slate-200 text-sm font-medium animate-in fade-in duration-700 delay-300 drop-shadow-md">{viewingCityData?.name_en}</p>
                            </div>
                          </div>



                          {isLoadingCityRoutes ? (
                            <div className="flex flex-col items-center py-20 gap-4">
                              <Loader2 className="animate-spin text-indigo-500" />
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{isHe ? 'מחפש מסלולים פנומנליים...' : 'Searching Tours...'}</p>
                            </div>
                          ) : (
                            <div className="space-y-12 px-6">
                              {/* Local Guides Section - ARCHIVED FROM PRODUCTION (Experimental) */}
                              {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || localStorage.getItem('urbanito_debug_mode') === 'true') && (
                                <LocalGuidesSection city={viewingCity || ''} className="mb-8" onPostClick={handleGuidePostClick} />
                              )}

                              {/* Existing Routes */}
                              {citySpecificRoutes.length > 0 && (
                                <section>
                                  <div className="flex items-center gap-3 mb-4">
                                    <h4 className="text-[14px] font-bold text-slate-800">{isHe ? `מסלולים נבחרים` : `Curated Tours`}</h4>
                                    <div className="h-px bg-slate-100 flex-1" />

                                    <button
                                      onClick={() => setIsPeekMapMode(!isPeekMapMode)}
                                      className={`h-7 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${isPeekMapMode ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                      {isPeekMapMode ? (
                                        <span className="flex items-center gap-1.5"><MapIcon size={12} fill="currentColor" /> {isHe ? 'הסתר מפה' : 'Hide Map'}</span>
                                      ) : (
                                        <span className="flex items-center gap-1.5"><MapIcon size={12} /> {isHe ? 'הצג על מפה' : 'Show Map'}</span>
                                      )}
                                    </button>
                                  </div>

                                  {/* Integrated Map Container - Slides down when active */}
                                  <div className={`overflow-hidden transition-all duration-500 ease-in-out relative mb-4 ${isPeekMapMode ? 'h-[280px] opacity-100 rounded-[16px] shadow-sm border border-slate-100/50' : 'h-0 opacity-0'}`}>
                                    {isPeekMapMode && (
                                      <>
                                        <div ref={cityMapContainerRef} className="w-full h-full bg-slate-100" />
                                        <button
                                          onClick={() => {
                                            // Use the center of the current preview map as the target
                                            if (cityMapInstance.current) {
                                              const center = cityMapInstance.current.getCenter();
                                              if (center) {
                                                const lat = center.lat();
                                                const lng = center.lng();
                                                setLocation({ lat, lng });
                                                setSearchQuery(viewingCity || '');
                                                setViewingCity(null);
                                                window.scrollTo(0, 0);
                                                navigate('/');
                                              }
                                            } else if (viewingCityData?.lat && viewingCityData?.lng) {
                                              setLocation({ lat: viewingCityData.lat, lng: viewingCityData.lng });
                                              setSearchQuery(viewingCity || '');
                                              setViewingCity(null);
                                              window.scrollTo(0, 0);
                                              navigate('/');
                                            }
                                          }}
                                          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 transition-all z-10"
                                        >
                                          <Maximize2 size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    {citySpecificRoutes
                                      .filter(route => {
                                        if (!librarySearchQuery) return true;
                                        const q = librarySearchQuery.toLowerCase();
                                        return route.name.toLowerCase().includes(q) || (route.description && route.description.toLowerCase().includes(q));
                                      })
                                      .map((route, idx) => {
                                        // Resolve Localized Names
                                        const localizedName = (isHe && (route.preferences?.names?.he || (route as any).name_he)
                                          ? (route.preferences?.names?.he || (route as any).name_he)
                                          : route.name).replace(/✨/g, '').trim();

                                        // Get the original name (opposite language)
                                        const originalName = isHe
                                          ? route.name.replace(/✨/g, '').trim()
                                          : (route.preferences?.names?.he || (route as any).name_he || '').replace(/✨/g, '').trim();

                                        const localizedDescription = isHe && (route.preferences?.descriptions?.he || (route as any).description_he)
                                          ? (route.preferences?.descriptions?.he || (route as any).description_he)
                                          : route.description;

                                        // Parse titles
                                        const parenMatch = localizedName.match(/(.*?)\s*\((.*?)\)/);
                                        const shortTitle = parenMatch ? parenMatch[2].trim() : localizedName;

                                        const originalParenMatch = originalName.match(/(.*?)\s*\((.*?)\)/);
                                        const shortOriginalTitle = originalParenMatch ? originalParenMatch[2].trim() : originalName;

                                        // Only show original if different
                                        const showOriginal = originalName && shortOriginalTitle !== shortTitle;

                                        return (
                                          <button
                                            key={idx}
                                            onClick={() => handleLoadSavedRoute(route.city, route)}
                                            className="w-full flex items-center gap-4 bg-white p-4 rounded-[12px] shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-[0.98] transition-all text-right group"
                                          >
                                            <div className="w-20 h-20 rounded-[10px] overflow-hidden bg-slate-100 shrink-0 relative shadow-sm">
                                              <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
                                              {route.pois?.length > 0 && <div className="absolute bottom-1 right-1 bg-indigo-600/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[4px]">{route.pois.length} stops</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="text-[15px] font-semibold text-slate-900 truncate leading-tight mb-1">
                                                {shortTitle}
                                              </h4>
                                              {showOriginal && (
                                                <p className="text-[11px] text-slate-400 truncate leading-tight mb-1" dir={!isHe ? 'rtl' : 'ltr'}>
                                                  {shortOriginalTitle}
                                                </p>
                                              )}
                                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                                {localizedDescription || (isHe ? 'מסלול הליכה מרתק העובר בין הנקודות המרכזיות בעיר.' : 'A fascinating walking tour through the main points of the city.')}
                                              </p>
                                            </div>
                                          </button>
                                        );
                                      })}
                                  </div>
                                </section>
                              )}

                              {/* Suggested Routes */}
                              {citySuggestions.length > 0 && (
                                <section>
                                  <div className="flex items-center gap-3 mb-4">
                                    <Layers size={14} className="text-indigo-500" />
                                    <h4 className="text-[14px] font-bold text-slate-800">{isHe ? 'הצעות למסלולים' : 'Suggested Tours'}</h4>
                                    <div className="h-px bg-slate-100 flex-1" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    {citySuggestions.map((suggestion) => (
                                      <button
                                        key={suggestion.id}
                                        onClick={() => handleGenerateSuggestion(suggestion)}
                                        disabled={generatingSuggestionId === suggestion.id}
                                        className="flex flex-col gap-3 bg-gradient-to-br from-white to-slate-50 p-4 rounded-lg border border-slate-100 hover:border-indigo-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-center relative overflow-hidden group"
                                      >
                                        <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center text-2xl shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                                          {generatingSuggestionId === suggestion.id ? (
                                            <Loader2 size={24} className="animate-spin text-indigo-500" />
                                          ) : (
                                            suggestion.icon
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <h4 className="text-[13px] font-bold text-slate-900 truncate">
                                            {isHe ? suggestion.nameHe : suggestion.nameEn}
                                          </h4>
                                          <p className="text-[10px] text-indigo-500 font-medium mt-1">
                                            {generatingSuggestionId === suggestion.id
                                              ? (isHe ? 'בונה מסלול...' : 'Building...')
                                              : (isHe ? 'לחץ לבנייה' : 'Create')
                                            }
                                          </p>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </section>
                              )}

                              {citySpecificRoutes.length === 0 && citySuggestions.length === 0 && (
                                <div className="p-12 text-center text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                                  <p className="text-[11px] uppercase tracking-widest">{isHe ? 'אין עדיין מסלולים בעיר זו' : 'No tours for this city yet'}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`h-full ${isGeneratingActive || currentRoute ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                    {isGeneratingActive ? (
                      <div className="pointer-events-auto h-full"><RouteSkeleton isHe={isHe} /></div>
                    ) : currentRoute ? (
                      <div className={`pointer-events-none h-full transition-all duration-300 ${selectedPoi ? 'opacity-0 translate-y-20' : 'opacity-100'}`}>
                        <RouteOverview
                          route={currentRoute}
                          onPoiClick={setSelectedPoi}
                          onRemovePoi={() => { }}
                          onAddPoi={handleAddPoi}
                          onSave={handleSaveRoute}
                          preferences={preferences}
                          onUpdatePreferences={setPreferences}
                          onRequestRefine={() => { }}
                          user={user}
                          isSaved={isCurrentRouteSaved}
                          onClose={() => navigate('/library')}
                          isExpanded={isCardExpanded}
                          setIsExpanded={setIsCardExpanded}
                          onRegenerate={handleActionCreateRoute}
                          openRoutes={openRoutes}
                          activeRouteIndex={activeRouteIndex}
                          onSwitchRoute={(idx) => { setActiveRouteIndex(idx); renderRouteMarkers(openRoutes[idx]); }}
                          onCloseRoute={handleCloseRoute}
                          showToast={showToast}
                        />
                      </div>
                    ) : (
                      <div className="pointer-events-none h-full flex flex-col items-center justify-center p-12 text-center text-slate-400"></div>
                    )}
                  </div>
                </div>
              } />
              <Route path="/library" element={
                <div className="absolute inset-0 z-[3000] pointer-events-none">
                  <div key={viewingCity || 'library-main'} className={`absolute inset-0 bg-slate-50 z-[3000] overflow-y-auto pb-48 animate-in slide-in-from-bottom duration-500 pointer-events-auto ${viewingCity ? 'p-0' : 'px-6'}`}>
                    {!viewingCity && <div className="px-1">
                      <div className="flex justify-between items-center mb-8 pt-4 mt-6 top-safe-area">
                        <h2 className="text-3xl font-medium tracking-tight">{isHe ? 'ספריה' : 'Library'}</h2>
                      </div>
                      <div className="space-y-8">
                        {/* Library Header Stack */}
                        <div className="sticky top-0 -mx-6 px-6 bg-slate-50/95 backdrop-blur-md pt-4 pb-4 z-10 space-y-3 border-b border-slate-100/50">
                          {/* Search */}
                          <div className="relative shadow-sm rounded-[12px]">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                              type="text"
                              value={librarySearchQuery}
                              onChange={(e) => setLibrarySearchQuery(e.target.value)}
                              placeholder={isHe ? 'חיפוש ערים, מסלולים ומקומות...' : 'Search cities, routes & places...'}
                              className="w-full bg-white border border-slate-200 rounded-[12px] py-3 pr-10 pl-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                          </div>

                          {/* Category Badges */}
                          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
                            <button
                              onClick={() => setSelectedLibraryCategory(null)}
                              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1.5 ${!selectedLibraryCategory ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600'}`}
                            >
                              <Globe size={12} /> {isHe ? 'הכל' : 'All'}
                            </button>
                            {CATEGORY_FILTERS.map(cat => (
                              <button
                                key={cat.id}
                                onClick={() => setSelectedLibraryCategory(selectedLibraryCategory === cat.id ? null : cat.id)}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1.5 ${selectedLibraryCategory === cat.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600'}`}
                              >
                                <span>{cat.icon}</span>
                                <span>{isHe ? cat.he : cat.en}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Search Results - Show matching routes when searching */}
                        {librarySearchQuery.trim() && (() => {
                          const q = librarySearchQuery.toLowerCase();
                          const matchingRoutes = recentGlobalRoutes.filter(r =>
                            r.name?.toLowerCase().includes(q) ||
                            r.description?.toLowerCase().includes(q) ||
                            r.city?.toLowerCase().includes(q) ||
                            r.pois?.some((p: any) => p.name?.toLowerCase().includes(q))
                          ).slice(0, 10);

                          if (matchingRoutes.length === 0) return null;

                          return (
                            <section className="mb-4">
                              <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Search size={12} className="text-indigo-500" /> {isHe ? 'תוצאות חיפוש' : 'Search Results'}
                              </h3>
                              <div className="grid grid-cols-1 gap-2">
                                {matchingRoutes.map((route, idx) => {
                                  const localizedName = (isHe && (route.preferences?.names?.he || (route as any).name_he)
                                    ? (route.preferences?.names?.he || (route as any).name_he)
                                    : route.name).replace(/✨/g, '').trim();

                                  // Find matching POIs to show which ones matched
                                  const matchingPois = route.pois?.filter((p: any) => p.name?.toLowerCase().includes(q)) || [];

                                  return (
                                    <button
                                      key={route.id || idx}
                                      onClick={() => handleLoadSavedRoute(route.city, route)}
                                      className="w-full flex items-center gap-3 bg-white p-3 rounded-[12px] shadow-sm border border-indigo-100 hover:shadow-md hover:border-indigo-200 active:scale-[0.99] transition-all text-right"
                                    >
                                      <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-indigo-50 shrink-0 flex items-center justify-center">
                                        <MapPin size={20} className="text-indigo-400" />
                                      </div>
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-semibold text-slate-800 text-[13px] truncate">{localizedName}</span>
                                        <span className="text-[10px] text-slate-400 truncate">{route.city}</span>
                                        {matchingPois.length > 0 && (
                                          <span className="text-[9px] text-indigo-500 truncate mt-0.5">
                                            {isHe ? 'כולל:' : 'Includes:'} {matchingPois.map((p: any) => p.name).join(', ')}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-medium">
                                        <span>{route.pois?.length || 0}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </section>
                          );
                        })()}

                        <section>
                          <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <BookOpen size={12} className="text-[#6366F1]" /> {isHe ? 'ערים פופולריות' : 'Popular Cities'}
                          </h3>
                          <div
                            ref={citiesScrollRef}
                            className="flex overflow-x-auto snap-x scroll-pl-6 pb-4 -mx-6 px-6 gap-3 no-scrollbar cursor-grab active:cursor-grabbing"
                            onMouseDown={handleCarouselMouseDown}
                            onMouseMove={handleCarouselMouseMove}
                            onMouseUp={handleCarouselMouseUp}
                            onMouseLeave={handleCarouselMouseLeave}
                          >
                            {(popularCities && popularCities.length > 0 ? popularCities : FALLBACK_CITIES)
                              .filter(city => {
                                const matchesSearch = !librarySearchQuery ||
                                  city.name.includes(librarySearchQuery) ||
                                  city.name_en?.toLowerCase().includes(librarySearchQuery.toLowerCase());

                                const cityRoutes = recentGlobalRoutes.filter(r => r.city === city.name || r.city === city.name_en);
                                const hasMatchingRoute = !librarySearchQuery || cityRoutes.some(r =>
                                  (r.name && r.name.toLowerCase().includes(librarySearchQuery.toLowerCase())) ||
                                  (r.description && r.description.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                                );

                                const matchesCategory = !selectedLibraryCategory || getCityCategories(city).has(selectedLibraryCategory);
                                return (matchesSearch || hasMatchingRoute) && matchesCategory && city.img_url; // Filter out cities without images
                              })
                              .map(city => (
                                <button
                                  key={city.id}
                                  onClick={(e) => {
                                    if (hasDragged.current) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      return;
                                    }
                                    handleCitySelect(city);
                                    // Navigating to /route here forces the "Active Route" view if one exists.
                                    // We want to stay in the Library context to see the City View.
                                    // navigate('/route'); 
                                  }}
                                  className="group flex flex-col gap-2 shrink-0 w-[140px] snap-start text-right transition-transform active:scale-95"
                                >
                                  <div className="relative aspect-[3/4] overflow-hidden shadow-lg rounded-[16px] bg-slate-200 w-full">
                                    {city.img_url ? (
                                      <img
                                        src={city.img_url}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt={city.name}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          // Force parent to show fallback if possible, or just hide
                                        }}
                                      />
                                    ) : null}
                                    {(!city.img_url) && (
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
                          </div>
                        </section>

                        {recentGlobalRoutes.length > 0 && (
                          <section>
                            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <History size={12} className="text-amber-500" /> {isHe ? 'מסלולים אחרונים בקהילה' : 'Recent Community Tours'}
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                              {recentGlobalRoutes.slice(0, 30).map((route, idx) => {
                                const localizedName = (isHe && (route.preferences?.names?.he || (route as any).name_he)
                                  ? (route.preferences?.names?.he || (route as any).name_he)
                                  : route.name).replace(/✨/g, '').trim();

                                const cityObj = popularCities.find(c =>
                                  c.name === route.city ||
                                  c.name_en === route.city ||
                                  (route.city && c.name_en && route.city.toLowerCase() === c.name_en.toLowerCase())
                                );
                                const localizedCity = isHe && cityObj ? cityObj.name : (cityObj?.name_en || route.city);

                                const parenMatch = localizedName.match(/(.*?)\s*\((.*?)\)/);
                                const shortTitle = parenMatch ? parenMatch[2].trim() : localizedName;

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleLoadSavedRoute(route.city, route)}
                                    className="w-full flex items-center gap-4 bg-white p-3 rounded-[8px] shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
                                    dir={isHe ? 'rtl' : 'ltr'}
                                  >
                                    <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-slate-100 shrink-0">
                                      <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col items-start gap-0.5 min-w-0" dir={isHe ? 'rtl' : 'ltr'}>
                                        <span className="text-[10px] uppercase font-bold text-[#6366F1] tracking-wider">{localizedCity}</span>
                                        <h4 className="text-[14px] font-medium text-slate-900 truncate leading-tight w-full">{shortTitle}</h4>
                                      </div>
                                    </div>
                                    <ChevronLeft size={16} className="text-slate-300" />
                                  </button>
                                );
                              })}
                            </div>
                          </section>
                        )}
                      </div>
                    </div>
                    }

                    {viewingCity && (
                      <div className="animate-in slide-in-from-bottom duration-500 pb-20">
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
                            <button onClick={() => setViewingCity(null)} className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/30 rounded-[12px] flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg">
                              <ArrowRight size={18} />
                            </button>
                          </div>

                          <div className="absolute bottom-8 right-6 left-6 text-right z-10">
                            <span className="text-indigo-300 font-bold uppercase tracking-[0.2em] text-[11px] mb-2 block animate-in slide-in-from-right duration-700 delay-100 drop-shadow-md">{isHe ? 'מדריך טיולים' : 'Travel Guide'}</span>
                            <h1 className="text-5xl font-bold text-white mb-1 drop-shadow-xl animate-in slide-in-from-bottom duration-700 delay-200">{viewingCity}</h1>
                            <p className="text-slate-200 text-sm font-medium animate-in fade-in duration-700 delay-300 drop-shadow-md">{viewingCityData?.name_en}</p>
                          </div>
                        </div>

                        {isLoadingCityRoutes ? (
                          <div className="flex flex-col items-center py-20 gap-4">
                            <Loader2 className="animate-spin text-indigo-500" />
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{isHe ? 'מחפש מסלולים...' : 'Searching Tours...'}</p>
                          </div>
                        ) : (
                          <div className="space-y-12 px-6">
                            {/* <LocalGuidesSection city={viewingCity || ''} className="mb-8" onPostClick={handleGuidePostClick} /> */}

                            {citySpecificRoutes.length > 0 && (
                              <section>
                                <div className="flex items-center gap-3 mb-4">
                                  <h4 className="text-[14px] font-bold text-slate-800">{isHe ? `מסלולים נבחרים` : `Curated Tours`}</h4>
                                  <div className="h-px bg-slate-100 flex-1" />
                                </div>
                                <div className="space-y-3">
                                  {citySpecificRoutes.map((route, idx) => {
                                    const localizedName = (isHe && (route.preferences?.names?.he || (route as any).name_he) ? (route.preferences?.names?.he || (route as any).name_he) : route.name).replace(/✨/g, '').trim();
                                    const originalName = isHe ? route.name.replace(/✨/g, '').trim() : (route.preferences?.names?.he || (route as any).name_he || '').replace(/✨/g, '').trim();
                                    const parenMatch = localizedName.match(/(.*?)\s*\((.*?)\)/);
                                    const shortTitle = parenMatch ? parenMatch[2].trim() : localizedName;

                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => handleLoadSavedRoute(route.city, route)}
                                        className="w-full flex items-center gap-4 bg-white p-4 rounded-[12px] shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-[0.98] transition-all text-right group"
                                      >
                                        <div className="w-20 h-20 rounded-[10px] overflow-hidden bg-slate-100 shrink-0 relative shadow-sm">
                                          <GoogleImage query={`${route.city} ${route.name}`} className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
                                          {route.pois?.length > 0 && <div className="absolute bottom-1 right-1 bg-indigo-600/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[4px]">{route.pois.length} stops</div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-[15px] font-semibold text-slate-900 truncate leading-tight mb-1">{shortTitle}</h4>
                                          <p className="text-[11px] text-slate-500 line-clamp-1">{route.description || (isHe ? 'מסלול הליכה' : 'Walking tour')}</p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </section>
                            )}

                            {citySpecificRoutes.length === 0 && (
                              <div className="p-12 text-center text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                                <p className="text-[11px] uppercase tracking-widest">{isHe ? 'אין עדיין מסלולים בעיר זו' : 'No tours for this city yet'}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              } />

              <Route path="/route/:routeId" element={
                <div className="absolute inset-0 z-[3000] pointer-events-none">
                  {currentRoute && (
                    <Suspense fallback={null}>
                      <VoiceGuideManager route={currentRoute} language={preferences.language} />
                    </Suspense>
                  )}
                  {isGeneratingActive && currentRoute && generatingRouteIds.has(currentRoute.id) ? (
                    <div className="pointer-events-auto h-full">
                      <RouteSkeleton isHe={isHe} onBrowseLibrary={() => navigate('/library')} />
                    </div>
                  ) : currentRoute ? (
                    <div className={`pointer-events-none h-full transition-all duration-300 ${selectedPoi ? 'opacity-0 translate-y-20' : 'opacity-100'}`}>
                      <RouteOverview
                        route={currentRoute}
                        onPoiClick={setSelectedPoi}
                        onRemovePoi={() => { }}
                        onAddPoi={handleAddPoi}
                        onSave={handleSaveRoute}
                        preferences={preferences}
                        onUpdatePreferences={setPreferences}
                        onRequestRefine={() => { }}
                        user={user}
                        isSaved={isCurrentRouteSaved}
                        onClose={() => navigate('/')}
                        isExpanded={isCardExpanded}
                        setIsExpanded={setIsCardExpanded}
                        onRegenerate={handleActionCreateRoute}
                        isRegenerating={isGeneratingActive && currentRoute && generatingRouteIds.has(currentRoute.id)}
                        showToast={showToast}
                        nearbyRoutes={recentGlobalRoutes.filter(r => (r.city === currentRoute.city || (currentRoute.city && r.city && r.city.includes(currentRoute.city))) && r.id !== currentRoute.id)}
                        onRouteSelect={(r) => handleLoadSavedRoute(r.city, r)}
                        recentRoutes={openRoutes.filter(r => r.id !== currentRoute.id)}
                      />
                    </div>
                  ) : (
                    <div className="pointer-events-auto h-full bg-white/60 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center text-slate-400">
                      <RouteIcon size={40} className="mb-4 opacity-20" />
                      <p className="font-medium">{isHe ? 'נטען...' : 'Loading...'}</p>
                    </div>
                  )}
                </div>
              } />

              <Route path="/profile" element={
                <div className="absolute inset-0 bg-white z-[3000] p-6 overflow-y-auto pb-32 animate-in slide-in-from-bottom duration-500">
                  <div className="top-safe-area space-y-6">
                    <PreferencesPanel preferences={preferences} setPreferences={setPreferences} savedRoutes={savedRoutes} savedPois={savedPois} user={user} onLogin={signInWithGoogle} onLogout={signOut} onLoadRoute={(city, r) => handleLoadSavedRoute(city, r)} onDeleteRoute={(id) => {
                      const routeToDelete = savedRoutes.find(r => r.id === id);
                      const city = routeToDelete?.route_data?.city || routeToDelete?.city;
                      return user?.id && deleteRouteFromSupabase(id, user.id, city).then(() => refreshSavedContent(user.id))
                    }} onDeletePoi={(poiId) => user?.id && deletePoiFromSupabase(poiId, user.id).then(() => refreshSavedContent(user.id))} onOpenFeedback={() => { }} onOpenGuide={() => setShowOnboarding(true)} uniqueUserCount={0} remainingGens={0} offlineRouteIds={[]} onLoadOfflineRoute={() => { }} />
                    <div className="pt-8 border-t border-slate-50">
                      <PremiumProfileSection isHe={isHe} />
                    </div>
                  </div>
                </div>
              } />

              {/* Admin Routes */}
              <Route path="/admin/command-center" element={
                <Suspense fallback={<SuspenseLoader />}>
                  <CommandCenterPage />
                </Suspense>
              } />

              <Route path="/research" element={
                <Suspense fallback={<SuspenseLoader />}>
                  <Research />
                </Suspense>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </Suspense>

          {isWalkModeActive && (
            <Suspense fallback={null}>
              <RadarView onClose={toggleWalkMode} isHe={isHe} />
            </Suspense>
          )}

          <AnimatePresence>
            {isAiMenuOpen && (
              <CreationMenu
                isHe={isHe}
                onClose={() => setIsAiMenuOpen(false)}
                onOptionSelect={(opt) => {
                  if (opt === 'area') startStreetConfirm('area');
                  if (opt === 'street') startStreetConfirm('street');
                  if (opt === 'nearby') handleFindNearbyRoutes();
                  if (opt === 'nearby') setIsAiMenuOpen(false); // Close menu for nearby
                }}
              />
            )}
          </AnimatePresence>

          {selectedPoi && currentRoute && (
            <Suspense fallback={<div className="fixed inset-x-0 bottom-0 h-[400px] bg-white z-[5000] rounded-t-lg flex items-center justify-center border-t shadow-2xl"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>}>
              <UnifiedPoiCard
                poi={selectedPoi}
                route={currentRoute}
                currentIndex={currentRoute.pois.findIndex(p => p.id === selectedPoi.id)}
                totalCount={currentRoute.pois.length}
                preferences={preferences}
                onUpdatePreferences={setPreferences}
                onClose={() => setSelectedPoi(null)}
                onNext={() => { const idx = currentRoute.pois.findIndex(p => p.id === selectedPoi.id); if (idx < currentRoute.pois.length - 1) setSelectedPoi(currentRoute.pois[idx + 1]); }}
                onPrev={() => { const idx = currentRoute.pois.findIndex(p => p.id === selectedPoi.id); if (idx > 0) setSelectedPoi(currentRoute.pois[idx - 1]); }}
                isExpanded={isCardExpanded}
                setIsExpanded={setIsCardExpanded}
                showToast={showToast}
                isSaved={savedPois.some(p => p.id === selectedPoi.id)}
                onSave={() => handleTogglePoiSave(selectedPoi)}
                userLocation={location}
              />
            </Suspense>
          )}


        </main>

        {!selectedPoi && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[8000] pointer-events-auto">
            <div className={`backdrop-blur-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-full p-1.5 flex items-center gap-1.5 ${activeTab === 'profile' ? 'bg-slate-100/90 border-slate-200' : 'bg-white/70 border-white/40'}`}>
              {/* Map Button */}
              <button
                onClick={() => toggleTab('navigation')}
                className={`group relative h-12 transition-all duration-500 ease-out flex items-center justify-center gap-2 overflow-hidden ${activeTab === 'navigation'
                  ? 'w-12 bg-indigo-600 text-white rounded-full shadow-indigo-200 shadow-lg'
                  : 'w-12 px-0 text-slate-500 hover:text-slate-700 rounded-full'
                  }`}
              >
                <div className="relative z-10 transition-transform duration-300 group-active:scale-90">
                  <AnimatedCompass size={20} />
                </div>

              </button>

              {/* Plus/X Button - Centerpiece */}
              <button
                onClick={handleToggleAiMenu}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all duration-300 z-[9000] ${isAiMenuOpen
                  ? 'bg-slate-900 text-white rotate-0'
                  : 'bg-white border border-slate-200 text-slate-900 hover:border-indigo-200'
                  }`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isAiMenuOpen ? 'close' : 'plus'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isAiMenuOpen ? <X size={24} /> : <Plus size={24} />}
                  </motion.div>
                </AnimatePresence>
              </button>

              {/* Route Button */}
              <button
                onClick={() => {
                  if (activeTab === 'route') {
                    toggleTab('library');
                    navigate('/library');
                  } else if (activeTab === 'library') {
                    if (openRoutes.length > 0) {
                      toggleTab('route');
                      navigate('/route');
                    } else {
                      toggleTab('navigation');
                      navigate('/');
                    }
                  } else {
                    if (openRoutes.length > 0) {
                      toggleTab('route');
                      navigate('/route');
                    } else {
                      toggleTab('library');
                      navigate('/library');
                    }
                  }
                }}
                className={`group relative h-12 transition-all duration-500 ease-out flex items-center justify-center gap-2 overflow-hidden ${(activeTab === 'route' || activeTab === 'library')
                  ? 'w-12 bg-indigo-600 text-white rounded-full shadow-indigo-200 shadow-lg'
                  : 'w-12 px-0 text-slate-500 hover:text-slate-700 rounded-full'
                  }`}
              >
                <div className="relative z-10 transition-transform duration-300 group-active:scale-90">
                  {generatingRouteIds.size > 0 ? (
                    <RouteTravelIcon className={`w-6 h-6 ${(activeTab === 'route' || activeTab === 'library') ? 'brightness-0 invert' : ''}`} animated={true} />
                  ) : (
                    <RouteIcon size={20} />
                  )}
                </div>

              </button>
            </div>
          </div>
        )}

        {/* Global Mini Audio Player */}
        <GlobalAudioPlayer
          isHe={isHe}
          currentRoute={currentRoute}
          isVisible={!isAiMenuOpen}
        />
      </div >
    </AudioProvider >
  );
};

export default App;
