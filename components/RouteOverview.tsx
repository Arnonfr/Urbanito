
import React, { useState, useRef } from 'react';
import { Route, POI, UserPreferences, POICategory } from '../types';
import { MapPin, Navigation, Camera, Building2, Utensils, Maximize2, Minimize2, ChevronUp, ChevronDown, Sparkles, Ship, Trees, ShoppingBag, Palette, Landmark, Church } from 'lucide-react';

interface Props {
  route: Route;
  onPoiClick: (poi: POI) => void;
  preferences: UserPreferences;
  onUpdatePreferences: (p: UserPreferences) => void;
  onRequestRefine: () => void;
}

const STACK_COLORS = ['bg-emerald-600', 'bg-teal-600', 'bg-green-600', 'bg-emerald-700', 'bg-teal-700'];

export const CATEGORY_ICONS: Record<POICategory, React.ReactNode> = {
  history: <Landmark size={14} />,
  food: <Utensils size={14} />,
  architecture: <Building2 size={14} />,
  nature: <Trees size={14} />,
  shopping: <ShoppingBag size={14} />,
  sailing: <Ship size={14} />,
  culture: <Palette size={14} />,
  religion: <Church size={14} />,
  art: <Camera size={14} />
};

export const CATEGORY_LABELS_HE: Record<POICategory, string> = {
  history: 'אתר היסטורי',
  food: 'אוכל ושתייה',
  architecture: 'אדריכלות',
  nature: 'טבע ונוף',
  shopping: 'קניות',
  sailing: 'שיט וחופים',
  culture: 'תרבות',
  religion: 'אתר דתי',
  art: 'אמנות'
};

const getPoiIcon = (poi: POI) => {
  if (poi.category && CATEGORY_ICONS[poi.category]) {
    return CATEGORY_ICONS[poi.category];
  }
  return <MapPin size={14} />;
};

export const RouteOverview: React.FC<Props> = ({ route, onPoiClick, preferences, onUpdatePreferences, onRequestRefine }) => {
  const isHe = preferences.language === 'he';
  const [isExpanded, setIsExpanded] = useState(true);
  
  const t = {
    header: isHe ? "התוכנית שלנו" : "Our Plan",
    subHeader: isHe ? "סקירה מהירה של המסלול המתוכנן עבורך" : "A quick overview of your curated route",
    stations: isHe ? "תחנות" : "Stations",
    start: isHe ? "תחילת מסלול" : "Start Route",
    map: isHe ? "מפה" : "Map",
    refine: isHe ? "עדכון והתאמה" : "Refine Route"
  };

  return (
    <div 
      className={`fixed inset-x-0 bottom-0 z-[200] flex flex-col pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-white/95 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] ${
        isExpanded ? 'h-[92vh]' : 'h-[25vh]'
      }`}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      <div 
        className="shrink-0 pt-4 pb-2 px-8 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1 bg-slate-200/80 rounded-full mx-auto mb-6 hover:bg-slate-300 transition-colors" />
        
        <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.header}</h1>
              <p className={`text-slate-400 text-sm font-light transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 h-0'}`}>
                {t.subHeader}
              </p>
              {!isExpanded && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium uppercase tracking-widest mt-1">
                  <MapPin size={12} />
                  {route.city} • {route.pois.length} {t.stations} • {preferences.walkingDistance}km
                </div>
              )}
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto px-6 pb-40 no-scrollbar transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        <div className="relative w-full aspect-[16/9] rounded-[2rem] overflow-hidden shadow-xl shadow-emerald-900/5 mb-8 mt-4 group">
          {/* Fallback image if route.pois[0]?.imageUrl is undefined, or just a colored placeholder since user disabled generation */}
          {route.pois[0]?.imageUrl ? (
            <img 
              src={route.pois[0]?.imageUrl} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              alt={route.city}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-slate-900" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
          
          <div className="absolute top-6 right-6 flex gap-2">
            <div className="bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                {preferences.walkingDistance} km
            </div>
            <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                {route.pois.length} {t.stations}
            </div>
          </div>

          <div className="absolute bottom-6 inset-x-6 text-white space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <MapPin size={12} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{route.city}</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{route.name}</h2>
          </div>
        </div>

        <div className="relative space-y-0 max-w-2xl mx-auto">
          <div className={`absolute ${isHe ? 'right-[21px]' : 'left-[21px]'} top-4 bottom-4 w-0.5 bg-slate-100`} />

          {route.pois.map((poi, idx) => (
            <div key={poi.id} className="relative group">
              <button 
                onClick={() => onPoiClick(poi)}
                className="w-full flex items-start gap-6 py-5 transition-all hover:translate-x-1"
              >
                <div className="relative z-10 pt-1 shrink-0">
                  <div className={`w-11 h-11 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-105 ${STACK_COLORS[idx % STACK_COLORS.length]}`}>
                      <div className="text-white">
                        {getPoiIcon(poi)}
                      </div>
                  </div>
                </div>

                <div className="flex-1 text-right space-y-1 pt-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 tabular-nums">0{idx + 1}:00</span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight truncate">
                        {poi.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold flex items-center gap-1 border border-emerald-100">
                        <Navigation size={10} />
                        {t.map}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 font-light">
                    {poi.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                      {poi.travelFromPrevious && (
                        <span className="text-[9px] font-bold uppercase text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100">
                            {poi.travelFromPrevious.duration} ({poi.travelFromPrevious.distance})
                        </span>
                      )}
                      {poi.category && (
                        /* Secondary Color: Violet for Categories */
                        <span className="text-[9px] font-bold uppercase text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 flex items-center gap-1">
                            {getPoiIcon(poi)}
                            {isHe ? CATEGORY_LABELS_HE[poi.category] : poi.category}
                        </span>
                      )}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-2xl mx-auto space-y-3">
            <button 
              onClick={() => onPoiClick(route.pois[0])}
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/10 active:scale-95"
            >
              <Navigation size={18} />
              {t.start}
            </button>
            
            <button 
              onClick={onRequestRefine}
              className="w-full py-4 border border-slate-200 text-slate-500 rounded-[1.5rem] font-medium flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 transition-all active:scale-95"
            >
              <Sparkles size={16} />
              {t.refine}
            </button>
        </div>
      </div>
    </div>
  );
};
