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
    const rawName = (isHe && (route.preferences?.names?.he || (route as any).name_he)
        ? (route.preferences?.names?.he || (route as any).name_he)
        : route.name).replace(/✨/g, '').trim();

    // Robust parsing: "Original Name (Translated Name)"
    const parenMatch = rawName.match(/(.*?)\s*\((.*?)\)/);
    let shortTitle = rawName;
    let secondaryTitle = "";

    const containsHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);

    if (parenMatch) {
        const p1 = parenMatch[1].trim();
        const p2 = parenMatch[2].trim();
        if (isHe) {
            if (containsHebrew(p2)) { shortTitle = p2; secondaryTitle = p1; }
            else if (containsHebrew(p1)) { shortTitle = p1; secondaryTitle = p2; }
            else { shortTitle = p2; secondaryTitle = p1; }
        } else {
            if (!containsHebrew(p1)) { shortTitle = p1; secondaryTitle = p2; }
            else if (!containsHebrew(p2)) { shortTitle = p2; secondaryTitle = p1; }
            else { shortTitle = p1; secondaryTitle = p2; }
        }
    } else {
        // Fallback if no parens but we have a Hebrew name in route.name
        if (isHe && !containsHebrew(rawName)) {
            // Try to find if we have Hebrew in data
            const dbHe = (route as any).name_he || route.preferences?.names?.he;
            if (dbHe) { shortTitle = dbHe; secondaryTitle = rawName; }
        }
    }

    const poiCount = route.pois?.length || 0;
    const routeStyle = route.style || 'street';

    return (
        <button
            onClick={() => onSelect(route)}
            className="w-full flex items-center gap-5 bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 active:scale-[0.98] transition-all group overflow-hidden"
            dir={isHe ? 'rtl' : 'ltr'}
        >
            {/* Image Container with Badges */}
            <div className="relative w-20 h-20 rounded-[18px] overflow-hidden bg-slate-100 shrink-0 shadow-sm border border-slate-50">
                <GoogleImage
                    query={`${route.city} ${route.name}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Top-right: Style Icon Badge */}
                <div className={`absolute top-1.5 ${isHe ? 'left-1.5' : 'right-1.5'} bg-white/95 backdrop-blur-md p-1.5 rounded-[8px] shadow-sm border border-white/50 z-10`}>
                    {routeStyle === 'street' ? (
                        <Navigation size={10} className="text-indigo-600" />
                    ) : (
                        <MapIcon size={10} className="text-emerald-600" />
                    )}
                </div>

                {/* Bottom-right: Stations Count Chip */}
                {poiCount > 0 && (
                    <div className={`absolute bottom-1.5 ${isHe ? 'right-1.5' : 'left-1.5'} bg-indigo-600 text-white px-2 py-0.5 rounded-[6px] shadow-lg border border-indigo-400/30 flex items-center gap-1 z-10`}>
                        <Layers size={9} className="text-indigo-100" />
                        <span className="text-[10px] font-black tracking-tight leading-none">{poiCount}</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                {/* City Name - Small & Elegant */}
                <div className="flex items-center gap-1.5 opacity-60">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">
                        {localizedCity || route.city}
                    </span>
                </div>

                {/* Route Name - Up to 2 lines */}
                <h4 className={`text-[17px] font-medium text-slate-900 leading-[1.2] mb-0.5 line-clamp-2 transition-all ${isHe ? 'font-hebrew' : ''}`}>
                    {shortTitle}
                </h4>

                {/* Original Name - Small & Muted */}
                {secondaryTitle && secondaryTitle !== shortTitle && (
                    <p className="text-[11px] text-slate-400 font-light opacity-60 truncate w-full" dir="auto">
                        {secondaryTitle}
                    </p>
                )}
            </div>

            {/* Action Indicator - Minimal */}
            <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-slate-300 group-hover:text-indigo-500 transition-all duration-300`}>
                {isHe ? <ChevronLeft size={18} strokeWidth={2.5} /> : <ChevronRight size={18} strokeWidth={2.5} />}
            </div>
        </button>
    );
};
