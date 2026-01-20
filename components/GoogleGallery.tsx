
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronRight, ChevronLeft, X, Maximize2, Image as ImageIcon } from 'lucide-react';

declare var google: any;

interface Props {
  query: string;
  isHe: boolean;
}

const galleryCache = new Map<string, string[]>();

export const GoogleGallery: React.FC<Props> = ({ query, isHe }) => {
  const [images, setImages] = useState<string[]>(galleryCache.get(query) || []);
  const [isLoading, setIsLoading] = useState(!galleryCache.has(query));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!query) return;
    
    if (galleryCache.has(query)) {
      setImages(galleryCache.get(query)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const fetchGallery = async () => {
      try {
        if (!(window as any).google?.maps?.places) {
          setTimeout(fetchGallery, 500);
          return;
        }

        const { Place } = await google.maps.importLibrary("places") as any;

        const tryGallerySearch = async (searchQuery: string, attempt: number = 1): Promise<void> => {
          try {
            const request = {
              textQuery: searchQuery,
              fields: ['photos'], // COST OPTIMIZATION: Only requesting photos field
              maxResultCount: 1
            };

            const { places } = await Place.searchByText(request);

            if (!isMounted.current) return;
            
            if (places && places.length > 0 && places[0].photos) {
              const photoUrls = places[0].photos
                .slice(0, 8)
                .map((photo: any) => photo.getURI({ maxWidth: 1000, maxHeight: 1000 }));
              galleryCache.set(query, photoUrls);
              setImages(photoUrls);
              setIsLoading(false);
            } else if (attempt === 1) {
               await tryGallerySearch(`${query} tourism landmark`, 2);
            } else {
              setImages([]);
              setIsLoading(false);
            }
          } catch (e) {
            console.error("Gallery Places New Error:", e);
            setIsLoading(false);
          }
        };

        await tryGallerySearch(`${query} landmarks iconic photo`);
      } catch (e) {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, [query]);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shrink-0 w-64 aspect-[3/2] bg-slate-100 animate-pulse flex items-center justify-center" style={{ borderRadius: '10px' }}>
             <ImageIcon size={24} className="text-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in duration-700">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
        {isHe ? "גלריית תמונות" : "Photo Gallery"}
      </h4>
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 snap-x snap-mandatory">
        {images.map((url, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedIndex(idx)}
            className="shrink-0 w-72 aspect-[3/2] bg-slate-100 overflow-hidden shadow-sm snap-center cursor-zoom-in relative group" 
            style={{ borderRadius: '10px' }}
          >
            <img 
              src={url} 
              alt={`${query} ${idx}`} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center">
               <Maximize2 className="text-white" size={24} />
            </div>
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-10">
             <div className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                {isHe ? 'תמונה' : 'Image'} {selectedIndex + 1} / {images.length}
             </div>
             <button className="p-3 bg-white/10 text-white rounded-full">
               <X size={24} />
             </button>
          </div>

          <img 
            src={images[selectedIndex]} 
            className="max-w-full max-h-[85vh] object-contain shadow-2xl animate-in zoom-in-95 duration-300" 
            style={{ borderRadius: '5px' }}
            alt="Expanded" 
          />
        </div>
      )}
    </div>
  );
};
