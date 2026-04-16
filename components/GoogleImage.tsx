
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CameraOff } from 'lucide-react';
import { updatePoiImageInDb } from '../services/supabase';

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
const STORAGE_PREFIX = 'urbanito-img-v6-';
const CACHE_TTL = 86400000 * 30; // 30 days (Wikimedia images are stable)

const SIZES = {
  small: 400,
  medium: 800,
  large: 1200
};


async function fetchFromWikimedia(searchQuery: string, widthPx: number): Promise<string | null> {
  // 1. Wikipedia page images API (fast, reliable)
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchQuery)}&prop=pageimages&pithumbsize=${widthPx}&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0] as any;
      if (page?.thumbnail?.source) return page.thumbnail.source;
    }
  } catch (e) { /* fallthrough */ }

  // 2. Wikimedia Commons image search
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=${widthPx}&format=json&origin=*&gsrlimit=3`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      const first = Object.values(pages)[0] as any;
      const thumbUrl = first?.imageinfo?.[0]?.thumburl;
      if (thumbUrl) return thumbUrl;
    }
  } catch (e) { /* fallthrough */ }

  return null;
}

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

    // Extract English name from "Hebrew (English)" format
    const parenMatch = query.match(/\((.*?)\)/);
    const cleanHebrew = query.replace(/\([^)]*\)/g, '').trim();
    const searchQuery = (parenMatch ? parenMatch[1] : cleanHebrew).trim();

    const cacheKey = `${STORAGE_PREFIX}${searchQuery.toLowerCase().replace(/\s+/g, '-')}-${size}`;

    const fetchImage = async () => {
      // Check memory cache
      if (memoryCache.has(cacheKey)) {
        setImageUrl(memoryCache.get(cacheKey)!);
        setIsLoading(false);
        return;
      }

      // Check localStorage cache
      try {
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
      } catch (e) { /* ignore */ }

      setIsLoading(true);

      try {
        const widthPx = SIZES[size];
        const photoUrl = await fetchFromWikimedia(searchQuery, widthPx);
        if (!isMounted.current) return;

        if (photoUrl) {
          setImageUrl(photoUrl);
          memoryCache.set(cacheKey, photoUrl);

          if (poiName && cityName) {
            updatePoiImageInDb(poiName, cityName, photoUrl, undefined);
          }

          try {
            localStorage.setItem(cacheKey, JSON.stringify({ url: photoUrl, timestamp: Date.now() }));
          } catch (e) { /* storage full */ }
        } else {
          // No relevant image found — show nothing
          setHasError(true);
        }

        setIsLoading(false);
      } catch (err) {
        if (!isMounted.current) return;
        setIsLoading(false);
        setHasError(true);
      }
    };

    fetchImage();
  }, [query, size, existingUrl]);

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
