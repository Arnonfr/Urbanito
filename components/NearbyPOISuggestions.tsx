import React, { useState, useEffect } from 'react';
import { POI, Route } from '../types';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import { GoogleImage } from './GoogleImage';

interface Props {
    route: Route;
    onAddPoi: (poi: POI) => void;
    isHe: boolean;
}

export const NearbyPOISuggestions: React.FC<Props> = ({ route, onAddPoi, isHe }) => {
    const [suggestions, setSuggestions] = useState<POI[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [addingPoiId, setAddingPoiId] = useState<string | null>(null);

    useEffect(() => {
        loadSuggestions();
    }, [route.id]);

    const loadSuggestions = async () => {
        setIsLoading(true);
        try {
            // TODO: Implement logic to fetch suggestions from:
            // 1. Existing POIs in DB near the route
            // 2. AI-generated suggestions
            // 3. Google Places API

            // Placeholder for now
            const mockSuggestions: POI[] = [];
            setSuggestions(mockSuggestions);
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPoi = async (poi: POI) => {
        setAddingPoiId(poi.id);
        try {
            await onAddPoi(poi);
        } finally {
            setAddingPoiId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="py-8 flex items-center justify-center">
                <Loader2 size={24} className="text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <MapPin size={12} className="text-indigo-500" />
                {isHe ? 'המלצות נוספות בסביבה' : 'Nearby Suggestions'}
            </h3>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                {suggestions.map((poi) => (
                    <div
                        key={poi.id}
                        className="flex-shrink-0 w-48 bg-white rounded-[12px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all"
                    >
                        <div className="relative h-32 bg-slate-100">
                            {poi.imageUrl && (
                                <GoogleImage
                                    query={poi.name}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>

                        <div className="p-3 space-y-2">
                            <h4 className="text-sm font-medium text-slate-900 line-clamp-2 leading-tight">
                                {poi.name.replace(/\s*\(.*?\)\s*/g, '')}
                            </h4>

                            <button
                                onClick={() => handleAddPoi(poi)}
                                disabled={addingPoiId === poi.id}
                                className="w-full h-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-[8px] flex items-center justify-center gap-2 text-xs font-medium transition-all disabled:opacity-50"
                            >
                                {addingPoiId === poi.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <>
                                        <Plus size={14} />
                                        {isHe ? 'הוסף למסלול' : 'Add to Tour'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
