import React from 'react';
import { MapPin, Navigation, Map as MapIcon, Layers, ChevronRight, ChevronLeft } from 'lucide-react';
import { Route } from '../types';
import { GoogleImage } from './GoogleImage'; // Assuming this exists based on App.tsx usage

interface RouteCardProps {
    route: Route;
    isHe: boolean;
    onSelect: (route: Route) => void;
    localizedCity?: string;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, isHe, onSelect, localizedCity }) => {
    // Resolve Localized Name (user's language)
    const localizedName = (isHe && (route.preferences?.names?.he || (route as any).name_he)
        ? (route.preferences?.names?.he || (route as any).name_he)
        : route.name).replace(/✨/g, '').trim();

    // Get the original name (opposite language)
    const originalName = isHe
        ? route.name.replace(/✨/g, '').trim()
        : (route.preferences?.names?.he || (route as any).name_he || '').replace(/✨/g, '').trim();

    // Parse title: "Long Description (Short Name)" -> use Short Name
    const parenMatch = localizedName.match(/(.*?)\s*\((.*?)\)/);
    const shortTitle = parenMatch ? parenMatch[2].trim() : localizedName;

    const originalParenMatch = originalName.match(/(.*?)\s*\((.*?)\)/);
    const shortOriginalTitle = originalParenMatch ? originalParenMatch[2].trim() : originalName;

    // Only show original if it's different from localized content
    const showOriginal = originalName && shortOriginalTitle !== shortTitle;

    const poiCount = route.pois?.length || 0;
    const routeStyle = route.style || 'street';

    return (
        <button
            onClick={() => onSelect(route)}
            className="w-full flex items-center gap-4 bg-white p-4 rounded-[20px] shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 active:scale-[0.98] transition-all group"
            dir={isHe ? 'rtl' : 'ltr'}
        >
            {/* Image Container with Badges */}
            <div className="relative w-24 h-24 rounded-[16px] overflow-hidden bg-slate-100 shrink-0 shadow-sm border border-slate-50">
                <GoogleImage
                    query={`${route.city} ${route.name}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Top-right: Style Icon Badge */}
                <div className={`absolute top-2 ${isHe ? 'left-2' : 'right-2'} bg-white/95 backdrop-blur-md p-1.5 rounded-[8px] shadow-sm border border-white/50 z-10`}>
                    {routeStyle === 'street' ? (
                        <Navigation size={12} className="text-indigo-600" />
                    ) : (
                        <MapIcon size={12} className="text-emerald-600" />
                    )}
                </div>

                {/* Bottom-right: Stations Count Chip */}
                {poiCount > 0 && (
                    <div className={`absolute bottom-2 ${isHe ? 'right-2' : 'left-2'} bg-indigo-600/90 backdrop-blur-md text-white px-2 py-1 rounded-[6px] shadow-lg border border-indigo-400/30 flex items-center gap-1 z-10 animate-in fade-in slide-in-from-bottom-1 duration-500`}>
                        <Layers size={10} className="text-indigo-100" />
                        <span className="text-[10px] font-bold tracking-tight leading-none">{poiCount}</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 flex flex-col items-start">
                {/* City Name - Small & Elegant */}
                <div className="flex items-center gap-1.5 mb-1">
                    <MapPin size={10} className="text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-[0.15em]">
                        {localizedCity || route.city}
                    </span>
                </div>

                {/* Route Name - Up to 2 lines */}
                <h4 className={`text-[17px] font-bold text-slate-900 leading-[1.25] mb-1 line-clamp-2 decoration-indigo-500/0 group-hover:decoration-indigo-500/20 underline-offset-4 transition-all ${isHe ? 'font-hebrew' : ''}`}>
                    {shortTitle}
                </h4>

                {/* Original Name - Small, Muted & Italic */}
                {showOriginal && (
                    <p className="text-[11px] text-slate-400 font-medium italic opacity-80 truncate w-full" dir={!isHe ? 'rtl' : 'ltr'}>
                        {shortOriginalTitle}
                    </p>
                )}
            </div>

            {/* Action Indicator - Animated Chevron */}
            <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all duration-300 ${isHe ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
                {isHe ? <ChevronLeft size={18} strokeWidth={3} /> : <ChevronRight size={18} strokeWidth={3} />}
            </div>
        </button>
    );
};
