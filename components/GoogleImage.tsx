
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CameraOff } from 'lucide-react';
import { updatePoiImageInDb } from '../services/supabase';

declare var google: any;

interface SmartImageProps {
  query: string;
  poiName?: string;
  cityName?: string;
  lat?: number;
  lng?: number;
  size?: 'small' | 'medium' | 'large';
  priority?: boolean;
  className?: string;
  fallbackUrl?: string;
  existingUrl?: string;
}

const memoryCache = new Map<string, string>();
const STORAGE_PREFIX = 'urbanito-img-v5-';
const CACHE_TTL = 86400000 * 7; 

const SIZES = {
  small: { maxWidthPx: 400 },
  medium: { maxWidthPx: 800 },
  large: { maxWidthPx: 1200 }
};

export const GoogleImage: React.FC<SmartImageProps> = ({ 
  query, poiName, cityName, lat, lng, size = 'medium', priority = false, className = '', fallbackUrl, existingUrl 
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(existingUrl || null);
  const [isLoading, setIsLoading] = useState(!existingUrl);
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (existingUrl) {
      setImageUrl(existingUrl);
      setIsLoading(false);
      return;
    }

    if (!query) return;

    const cleanHebrew = query.replace(/\([^)]*\)/g, '').trim();
    const parenMatch = query.match(/\((.*?)\)/);
    const englishName = parenMatch ? parenMatch[1] : null;
    const searchQuery = (englishName || cleanHebrew).trim();

    const cacheKey = `${STORAGE_PREFIX}${searchQuery.toLowerCase().replace(/\s+/g, '-')}-${size}`;

    const fetchImage = async () => {
      try {
        if (memoryCache.has(cacheKey)) {
          setImageUrl(memoryCache.get(cacheKey)!);
          setIsLoading(false);
          return;
        }

        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { url, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setImageUrl(url);
            memoryCache.set(cacheKey, url);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Cache read error:", e);
      }

      setIsLoading(true);
      
      try {
        if (!google?.maps?.importLibrary) {
          throw new Error("Google Maps API not loaded");
        }

        const { Place } = await google.maps.importLibrary("places") as any;
        
        const request = {
          textQuery: searchQuery,
          fields: ['photos', 'displayName', 'id'],
          maxResultCount: 1,
          locationBias: lat && lng ? { center: { lat, lng }, radius: 1000 } : undefined
        };

        const { places } = await Place.searchByText(request);

        if (!isMounted.current) return;

        if (places && places.length > 0 && places[0].photos && places[0].photos.length > 0) {
          const photoUrl = places[0].photos[0].getURI({
            maxWidthPx: SIZES[size].maxWidthPx
          });
          
          setImageUrl(photoUrl);
          memoryCache.set(cacheKey, photoUrl);
          
          if (poiName && cityName) {
            updatePoiImageInDb(poiName, cityName, photoUrl);
          }

          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              url: photoUrl,
              timestamp: Date.now()
            }));
          } catch (e) {}
          
          setIsLoading(false);
        } else {
          setImageUrl(fallbackUrl || `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80&auto=format`);
          setIsLoading(false);
          setHasError(true);
        }
      } catch (err) {
        console.error("New Places API Error:", err);
        if (!isMounted.current) return;
        setImageUrl(fallbackUrl || `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80&auto=format`);
        setIsLoading(false);
        setHasError(true);
      }
    };

    fetchImage();
  }, [query, size, lat, lng, existingUrl]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-200/50">
           <Loader2 size={18} className="text-indigo-500 animate-spin" />
        </div>
      )}
      {imageUrl && (
        <img 
          src={imageUrl} 
          className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`} 
          alt={query}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      )}
      {hasError && !imageUrl && (
        <div className="w-full h-full flex items-center justify-center text-slate-300">
          <CameraOff size={20} />
        </div>
      )}
    </div>
  );
};
