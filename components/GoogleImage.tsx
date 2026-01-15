
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';

declare var google: any;

interface Props {
  query: string;
  className?: string;
  fallbackUrl?: string;
}

// Singleton for PlacesService to avoid repetitive DOM element creation
let placesService: any = null;

export const GoogleImage: React.FC<Props> = ({ query, className, fallbackUrl }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!query) return;

    setIsLoading(true);
    setHasError(false);

    const fetchImage = () => {
      if (!(window as any).google?.maps?.places) {
        // Retry if maps not loaded yet
        setTimeout(fetchImage, 500);
        return;
      }

      if (!placesService) {
        placesService = new google.maps.places.PlacesService(document.createElement('div'));
      }

      // textSearch is generally more robust for finding landmarks than findPlaceFromQuery
      placesService.textSearch(
        { query },
        (results: any, status: any) => {
          if (!isMounted.current) return;

          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.photos?.[0]) {
            const url = results[0].photos[0].getUrl({ maxWidth: 800, maxHeight: 800 });
            setImageUrl(url);
            setIsLoading(false);
          } else if (status === google.maps.places.ServiceStatus.ZERO_RESULTS || status === 'OVER_QUERY_LIMIT') {
             // If query limit reached or no results, try a secondary search with just the first part of the query
             const simpleQuery = query.split(',')[0];
             if (simpleQuery !== query) {
               placesService.textSearch({ query: simpleQuery }, (res2: any, stat2: any) => {
                 if (isMounted.current && stat2 === google.maps.places.ServiceStatus.OK && res2?.[0]?.photos?.[0]) {
                   setImageUrl(res2[0].photos[0].getUrl({ maxWidth: 800 }));
                   setIsLoading(false);
                 } else {
                   setIsLoading(false);
                   setHasError(true);
                 }
               });
             } else {
               setIsLoading(false);
               setHasError(true);
             }
          } else {
            setIsLoading(false);
            setHasError(true);
          }
        }
      );
    };

    fetchImage();
  }, [query]);

  if (isLoading) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="flex items-center justify-center h-full">
           <ImageIcon size={24} className="text-slate-200" />
        </div>
      </div>
    );
  }

  if (hasError || !imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img 
          src={fallbackUrl || `https://images.unsplash.com/featured/?${encodeURIComponent(query)}`} 
          className="w-full h-full object-cover grayscale-[0.3]" 
          alt={query} 
          onError={(e) => {
             (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1467226319480-6bc9d893f216?auto=format&fit=crop&w=800&q=80";
          }}
        />
        <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
           <ImageIcon size={20} className="text-white/20" />
        </div>
      </div>
    );
  }

  return <img src={imageUrl} className={`object-cover animate-in fade-in duration-700 ${className}`} alt={query} />;
};
