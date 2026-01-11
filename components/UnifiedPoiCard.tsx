
import React, { useState, useEffect, useRef } from 'react';
import { POI, ExtendedSection, UserPreferences, Route } from '../types';
import { fetchExtendedPoiDetails, fetchNearbyGems, generateSpeech, decodeAudioData } from '../services/geminiService';
import { 
  Loader2, Sparkles, Play, Pause, X, ChevronLeft, Headset, BookOpen, ArrowRight, ArrowLeft, Plus, ChevronRight, Navigation, Volume2, Building2, MapPin, Clock, Camera
} from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS_HE } from './RouteOverview';

interface Props {
  poi: POI;
  route: Route;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRemove: (id: string) => void;
  onAddToRoute: (poi: Partial<POI>) => void;
  onGoToPoi: (poi: POI) => void;
  currentIndex: number;
  totalCount: number;
  city?: string;
  preferences: UserPreferences;
}

const translations = {
  he: {
    archOverview: "אדריכלות ועיצוב",
    extendedInfo: "פרקי הדרכה",
    nearbyGems: "פינות נסתרות בסביבה",
    overview: "סיפור המקום",
    ready: "האזנה",
    addedToRoute: "נוסף למסלול",
    add: "הוסף למסלול",
    showMore: "צלילה לעומק ההיסטוריה",
    loadingMore: "טוען מידע נוסף...",
    learnMore: "פרטים נוספים",
    backToPoi: "חזרה לתחנה המרכזית",
    gemsSubtitle: "מקומות שרק המקומיים מכירים",
    next: "לתחנה הבאה",
    prev: "לתחנה הקודמת",
    liveGuide: "הדרכה קולית",
    stopGuide: "עצור הדרכה",
    guidePlaying: "הדרכה פעילה...",
    walkingDist: "הליכה מהתחנה הקודמת"
  },
  en: {
    archOverview: "Architecture",
    extendedInfo: "Audio Chapters",
    nearbyGems: "Nearby Hidden Gems",
    overview: "History",
    ready: "Listen",
    addedToRoute: "Added",
    add: "Add to Route",
    showMore: "Deep Dive History",
    loadingMore: "Loading more...",
    learnMore: "Learn More",
    backToPoi: "Back to Main POI",
    gemsSubtitle: "Places only locals know",
    next: "Next Stop",
    prev: "Previous Stop",
    liveGuide: "Live Guide",
    stopGuide: "Stop Guide",
    guidePlaying: "Guide Active...",
    walkingDist: "Walk from previous"
  }
};

type DrawerState = 'peek' | 'preview' | 'full';

export const UnifiedPoiCard: React.FC<Props> = ({ 
  poi, route, onClose, onGoToPoi, currentIndex, totalCount, city = "Discovery", preferences, onAddToRoute, onNext, onPrev
}) => {
  const isHe = preferences.language === 'he';
  const t = translations[preferences.language];
  
  const [extendedData, setExtendedData] = useState<{ sections: ExtendedSection[] } | null>(null);
  const [nearbyGems, setNearbyGems] = useState<Partial<POI>[]>([]);
  const [selectedGem, setSelectedGem] = useState<Partial<POI> | null>(null);
  const [addedGems, setAddedGems] = useState<Set<string>>(new Set());
  const [chapters, setChapters] = useState<any[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingExtended, setIsLoadingExtended] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // State for Drawer
  const [drawerState, setDrawerState] = useState<DrawerState>('preview');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef<number>(0);

  const audioContext = useRef<AudioContext | null>(null);
  const sourceNode = useRef<AudioBufferSourceNode | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExtendedData(null);
    setNearbyGems([]);
    setSelectedGem(null);
    setImageError(false);
    stopAudio();
    
    const initialChapters = [{ id: 'overview', title: t.overview, script: poi.tourScript || poi.description }];
    setChapters(initialChapters);

    setIsLoadingExtended(true);
    fetchExtendedPoiDetails(poi.name, city, preferences)
      .then(data => {
        setExtendedData(data);
        setChapters([...initialChapters, ...data.sections.map((s: any, idx: number) => ({ 
          id: `sec-${idx}`, 
          title: s.title, 
          script: s.audioScript || s.content 
        }))]);
      })
      .finally(() => setIsLoadingExtended(false));

    fetchNearbyGems(poi.lat, poi.lng, city, preferences).then(setNearbyGems);
    return () => stopAudio();
  }, [poi.id, preferences.language]);

  const stopAudio = () => {
    if (sourceNode.current) {
      try { sourceNode.current.stop(); } catch (e) {}
      sourceNode.current = null;
    }
    setIsPlaying(false);
  };

  const playChapter = async (index: number) => {
    stopAudio();
    setActiveChapterIndex(index);
    setIsLoadingAudio(true);
    try {
      if (!audioContext.current) audioContext.current = new AudioContext({ sampleRate: 24000 });
      const audioBuffer = await generateSpeech(chapters[index].script, preferences.language);
      const decodedBuffer = await decodeAudioData(audioBuffer, audioContext.current, 24000, 1);
      const source = audioContext.current.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(audioContext.current.destination);
      sourceNode.current = source;
      source.start();
      setIsPlaying(true);
      source.onended = () => setIsPlaying(false);
    } catch (error) { console.error(error); } 
    finally { setIsLoadingAudio(false); }
  };

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = y;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = y - dragStartY.current;
    setDragOffset(delta);
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 60;
    if (dragOffset < -threshold) {
      if (drawerState === 'peek') setDrawerState('preview');
      else if (drawerState === 'preview') setDrawerState('full');
    } else if (dragOffset > threshold) {
      if (drawerState === 'full') setDrawerState('preview');
      else if (drawerState === 'preview') setDrawerState('peek');
    }
    setDragOffset(0);
  };

  const getDrawerHeight = () => {
    if (drawerState === 'peek') return '16vh';
    if (drawerState === 'preview') return '60vh'; // Slightly taller to accommodate no-image layout
    return '100dvh';
  };

  const renderGemView = (gem: Partial<POI>) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <button onClick={() => setSelectedGem(null)} className="flex items-center gap-3 p-2 bg-slate-50 rounded-full text-slate-500 hover:text-emerald-600 transition-colors">
        {isHe ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        <span className="text-xs font-bold uppercase tracking-widest">{t.backToPoi}</span>
      </button>
      <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-[2rem] space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="text-emerald-500" size={20} />
          <h2 className="text-xl font-bold text-slate-900">{gem.name}</h2>
        </div>
        <p className="text-slate-700 text-base leading-relaxed font-light">{gem.description}</p>
      </div>
      <button 
        onClick={() => { if(gem.name) { onAddToRoute(gem); setAddedGems(p => new Set([...p, gem.name as string])); } }}
        className={`w-full py-4 rounded-full text-sm font-bold transition-all shadow-md flex items-center justify-center gap-3 ${
          addedGems.has(gem.name || '') ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {addedGems.has(gem.name || '') ? <Plus size={18} className="rotate-45" /> : <Plus size={18} />}
        {addedGems.has(gem.name || '') ? t.addedToRoute : t.add}
      </button>
    </div>
  );

  const hasValidImage = poi.imageUrl && !imageError;

  return (
    <div 
      dir={isHe ? 'rtl' : 'ltr'}
      style={{ 
        height: getDrawerHeight(), 
        transform: `translateY(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s'
      }}
      className={`fixed inset-x-0 bottom-0 bg-white/98 backdrop-blur-[40px] z-[190] flex flex-col pointer-events-auto shadow-[0_-20px_60px_rgba(0,0,0,0.1)] border-t border-slate-100 ${
        drawerState === 'full' ? 'rounded-t-0' : 'rounded-t-[2.5rem]'
      }`}
    >
      <div 
         className="w-full pt-4 pb-2 shrink-0 cursor-grab active:cursor-grabbing"
         onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
         onMouseDown={onTouchStart} onMouseMove={onTouchMove} onMouseUp={onTouchEnd}
      >
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
        
        <div className="px-6 flex items-start justify-between">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <button onClick={onClose} className="p-2.5 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all"><X size={18} /></button>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">EXPERIENCE {city}</span>
              <h2 className="text-xl font-bold text-slate-900 leading-tight truncate tracking-tight">{selectedGem ? selectedGem.name : poi.name}</h2>
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {poi.travelFromPrevious && !selectedGem && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                    <Navigation size={10} className="text-emerald-500 rotate-45" />
                    <span className="text-[10px] font-medium text-emerald-700">
                      {poi.travelFromPrevious.duration} • {poi.travelFromPrevious.distance}
                    </span>
                  </div>
                )}
                {poi.category && !selectedGem && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                    {CATEGORY_ICONS[poi.category]}
                    <span className="text-[9px] font-medium uppercase">{isHe ? CATEGORY_LABELS_HE[poi.category] : poi.category}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); isPlaying ? stopAudio() : playChapter(activeChapterIndex); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 ${
              isPlaying ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isLoadingAudio ? <Loader2 size={16} className="animate-spin" /> : isPlaying ? <Volume2 size={16} className="animate-pulse" /> : <Headset size={16} />}
            <span className="hidden sm:inline">{isPlaying ? t.stopGuide : t.liveGuide}</span>
          </button>
        </div>
      </div>

      <div className={`px-6 py-4 flex items-center justify-between shrink-0 transition-opacity duration-300 ${drawerState === 'peek' ? 'opacity-0' : 'opacity-100'}`}>
         <button onClick={onPrev} disabled={currentIndex === 0}
           className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${currentIndex === 0 ? 'text-slate-200 cursor-not-allowed' : 'bg-slate-50 text-slate-500 hover:text-emerald-600'}`}>
           {isHe ? <ChevronRight size={14} /> : <ChevronLeft size={14} />} {t.prev}
         </button>
         
         <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium text-slate-400 tabular-nums">{currentIndex + 1} / {totalCount}</span>
            {isPlaying && <div className="flex gap-0.5 mt-1"><div className="w-1 h-2 bg-red-400 animate-bounce" style={{animationDelay: '0ms'}} /><div className="w-1 h-3 bg-red-500 animate-bounce" style={{animationDelay: '100ms'}} /><div className="w-1 h-2 bg-red-400 animate-bounce" style={{animationDelay: '200ms'}} /></div>}
         </div>

         <button onClick={onNext} disabled={currentIndex === totalCount - 1}
           className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${currentIndex === totalCount - 1 ? 'text-slate-200 cursor-not-allowed' : 'bg-slate-50 text-slate-500 hover:text-emerald-600'}`}>
           {t.next} {isHe ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
         </button>
      </div>

      <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto px-6 no-scrollbar scroll-smooth transition-opacity duration-500 ${drawerState === 'peek' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {selectedGem ? renderGemView(selectedGem) : (
          <div className="space-y-8 pb-32">
            
            {/* Conditional Rendering: Real Image or Stylish Header */}
            {hasValidImage ? (
              <div className="w-full aspect-[16/9] rounded-[2rem] overflow-hidden shadow-lg mt-2">
                <img 
                  src={poi.imageUrl} 
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" 
                  alt={poi.name} 
                />
              </div>
            ) : (
              <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2rem] p-8 border border-slate-100 flex items-center justify-between mt-2">
                 <div>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600 mb-3">
                       {CATEGORY_ICONS[poi.category || 'history']}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                      {isHe ? 'קטגוריה' : 'Category'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {isHe ? CATEGORY_LABELS_HE[poi.category || 'history'] : poi.category}
                    </h3>
                 </div>
                 <div className="opacity-10">
                    <Sparkles size={80} />
                 </div>
              </div>
            )}

            <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
               <div className="flex items-center gap-2 mb-3">
                  <Building2 size={16} className="text-emerald-500" />
                  <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{t.archOverview}</h4>
               </div>
               <p className="text-slate-800 text-base font-light leading-relaxed">{poi.architecturalStyle}</p>
            </section>

            <section className="px-1">
               <p className="text-slate-600 text-lg leading-relaxed font-light italic border-r-2 border-emerald-200 pr-4">{poi.description}</p>
            </section>

            <section className="space-y-4">
               <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">{t.extendedInfo}</h4>
               <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  {chapters.map((ch, idx) => (
                    <button key={idx} onClick={() => playChapter(idx)}
                      className={`shrink-0 px-5 py-3 rounded-2xl border transition-all text-xs font-medium flex items-center gap-2 ${activeChapterIndex === idx ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-200'}`}>
                      {activeChapterIndex === idx ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> : <Play size={10} fill="currentColor" />} {ch.title}
                    </button>
                  ))}
               </div>
            </section>

            <section className="space-y-10 pt-4">
               {isLoadingExtended ? <div className="space-y-8"><div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse" /><div className="h-20 bg-slate-50 rounded-2xl animate-pulse" /></div> : 
                 extendedData?.sections.map((sec, idx) => (
                   <div key={idx} className="space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-700">
                      <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{sec.category}</span>
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{sec.title}</h3>
                      <p className="text-slate-700 text-base leading-relaxed font-light">{sec.content}</p>
                   </div>
                 ))
               }
            </section>

            {nearbyGems.length > 0 && (
              <section className="space-y-6 pt-10 border-t border-slate-100">
                 <div className="px-1">
                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">{t.nearbyGems}</h4>
                    <p className="text-xs text-slate-400 font-medium">{t.gemsSubtitle}</p>
                 </div>
                 <div className="flex gap-4 overflow-x-auto no-scrollbar pb-8 px-1 snap-x">
                    {nearbyGems.map((gem, idx) => (
                      <div key={idx} className="shrink-0 w-64 bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col justify-between hover:shadow-lg transition-all snap-center group">
                         <div>
                            <h5 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">{gem.name}</h5>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 font-light">{gem.description}</p>
                         </div>
                         <div className="flex items-center gap-2 mt-6">
                            <button onClick={() => setSelectedGem(gem)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-slate-100">{t.learnMore}</button>
                            <button onClick={() => { if(gem.name) { onAddToRoute(gem); setAddedGems(p => new Set([...p, gem.name as string])); } }} className={`p-3 rounded-full transition-all ${addedGems.has(gem.name || '') ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-600 text-white shadow-md shadow-emerald-200'}`}>
                               <Plus className={addedGems.has(gem.name || '') ? "rotate-45" : ""} size={16} />
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
