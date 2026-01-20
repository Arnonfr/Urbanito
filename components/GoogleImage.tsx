
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, X, Image as ImageIcon } from 'lucide-react';

declare var google: any;

interface Props {
  query: string;
  className?: string;
  fallbackUrl?: string;
}

// Persistent session cache for place images to save API costs
const imageCache = new Map<string, string>();

export const GoogleImage: React.FC<Props> = ({ query, className, fallbackUrl }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(imageCache.get(query) || null);
  const [isLoading, setIsLoading] = useState(!imageCache.has(query));
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!query) return;
    
    if (imageCache.has(query)) {
      setImageUrl(imageCache.get(query)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const fetchImage = async () => {
      try {
        if (!(window as any).google?.maps?.places) {
          setTimeout(fetchImage, 500);
          return;
        }

        // Using Places API (New) via importLibrary or the places namespace
        const { Place } = await google.maps.importLibrary("places") as any;
        
        const trySearch = async (searchQuery: string, attempt: number = 1): Promise<void> => {
          try {
            const request = {
              textQuery: searchQuery,
              fields: ['photos'], // COST OPTIMIZATION: Only requesting photos
              maxResultCount: 1,
              language: 'en'
            };

            const { places } = await Place.searchByText(request);

            if (!isMounted.current) return;

            if (places && places.length > 0 && places[0].photos && places[0].photos.length > 0) {
              // New API uses getURI instead of getUrl
              const url = places[0].photos[0].getURI({ maxWidth: 1200, maxHeight: 1200 });
              imageCache.set(query, url);
              setImageUrl(url);
              setIsLoading(false);
            } else {
              if (attempt === 1) await trySearch(`${query} tourism landmarks`, 2);
              else if (attempt === 2) await trySearch(query, 3);
              else {
                setIsLoading(false);
                setHasError(true);
              }
            }
          } catch (e) {
            console.error("Places New API Error:", e);
            setHasError(true);
            setIsLoading(false);
          }
        };

        await trySearch(`${query} iconic tourism`);
      } catch (e) {
        setHasError(true);
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [query]);

  const toggleFullscreen = () => {
    if (imageUrl) setIsFullscreen(!isFullscreen);
  };

  const finalFallback = fallbackUrl || `https://images.unsplash.com/featured/?${encodeURIComponent(query + ' tourism landmarks architecture')}`;

  return (
    <>
      <div className={`relative overflow-hidden cursor-zoom-in bg-slate-100 ${className}`} onClick={toggleFullscreen}>
        {isLoading && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
             <div className="w-full h-full animate-pulse bg-slate-200" />
             <Loader2 size={24} className="absolute text-slate-300 animate-spin" />
          </div>
        )}
        
        {hasError ? (
          <img 
            src={finalFallback} 
            className="w-full h-full object-cover grayscale-[0.2]" 
            alt={query} 
            loading="lazy"
            onError={(e) => {
               (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1467226319480-6bc9d893f216?auto=format&fit=crop&w=800&q=80";
            }}
          />
        ) : (
          <img 
            src={imageUrl || finalFallback} 
            className={`w-full h-full object-cover transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`} 
            alt={query}
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
          />
        )}
      </div>

      {isFullscreen && (imageUrl || finalFallback) && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={toggleFullscreen}
        >
          <button className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
            <X size={24} />
          </button>
          <img 
            src={imageUrl || finalFallback} 
            className="max-w-full max-h-full object-contain shadow-2xl" 
            style={{ borderRadius: '5px' }}
            alt={query} 
          />
        </div>
      )}
    </>
  );
};
