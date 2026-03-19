/**
 * ExplorePage — Clean, self-contained library page.
 * Fetches recent public routes directly from Supabase.
 * No user-saved content logic, no caching — just a simple data fetch + search.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Clock, ChevronLeft, Loader2, Globe, Footprints, X, Navigation } from 'lucide-react';
import { supabase, normalize } from '../services/supabase';
import { Route, POI } from '../types';
import { GoogleImage } from './GoogleImage';

interface ExplorePageProps {
  isHe: boolean;
  onOpenRoute: (route: Route) => void;
  onBack?: () => void;
}

interface ExploreRoute {
  id: string;
  name: string;
  city: string;
  description: string;
  durationMinutes: number;
  poiCount: number;
  is_public: boolean;
  created_at: string;
  pois: POI[];
  imageUrl?: string;
  firstPoiName?: string;
  highlights?: string[];
  preferences?: any;
}

// Cache keyed by language to avoid stale translations on language switch
let exploreRoutesCache: Record<string, ExploreRoute[]> = {};

export const invalidateExploreCache = () => {
  exploreRoutesCache = {};
  console.log('[ExplorePage] Cache invalidated');
};

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'tel aviv': { lat: 32.0853, lng: 34.7818 },
  'תל אביב': { lat: 32.0853, lng: 34.7818 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'פריז': { lat: 48.8566, lng: 2.3522 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'ברלין': { lat: 52.5200, lng: 13.4050 },
  'jerusalem': { lat: 31.7683, lng: 35.2137 },
  'ירושלים': { lat: 31.7683, lng: 35.2137 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'לונדון': { lat: 51.5074, lng: -0.1278 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'טוקיו': { lat: 35.6762, lng: 139.6503 }
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getCityPlaceholder = (city: string) => {
  const c = city.toLowerCase();
  if (c.includes('tel aviv') || c.includes('תל אביב')) return 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&w=600&q=80';
  if (c.includes('paris') || c.includes('פריז')) return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80';
  if (c.includes('berlin') || c.includes('ברלין')) return 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=600&q=80';
  if (c.includes('jerusalem') || c.includes('ירושלים')) return 'https://images.unsplash.com/photo-1542856334-21013444630a?auto=format&fit=crop&w=600&q=80';
  if (c.includes('london') || c.includes('לונדון')) return 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80';
  if (c.includes('rome') || c.includes('רומא')) return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80';
  return 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80'; // Default city
};

const translateStreet = (name: string) => {
  if (!name) return name;
  let translated = name;
  const commonStreets: Record<string, string> = {
    'zeitlin': 'צייטלין',
    'ibn gabirol': 'אבן גבירול',
    'shlomo ibn gabirol': 'שלמה אבן גבירול',
    'rothschild': 'רוטשילד',
    'dizengoff': 'דיזינגוף',
    'allenby': 'אלנבי',
    'herzl': 'הרצל',
    'bialik': 'ביאליק',
    'shenkin': 'שינקין',
    'ben gurion': 'בן גוריון',
    'hayarkon': 'הירקון'
  };

  const lower = name.toLowerCase();
  Object.entries(commonStreets).forEach(([en, he]) => {
    if (lower.includes(en)) {
      translated = `רחוב ${he}`;
      // Extract number if exists
      const numMatch = name.match(/\d+/);
      if (numMatch) translated += ` ${numMatch[0]}`;
    }
  });

  return translated;
};

const getLocalName = (name: string, prefs: any, isHe: boolean) => {
  if (!name) return '';
  const clean = name.replace(/✨/g, '').trim();
  if (!isHe) {
    // Return the English part (usually before the parentheses or the whole thing if no parens)
    return clean.split('(')[0].trim();
  }

  // 1. Check preferences
  if (prefs?.names?.he) return prefs.names.he;

  // 2. Check for (Hebrew) pattern
  const match = clean.match(/\((.*?)\)/);
  if (match && /[\u0590-\u05FF]/.test(match[1])) return match[1].trim();

  // 3. If the main name is already Hebrew, it might contain English in parens. Reverse it.
  if (/[\u0590-\u05FF]/.test(clean.split('(')[0])) return clean.split('(')[0].trim();

  // 4. If we are in Hebrew mode but the name is English, check if description starts with a good title
  if (isHe && !/[\u0590-\u05FF]/.test(clean)) {
    const fromDesc = prefs?.names?.he || '';
    if (fromDesc) return fromDesc;

    // 5. Try to translate street names
    if (clean.toLowerCase().includes('street')) {
      return translateStreet(clean);
    }
  }

  return clean;
};

const getLocalCity = (city: string, isHe: boolean) => {
  if (!city) return '';
  const c = city.toLowerCase();
  if (isHe) {
    if (c.includes('tel aviv') || c.includes('תל אביב')) return 'תל אביב-יפו';
    if (c.includes('paris') || c.includes('פריז')) return 'פריז';
    if (c.includes('berlin') || c.includes('ברלין')) return 'ברלין';
    if (c.includes('jerusalem') || c.includes('ירושלים')) return 'ירושלים';
    if (c.includes('london') || c.includes('לונדון')) return 'לונדון';
    if (c.includes('rome') || c.includes('רומא')) return 'רומא';
    if (c.includes('tokyo') || c.includes('טוקיו')) return 'טוקיו';
    return city;
  }
  return city;
};

const getLocalTimeAgo = (date: string, isHe: boolean) => {
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diff < 60) return isHe ? 'עכשיו' : 'just now';
  if (diff < 3600) return isHe ? `${Math.floor(diff / 60)} דק׳` : `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return isHe ? `${Math.floor(diff / 3600)} שע׳` : `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return isHe ? `לפני ${Math.floor(diff / 86400)} ימים` : `${Math.floor(diff / 86400)}d ago`;
  return past.toLocaleDateString(isHe ? 'he-IL' : 'en-US');
};

const ExplorePage: React.FC<ExplorePageProps> = ({ isHe, onOpenRoute, onBack }) => {
  const [routes, setRoutes] = useState<ExploreRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('[ExplorePage] Geolocation error:', err),
        { timeout: 10000 }
      );
    }
  }, []);

  // Fetch routes directly from Supabase
  useEffect(() => {
    const fetchRoutes = async () => {
      const cacheKey = isHe ? 'he' : 'en';
      // Use cache if available for instant loading (keyed by language)
      if (exploreRoutesCache[cacheKey]) {
        setRoutes(exploreRoutesCache[cacheKey]);
        setLoading(false);
        return;
      }

      console.log('[ExplorePage] Fetching routes...');
      setLoading(true);
      setError(null);

      try {
        console.log('[ExplorePage] Calling supabase...');
        const { data, error: fetchError } = await supabase
          .from('routes')
          .select(`
            id, name, city, description, duration_minutes, is_public, created_at, preferences,
            reconstruction_image_url,
            route_pois (
              order_index,
              pois (
                name,
                data
              )
            )
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(50); // Hard limit to reduce overhead and costs

        if (fetchError) {
          console.error('[ExplorePage] Fetch error:', fetchError);
          setError(isHe ? 'שגיאה בטעינת מסלולים' : 'Error loading routes');
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setRoutes([]);
          return;
        }

        const mapped: ExploreRoute[] = data.map((r: any) => {
          // Content Cleanup: Strip repetitive AI-generated prefixes
          let desc = r.description || '';

          // Smarter prefix stripping: check for "Historical tour", "Fascinating tour", etc.
          const isGenericIntro = /^(סיור היסטורי|סיור מרתק|Explore the history|A historical tour|Fascinating tour)/i.test(desc);
          if (isGenericIntro) {
            // Find first separator (. or ,) but handle common AI patterns
            // We look for the first completion of the intro sentence.
            const firstStop = desc.indexOf('.');
            if (firstStop !== -1 && firstStop < 120) {
              desc = desc.substring(firstStop + 1).trim();
            } else {
              // Fallback: strip the first 5-8 words if they match the city
              const words = desc.split(' ');
              if (words.length > 10) desc = words.slice(8).join(' ').trim();
            }
          }

          // Capitalize first letter if needed
          if (desc && desc[0] === desc[0].toLowerCase()) {
            desc = desc.charAt(0).toUpperCase() + desc.slice(1);
          }

          // Localized Names
          const localizedName = getLocalName(r.name, r.preferences, isHe);
          const localizedCity = getLocalCity(r.city, isHe);

          // Get Sorted POIs for image selection and distance
          const routePois = r.route_pois || [];
          const sortedPois = [...routePois].sort((a: any, b: any) => a.order_index - b.order_index);

          // Image Fallback Chain: Route -> Preferences -> First POI -> City Placeholder
          let imageUrl = r.reconstruction_image_url || r.preferences?.img_url;

          // Try to get image from first valid POI
          if (!imageUrl && sortedPois.length > 0) {
            for (const rp of sortedPois) {
              const poiImg = rp.pois?.data?.imageUrl || rp.pois?.data?.image_url;
              if (poiImg) {
                imageUrl = poiImg;
                break;
              }
            }
          }

          // If still no image, don't set a placeholder here — let GoogleImage search for it
          // the placeholder will be handled by GoogleImage's fallback or we pass it as a final fallback

          return {
            id: r.id,
            name: localizedName,
            city: localizedCity,
            description: desc,
            durationMinutes: r.duration_minutes || 0,
            poiCount: sortedPois.length || 5, // Use actual count if we fetched pois
            is_public: r.is_public,
            created_at: r.created_at,
            imageUrl: imageUrl,
            firstPoiName: sortedPois[0]?.pois?.name || '',
            highlights: [],
            preferences: r.preferences || {},
            pois: sortedPois.map(rp => rp.pois) as any,
          };
        });

        console.log(`[ExplorePage] Loaded ${mapped.length} routes`);
        exploreRoutesCache[cacheKey] = mapped;
        setRoutes(mapped);
      } catch (e) {
        console.error('[ExplorePage] Exception:', e);
        setError(isHe ? 'שגיאה בטעינה' : 'Loading error');
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [isHe]);

  // Extract unique cities for filters
  const cities = useMemo(() => {
    const cityMap = new Map<string, number>();
    routes.forEach(r => {
      const city = r.city?.trim();
      if (city) {
        cityMap.set(city, (cityMap.get(city) || 0) + 1);
      }
    });
    return Array.from(cityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [routes]);

  // Filter & Sort routes
  const filteredRoutes = useMemo(() => {
    let result = [...routes];

    if (selectedCity) {
      result = result.filter(r => normalize(r.city) === normalize(selectedCity));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.pois.some(p => p?.name?.toLowerCase().includes(q))
      );
    }

    // Geolocation Sorting
    if (sortByDistance && userLocation) {
      result.sort((a, b) => {
        const getCityKey = (city: string) => city.toLowerCase().replace(/-/g, ' ');
        const aKey = getCityKey(a.city);
        const bKey = getCityKey(b.city);
        const aCoords = CITY_COORDS[aKey] || { lat: 0, lng: 0 };
        const bCoords = CITY_COORDS[bKey] || { lat: 0, lng: 0 };

        if (aCoords.lat === 0 && bCoords.lat === 0) return 0;
        if (aCoords.lat === 0) return 1;
        if (bCoords.lat === 0) return -1;

        const distA = getDistance(userLocation.lat, userLocation.lng, aCoords.lat, aCoords.lng);
        const distB = getDistance(userLocation.lat, userLocation.lng, bCoords.lat, bCoords.lng);
        return distA - distB;
      });
    }

    return result;
  }, [routes, searchQuery, selectedCity, sortByDistance, userLocation]);

  const getRouteName = (route: ExploreRoute) => {
    if (isHe && route.preferences?.names?.he) return route.preferences.names.he;
    if (!isHe && route.preferences?.names?.en) return route.preferences.names.en;
    return route.name;
  };

  const getRouteDescription = (route: ExploreRoute) => {
    if (isHe && route.preferences?.descriptions?.he) return route.preferences.descriptions.he;
    if (!isHe && route.preferences?.descriptions?.en) return route.preferences.descriptions.en;
    return route.description;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return isHe ? 'עכשיו' : 'just now';
    if (hours < 24) return isHe ? `לפני ${hours} שעות` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return isHe ? `לפני ${days} ימים` : `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return isHe ? `לפני ${weeks} שבועות` : `${weeks}w ago`;
  };

  const handleOpenRoute = (route: ExploreRoute) => {
    const fullRoute: Route = {
      id: route.id,
      name: route.name,
      city: route.city,
      description: route.description,
      durationMinutes: route.durationMinutes,
      creator: '',
      pois: route.pois,
      is_public: route.is_public,
      preferences: route.preferences,
      highlights: route.highlights,
      originalPoiCount: route.poiCount,
    };
    onOpenRoute(fullRoute);
  };

  return (
    <div className="explore-page" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="explore-header">
        <div className="explore-header-top">
          <h1 className="explore-title">
            {isHe ? 'גלה מסלולים' : 'Explore Routes'}
          </h1>
          <span className="explore-count">
            {filteredRoutes.length} {isHe ? 'מסלולים' : 'routes'}
          </span>
        </div>

        {/* Search */}
        <div className="explore-search-wrapper">
          <Search size={18} className="explore-search-icon" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isHe ? 'חפש מסלול, עיר, או נקודת עניין...' : 'Search routes, cities, or POIs...'}
            className="explore-search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="explore-search-clear">
              <X size={16} />
            </button>
          )}
        </div>

        {/* City filters */}
        {cities.length > 0 && (
          <div className="explore-cities-scroll">
            <button
              onClick={() => {
                if (!userLocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                      setSortByDistance(true);
                    },
                    (err) => console.error(err)
                  );
                } else {
                  setSortByDistance(!sortByDistance);
                }
              }}
              className={`explore-city-chip distance-chip ${sortByDistance ? 'active' : ''}`}
            >
              <MapPin size={12} fill={sortByDistance ? "currentColor" : "none"} />
              {isHe ? 'קרוב אליי' : 'Near Me'}
            </button>
            <button
              onClick={() => setSelectedCity(null)}
              className={`explore-city-chip ${!selectedCity ? 'active' : ''}`}
            >
              {isHe ? 'הכל' : 'All'}
            </button>
            {cities.map(c => (
              <button
                key={c.name}
                onClick={() => setSelectedCity(selectedCity === c.name ? null : c.name)}
                className={`explore-city-chip ${selectedCity === c.name ? 'active' : ''}`}
              >
                {c.name}
                <span className="explore-city-count">{c.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="explore-content">
        {loading ? (
          <div className="explore-loading">
            <Loader2 className="animate-spin" size={32} />
            <p>{isHe ? 'טוען מסלולים...' : 'Loading routes...'}</p>
          </div>
        ) : error ? (
          <div className="explore-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="explore-retry-btn">
              {isHe ? 'נסה שוב' : 'Retry'}
            </button>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="explore-empty">
            <Footprints size={48} strokeWidth={1} />
            <p>{isHe ? 'לא נמצאו מסלולים' : 'No routes found'}</p>
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSelectedCity(null); }} className="explore-retry-btn">
                {isHe ? 'נקה חיפוש' : 'Clear search'}
              </button>
            )}
          </div>
        ) : (
          <div className="explore-routes-grid">
            <AnimatePresence mode="popLayout">
              {filteredRoutes.map((route, index) => (
                <motion.div
                  key={route.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => onOpenRoute(route as any)}
                  className="explore-route-card group"
                >
                  <div className="explore-card-image-wrap">
                    <GoogleImage
                      query={`${route.city} ${route.firstPoiName || route.name}`}
                      existingUrl={route.imageUrl}
                      fallbackUrl={getCityPlaceholder(route.city)}
                      className="explore-card-img"
                    />
                    <div className="explore-card-image-overlay" />
                    <div className="explore-card-city-badge">
                      <MapPin size={10} />
                      {route.city}
                    </div>
                  </div>

                  <div className="explore-card-content">
                    <h3 className="explore-card-title">{route.name}</h3>
                    <p className="explore-card-desc">{route.description}</p>

                    <div className="explore-card-footer">
                      <span className="explore-card-stat">
                        <Navigation size={12} className="text-indigo-500" />
                        {route.poiCount} {isHe ? 'נקודות' : 'stops'}
                      </span>
                      {route.durationMinutes > 0 && (
                        <span className="explore-card-stat">
                          <Clock size={12} className="text-slate-400" />
                          {route.durationMinutes} {isHe ? 'דק' : 'min'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        .explore-page {
          position: absolute;
          inset: 0;
          z-index: 3000;
          background: white;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 120px;
        }

        .explore-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(99, 102, 241, 0.08);
          padding: 16px 20px 12px;
        }

        .explore-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .explore-title {
          font-size: 34px;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .explore-title-icon {
          color: #6366f1;
        }

        .explore-count {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        .explore-search-wrapper {
          position: relative;
          margin-bottom: 12px;
        }

        .explore-search-icon {
          position: absolute;
          top: 50%;
          ${isHe ? 'right: 14px' : 'left: 14px'};
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .explore-search-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #f1f5f9;
          border-radius: 16px;
          padding: 12px 16px 12px 42px;
          font-size: 15px;
          font-weight: 500;
          color: #0f172a;
          outline: none;
          transition: all 0.2s ease;
        }
        
        ${isHe ? '.explore-search-input { padding: 12px 42px 12px 16px; }' : ''}

        .explore-search-input:focus {
          background: white;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .explore-search-input::placeholder {
          color: #cbd5e1;
        }

        .explore-search-clear {
          position: absolute;
          top: 50%;
          ${isHe ? 'left: 12px' : 'right: 12px'};
          transform: translateY(-50%);
          background: #f1f5f9;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
        }

        .explore-cities-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .explore-cities-scroll::-webkit-scrollbar { display: none; }

        .explore-city-chip {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 100px;
          background: #f8fafc;
          border: 1.5px solid #f1f5f9;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .explore-city-chip:hover {
          background: #f1f5f9;
          border-color: #e2e8f0;
          transform: translateY(-1px);
        }

        .explore-city-chip.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .explore-city-chip.distance-chip {
           border-color: #c7d2fe;
           color: #4f46e5;
           background: #f5f3ff;
        }

        .explore-city-chip.distance-chip.active {
           background: #4f46e5;
           color: white;
           border-color: #4f46e5;
        }

        .explore-city-count {
          font-size: 11px;
          opacity: 0.7;
        }

        .explore-content {
          padding: 16px 16px 0;
        }

        .explore-loading, .explore-error, .explore-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 20px;
          color: #94a3b8;
          text-align: center;
        }

        .explore-retry-btn {
          padding: 10px 24px;
          border-radius: 10px;
          border: 1.5px solid #6366f1;
          background: transparent;
          color: #6366f1;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .explore-retry-btn:hover {
          background: #6366f1;
          color: white;
        }

        .explore-routes-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 640px) {
          .explore-routes-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .explore-routes-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .explore-route-card {
          background: white;
          border-radius: 12px;
          border: 1px solid rgba(99,102,241,0.08);
          padding: 0;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .explore-card-image-wrap {
          width: 100%;
          height: 160px;
          overflow: hidden;
          background: #f1f5f9;
          position: relative;
        }

        .explore-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .explore-route-card:hover .explore-card-img {
          transform: scale(1.08);
        }

        .explore-card-body {
          padding: 12px 14px;
        }

        .explore-route-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.25);
        }

        .explore-card-city-badge {
          position: absolute;
          top: 10px;
          ${isHe ? 'right: 10px' : 'left: 10px'};
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          color: #4f46e5;
          display: flex;
          align-items: center;
          gap: 3px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 5;
        }

        .explore-card-time-badge {
          display: none;
        }

        .explore-card-name {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }

        .explore-card-desc {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
          margin: 0 0 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .explore-card-highlights {
          display: none;
        }

        .explore-highlight-tag {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 6px;
          background: #fef3c7;
          color: #92400e;
          font-weight: 500;
        }

        .explore-card-footer {
          display: flex;
          gap: 12px;
          margin-bottom: 6px;
        }

        .explore-card-stat {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          color: #94a3b8;
          font-weight: 500;
        }

        .explore-card-pois {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .explore-poi-pill {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #f1f5f9;
          color: #475569;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
        }

        .explore-poi-more {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 6px;
          background: #eef2ff;
          color: #6366f1;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ExplorePage;
