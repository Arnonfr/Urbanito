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
            className="w-full flex items-center gap-4 bg-white py-4 px-2 border-b border-slate-100 hover:bg-slate-50 active:bg-slate-100 transition-colors group text-left"
            dir={isHe ? 'rtl' : 'ltr'}
        >
            {/* Image Container with Badges */}
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                <GoogleImage
                    query={`${route.city} ${route.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    existingUrl={route.pois?.[0]?.imageUrl}
                />

                {/* Removed floating badges to keep it minimal and Todoist-like */}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5 mt-1">
                {/* City Name - Small & Elegant */}
                <div className="flex items-center gap-1.5 opacity-60">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">
                        {localizedCity || route.city}
                    </span>
                </div>

                {/* Route Name - Up to 2 lines */}
                <h4 className={`text-[16px] font-medium text-slate-900 leading-[1.3] mb-0.5 line-clamp-1 transition-all ${isHe ? 'font-hebrew text-right w-full' : ''}`}>
                    {shortTitle}
                </h4>

                {/* Metadata row (Todoist style) */}
                <div className={`flex flex-wrap items-center gap-2 text-[12px] text-slate-400 ${isHe ? 'flex-row-reverse w-full' : ''}`}>
                    {poiCount > 0 && (
                        <span className="flex items-center gap-1">
                            <Layers size={12} className={routeStyle === 'street' ? 'text-indigo-500' : 'text-emerald-500'} />
                            {poiCount} {isHe ? 'נקודות' : 'stops'}
                        </span>
                    )}
                    {secondaryTitle && secondaryTitle !== shortTitle && (
                        <span className="truncate max-w-[120px] font-light">
                            • {secondaryTitle}
                        </span>
                    )}
                </div>
            </div>

            {/* Action Indicator - Minimal */}
            <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-slate-300 group-hover:text-indigo-500 transition-all duration-300`}>
                {isHe ? <ChevronLeft size={18} strokeWidth={2.5} /> : <ChevronRight size={18} strokeWidth={2.5} />}
            </div>
        </button>
    );
};
