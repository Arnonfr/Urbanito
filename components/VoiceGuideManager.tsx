import React, { useEffect, useState, useMemo } from 'react';
import { Route, POI } from '../types';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { getDistanceFromLatLonInMeters } from '../utils/geocoding';
import { useAudio } from '../contexts/AudioContext';
import { Volume2, Play, Pause, SkipForward, X, Headphones } from 'lucide-react';

const TRIGGER_RADIUS = 40; // meters

interface Props {
    route: Route;
    language: 'he' | 'en';
}

export const VoiceGuideManager: React.FC<Props> = ({ route, language }) => {
    const { location } = useLiveLocation(true);
    const {
        playText,
        queueText,
        isPlaying,
        stop,
        pause,
        resume,
        currentItem,
        queue,
        isAudioReady,
        unlockAudio
    } = useAudio();

    const [visitedPois, setVisitedPois] = useState<Set<string>>(new Set());
    const [activePoi, setActivePoi] = useState<POI | null>(null);
    const [isAutoPlay, setIsAutoPlay] = useState(false); // Default off? Or prompt?

    // Calculate distance to nearest POI
    useEffect(() => {
        if (!location || !route || !route.pois) return;

        // Find nearest POI
        let nearest: POI | null = null;
        let minDist = Infinity;

        for (const poi of route.pois) {
            if (visitedPois.has(poi.id)) continue;

            const d = getDistanceFromLatLonInMeters(
                location.lat,
                location.lng,
                poi.lat,
                poi.lng
            );

            if (d < minDist) {
                minDist = d;
                nearest = poi;
            }
        }

        // Trigger if close enough
        if (nearest && minDist < TRIGGER_RADIUS) {
            handlePoiTrigger(nearest);
        }

    }, [location, route, visitedPois]);

    const handlePoiTrigger = (poi: POI) => {
        if (visitedPois.has(poi.id)) return;

        // Mark as visited to avoid double trigger
        setVisitedPois(prev => new Set(prev).add(poi.id));
        setActivePoi(poi);

        // Content to read
        const textToRead = poi.narrative || poi.description || `You have arrived at ${poi.name}`;

        if (isAutoPlay && isAudioReady) {
            playText(textToRead, language, poi.id, 'high');
        } else {
            // Just queue or show UI?
            // We'll queue it as "pending" if we had that state, but Queue puts it in line.
            // Here we want to prompt the user or queue it if they hit play.
            // Actually user probably wants to hear it if they are walking with headphones.
            // If isAutoPlay is false, we just show "Arrived at X" and button to play.
        }
    };

    const handleManualPlay = async () => {
        if (!activePoi) return;
        await unlockAudio();
        const text = activePoi.narrative || activePoi.description || activePoi.name;
        playText(text, language, activePoi.id, 'high');
        setIsAutoPlay(true); // Enable auto-play for future
    };

    if (!currentItem && !activePoi) return null;

    const displayText = currentItem?.text || activePoi?.name || "Ready";
    const truncatedText = displayText.length > 50 ? displayText.substring(0, 50) + '...' : displayText;

    return (
        <div className="fixed bottom-24 left-4 right-4 bg-white/95 backdrop-blur-md shadow-xl rounded-xl p-4 border border-indigo-100 z-50 flex items-center justify-between transition-all duration-300 transform translate-y-0">
            <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    {isPlaying ? <Volume2 className="animate-pulse w-5 h-5" /> : <Headphones className="w-5 h-5" />}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-medium text-indigo-500 uppercase tracking-wider">
                        {isPlaying ? (language === 'he' ? 'משמיע כעת' : 'Now Playing') : (language === 'he' ? 'הגעת לנקודה' : 'You Arrived')}
                    </span>
                    <span className="text-sm font-bold text-slate-800 truncate leading-tight">
                        {currentItem?.poiId ? route.pois.find(p => p.id === currentItem.poiId)?.name : (activePoi?.name || "Voice Guide")}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {!isPlaying && activePoi && (
                    <button
                        onClick={handleManualPlay}
                        className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                )}

                {isPlaying && (
                    <button
                        onClick={pause}
                        className="w-10 h-10 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <Pause className="w-5 h-5 fill-current" />
                    </button>
                )}

                {isPlaying && (
                    <button
                        onClick={stop}
                        className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-50 flex items-center justify-center"
                    >
                        <SkipForward className="w-4 h-4" />
                    </button>
                )}

                <button
                    onClick={() => { stop(); setActivePoi(null); }}
                    className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-50 flex items-center justify-center"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
