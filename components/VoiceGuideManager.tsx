import React, { useEffect, useState } from 'react';
import { Route, POI } from '../types';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { getDistanceFromLatLonInMeters } from '../utils/geocoding';
import { useAudio } from '../contexts/AudioContext';
import {
    Volume2, Play, Pause, X, Headphones, Sparkles, User, Zap,
    ChevronUp, ChevronDown, RotateCcw, RotateCw, Gauge
} from 'lucide-react';

const TRIGGER_RADIUS = 40; // meters

interface Props {
    route: Route;
    language: 'he' | 'en';
}

export const VoiceGuideManager: React.FC<Props> = ({ route, language }) => {
    const { location } = useLiveLocation(true);
    const {
        playText,
        isPlaying,
        stop,
        pause,
        resume,
        currentItem,
        isAudioReady,
        unlockAudio,
        audioMode,
        setAudioMode,
        playbackRate,
        setPlaybackRate,
        progress,
        skip
    } = useAudio();

    const [visitedPois, setVisitedPois] = useState<Set<string>>(new Set());
    const [activePoi, setActivePoi] = useState<POI | null>(null);
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [showModeSelector, setShowModeSelector] = useState(false);
    const [showSpeedSelector, setShowSpeedSelector] = useState(false);

    // Calculate distance to nearest POI
    useEffect(() => {
        if (!location || !route || !route.pois) return;

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

        if (nearest && minDist < TRIGGER_RADIUS) {
            handlePoiTrigger(nearest);
        }

    }, [location, route, visitedPois]);

    const handlePoiTrigger = (poi: POI) => {
        if (visitedPois.has(poi.id)) return;

        setVisitedPois(prev => new Set(prev).add(poi.id));
        setActivePoi(poi);

        const textToRead = poi.historicalAnalysis || poi.description || poi.summary || poi.narrative || (language === 'he' ? `הגעת ל${poi.name}` : `You have arrived at ${poi.name}`);

        if (isAutoPlay && isAudioReady) {
            playText(textToRead, language, poi.id, 'high');
        }
    };

    const handleManualPlay = async () => {
        if (!activePoi && !currentItem) return;
        await unlockAudio();

        if (currentItem && !isPlaying) {
            resume();
            return;
        }

        const target = currentItem ? currentItem : activePoi;
        if (!target) return;

        const text = (target as any).historicalAnalysis || (target as any).description || (target as any).summary || (target as any).narrative || (target as any).text || (target as any).name;
        playText(text, language, target.id, 'high');
        setIsAutoPlay(true);
    };

    if (!currentItem && !activePoi) return null;

    const isPremium = audioMode === 'premium';
    const rates = [0.75, 1, 1.25, 1.5, 2];

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[60] animate-in fade-in slide-in-from-bottom-5 duration-300">
            {/* Mode & Speed Selector Tooltips */}
            {(showModeSelector || showSpeedSelector) && (
                <div className="absolute bottom-full left-0 right-0 mb-3 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-white/10 animate-in zoom-in-95 fade-in duration-200 origin-bottom">
                    {showModeSelector && (
                        <>
                            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                {language === 'he' ? 'בחר איכות שמע' : 'Select Audio Quality'}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => { setAudioMode('free'); setShowModeSelector(false); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${!isPremium ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-white/5 hover:bg-white/10'}`}
                                >
                                    <User className="w-5 h-5" />
                                    <div className="text-center">
                                        <div className="text-xs font-bold">{language === 'he' ? 'חינם' : 'Free'}</div>
                                        <div className="text-[10px] opacity-70 leading-tight whitespace-nowrap">{language === 'he' ? 'קריינות רובוטית' : 'Robot Voice'}</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { setAudioMode('premium'); setShowModeSelector(false); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${isPremium ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-white/5 hover:bg-white/10'}`}
                                >
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                    <div className="text-center">
                                        <div className="text-xs font-bold">{language === 'he' ? 'פרימיום' : 'Premium'}</div>
                                        <div className="text-[10px] opacity-70 leading-tight whitespace-nowrap">{language === 'he' ? 'קריינות אנושית' : 'AI Human'}</div>
                                    </div>
                                </button>
                            </div>
                        </>
                    )}

                    {showSpeedSelector && (
                        <>
                            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-400" />
                                {language === 'he' ? 'מהירות הקראה' : 'Playback Speed'}
                            </h4>
                            <div className="flex justify-between gap-1">
                                {rates.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => { setPlaybackRate(r); setShowSpeedSelector(false); }}
                                        className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all ${playbackRate === r ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        {r}x
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl p-4 border border-white/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 ${isPlaying ? 'bg-indigo-600 text-white shadow-indigo-200 scale-105' : 'bg-slate-100 text-slate-500'}`}
                        >
                            {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : <Headphones className="w-6 h-6" />}
                        </div>

                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                                {isPlaying ? (
                                    <>
                                        <span className="flex gap-0.5 h-3 items-end">
                                            <span className="w-0.5 h-1.5 bg-indigo-500 animate-[bounce_1s_infinite_0s]"></span>
                                            <span className="w-0.5 h-2.5 bg-indigo-500 animate-[bounce_1s_infinite_0.1s]"></span>
                                            <span className="w-0.5 h-2 bg-indigo-500 animate-[bounce_1s_infinite_0.2s]"></span>
                                        </span>
                                        {language === 'he' ? 'משמיע כעת' : 'Live Narration'}
                                    </>
                                ) : (
                                    language === 'he' ? 'מוכן להקראה' : 'Audio Guide Ready'
                                )}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 truncate pr-4">
                                {currentItem?.poiId ? route.pois.find(p => p.id === currentItem.poiId)?.name : (activePoi?.name || (language === 'he' ? 'סיור קולי' : 'Voice Guide'))}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Speed Selector Toggle */}
                        <button
                            onClick={() => { setShowSpeedSelector(!showSpeedSelector); setShowModeSelector(false); }}
                            className={`p-2 rounded-xl border transition-all font-bold text-[10px] ${showSpeedSelector ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                        >
                            {playbackRate}x
                        </button>

                        {/* Mode Selector Toggle */}
                        <button
                            onClick={() => { setShowModeSelector(!showModeSelector); setShowSpeedSelector(false); }}
                            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${isPremium ? 'border-yellow-200 bg-yellow-50 text-yellow-700 font-bold text-[10px]' : 'border-slate-200 bg-slate-50 text-slate-500 font-bold text-[10px]'}`}
                        >
                            {isPremium ? <Zap className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            {showModeSelector ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => skip(-15)}
                            className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => skip(15)}
                            className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            <RotateCw className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isPlaying ? (
                            <button
                                onClick={handleManualPlay}
                                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-90 transition-all"
                            >
                                <Play className="w-6 h-6 fill-current ml-0.5" />
                            </button>
                        ) : (
                            <button
                                onClick={pause}
                                className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-xl"
                            >
                                <Pause className="w-6 h-6 fill-current" />
                            </button>
                        )}

                        <button
                            onClick={() => { stop(); setActivePoi(null); }}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 100% { height: 4px; }
                    50% { height: 12px; }
                }
            `}</style>
        </div>
    );
};
