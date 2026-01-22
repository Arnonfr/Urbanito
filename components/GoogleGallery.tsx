
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, X, Maximize2, Image as ImageIcon } from 'lucide-react';

declare var google: any;

interface Props {
  query: string;
  isHe: boolean;
}

export const GoogleGallery: React.FC<Props> = ({ query, isHe }) => {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!query) return;

    setIsLoading(true);

    const fetchGallery = async () => {
      try {
        if (!google?.maps?.importLibrary) {
          throw new Error("Google Maps API not loaded");
        }

        const { Place } = await google.maps.importLibrary("places") as any;

        const cleanQuery = query.replace(/\([^)]*\)/g, '').trim();
        const originalNameMatch = query.match(/\((.*?)\)/);
        const originalName = originalNameMatch ? originalNameMatch[1] : null;
        const searchTerm = originalName || cleanQuery;

        const request = {
          textQuery: searchTerm,
          fields: ['photos', 'displayName'],
          maxResultCount: 8
        };

        const { places } = await Place.searchByText(request);

        if (!isMounted.current) return;

        if (places && places.length > 0 && places[0].photos) {
          const photoUrls = places[0].photos
            .slice(0, 8)
            .map((photo: any) => photo.getURI({ maxWidthPx: 1000, maxHeightPx: 1000 }));
          setImages(photoUrls);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Gallery Fetch Error:", err);
        if (isMounted.current) setIsLoading(false);
      }
    };

    fetchGallery();
  }, [query]);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shrink-0 w-64 aspect-video bg-slate-50 animate-pulse flex items-center justify-center" style={{ borderRadius: '12px' }}>
             <ImageIcon size={20} className="text-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
        {isHe ? "גלריית תמונות חיה" : "Live Photo Gallery"}
      </h4>
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 snap-x snap-mandatory">
        {images.map((url, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedIndex(idx)}
            className="shrink-0 w-72 aspect-video bg-slate-50 overflow-hidden shadow-sm snap-center cursor-zoom-in relative group" 
            style={{ borderRadius: '12px' }}
          >
            <img 
              src={url} 
              alt={`${query} ${idx}`} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
               <Maximize2 className="text-white" size={20} />
            </div>
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <img 
            src={images[selectedIndex]} 
            className="max-w-full max-h-[85vh] object-contain shadow-2xl animate-in zoom-in duration-300" 
            style={{ borderRadius: '8px' }}
            alt="Expanded View" 
          />
          <button className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full">
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
};
