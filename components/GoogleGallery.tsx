
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, X, Maximize2, Image as ImageIcon } from 'lucide-react';

interface Props {
  query: string;
  isHe: boolean;
}

async function fetchWikimediaGallery(searchQuery: string): Promise<string[]> {
  const images: string[] = [];

  // 1. Wikipedia page images (main article image)
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchQuery)}&prop=images&imlimit=10&format=json&origin=*`;
    const res = await fetch(wikiUrl);
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0] as any;
      const pageImages: string[] = (page?.images || [])
        .map((img: any) => img.title as string)
        .filter((t: string) => /\.(jpg|jpeg|png|gif)$/i.test(t));

      if (pageImages.length > 0) {
        // Resolve image URLs for first 8 images
        const titles = pageImages.slice(0, 8).join('|');
        const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json&origin=*`);
        const imgData = await imgRes.json();
        const imgPages = imgData.query?.pages;
        if (imgPages) {
          Object.values(imgPages).forEach((p: any) => {
            const url = p?.imageinfo?.[0]?.thumburl;
            if (url) images.push(url);
          });
        }
      }
    }
  } catch (e) { /* fallthrough */ }

  if (images.length >= 4) return images.slice(0, 8);

  // 2. Wikimedia Commons search to fill remaining slots
  try {
    const needed = 8 - images.length;
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json&origin=*&gsrlimit=${needed + 2}`;
    const res = await fetch(commonsUrl);
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      Object.values(pages).forEach((p: any) => {
        const url = p?.imageinfo?.[0]?.thumburl;
        if (url && !images.includes(url)) images.push(url);
      });
    }
  } catch (e) { /* fallthrough */ }

  return images.slice(0, 8);
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
        const parenMatch = query.match(/\((.*?)\)/);
        const cleanQuery = query.replace(/\([^)]*\)/g, '').trim();
        const searchTerm = parenMatch ? parenMatch[1] : cleanQuery;

        const urls = await fetchWikimediaGallery(searchTerm);
        if (!isMounted.current) return;

        setImages(urls);
      } catch (err) {
        console.error("Gallery fetch error:", err);
      } finally {
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
        {isHe ? "גלריית תמונות" : "Photo Gallery"}
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
