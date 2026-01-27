import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarPOI, useWalkMode } from '../contexts/WalkModeContext';
import { Compass, Navigation, X, Headphones, MapPin, Footprints } from 'lucide-react';

interface Props {
    onClose: () => void;
    isHe: boolean;
}

export const RadarView: React.FC<Props> = ({ onClose, isHe }) => {
    const { radarPois, heading, nearestPoi, isScanning } = useWalkMode();
    const [maxRange, setMaxRange] = useState(150);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedPois, setSimulatedPois] = useState<RadarPOI[]>([]);

    // Toggle Simulation
    useEffect(() => {
        if (!isSimulating) {
            setSimulatedPois([]);
            return;
        }

        // Create fake POIs scattered around
        const fakes: RadarPOI[] = [
            { id: 'sim-1', name: isHe ? 'בית הקפה ההיסטורי' : 'Historic Cafe', lat: 0, lng: 0, distance: 30, bearing: 0, relativeBearing: 0, description: 'Simulated POI ahead', content: {} } as any,
            { id: 'sim-2', name: isHe ? 'פסל האריה' : 'Lion Statue', lat: 0, lng: 0, distance: 80, bearing: 90, relativeBearing: 45, description: 'Simulated POI to the right', content: {} } as any,
            { id: 'sim-3', name: isHe ? 'העץ העתיק' : 'Ancient Tree', lat: 0, lng: 0, distance: 120, bearing: 270, relativeBearing: -60, description: 'Simulated POI to the left', content: {} } as any,
        ];
        setSimulatedPois(fakes);

        // Animate them slightly? For now static is fine to prove the UI work.
    }, [isSimulating, isHe]);

    // Use genuine POIs or Simulated ones
    const displayPois = isSimulating ? simulatedPois : radarPois;

    // Filter POIs within view range
    const visiblePois = displayPois.filter(p => p.distance <= maxRange * 1.2);

    return (
        <div className="fixed inset-0 z-[9000] bg-slate-900 text-white flex flex-col items-center overflow-hidden font-sans animate-in fade-in duration-300">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at center, #6366F1 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px, 80px 80px, 80px 80px'
                }}
            />

            {/* Header */}
            <div className="absolute top-0 inset-x-0 h-24 pt-safe-top px-4 flex justify-between items-center z-20 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Compass className="w-6 h-6 text-indigo-400" />
                        {isHe ? 'מצב שוטטות' : 'Walk & Talk'}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-medium tracking-widest uppercase flex items-center gap-2">
                        {isHe ? 'מכ"ם דינמי פעיל' : 'Dynamic Radar Active'}
                        <button
                            onClick={() => setIsSimulating(!isSimulating)}
                            className={`px-2 py-0.5 rounded text-[9px] border ${isSimulating ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-white/5 text-slate-500 border-white/10'}`}
                        >
                            {isSimulating ? 'SIM ON' : 'TEST'}
                        </button>
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform hover:bg-white/20"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Radar Display Container */}
            <div className="relative flex-1 w-full flex items-center justify-center mt-10">

                {/* Radar Circles */}
                <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px]">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 border border-indigo-500/20 rounded-full" />
                    {/* Mid Ring */}
                    <div className="absolute inset-[25%] border border-indigo-500/10 rounded-full" />
                    {/* Scanner Line */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 w-1/2 h-1 bg-gradient-to-r from-indigo-500/50 to-transparent origin-left animate-[radar-spin_3s_linear_infinite]" />
                    </div>
                    {/* User Pin (Center) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)] z-10 ring-4 ring-indigo-900/50">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-300 whitespace-nowrap">
                            {Math.round(heading)}°
                        </div>
                    </div>

                    {/* POI Blips */}
                    <AnimatePresence>
                        {visiblePois.map(poi => {
                            // Calculate position relative to center
                            // relativeBearing is 0 when straight ahead.
                            // In CSS top/left/transform system:
                            // We mapped 0 deg (North/Forward) to Up.
                            // Angle in radians needed for Math.sin/cos needs standard unit circle (0 = East).
                            // But here we use rotation approach simpler:
                            // Rotate a container by the relative bearing.

                            // Let's explicitly calculate x,y offset from center (0,0)
                            // Forward (0 deg) -> (0, -r)
                            // Right (90 deg) -> (r, 0)
                            const angleRad = (poi.relativeBearing - 90) * (Math.PI / 180); // -90 to align 0 with top
                            const r = (poi.distance / maxRange) * 50; // % of container half-width (radius)

                            // Clamp r to keep inside visual bounds mostly
                            const clampedR = Math.min(r, 48);

                            const x = 50 + (clampedR * Math.cos(angleRad)); // % left
                            const y = 50 + (clampedR * Math.sin(angleRad)); // % top

                            const isTarget = nearestPoi?.id === poi.id;

                            return (
                                <motion.div
                                    key={poi.id}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: isTarget ? 1 : 0.7,
                                        scale: isTarget ? 1.2 : 1,
                                        left: `${x}%`,
                                        top: `${y}%`
                                    }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-20`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${isTarget ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'bg-white/60 shadow-sm'} transition-colors`} />
                                    <span className={`text-[9px] mt-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur max-w-[80px] truncate transition-opacity ${isTarget ? 'opacity-100 text-amber-300' : 'opacity-0 group-hover:opacity-100 text-white/80'}`}>
                                        {poi.name}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Distance Scale Labels */}
                <div className="absolute top-1/2 right-4 text-[10px] text-white/20 flex flex-col gap-8 items-end pointer-events-none">
                    <span>{maxRange}m</span>
                    <span>{maxRange / 2}m</span>
                </div>
            </div>

            {/* Bottom Card - Active POI */}
            <AnimatePresence>
                {nearestPoi && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-24 inset-x-6 bg-slate-800/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl flex items-center gap-4 max-h-[160px] overflow-hidden"
                    >
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                            <MapPin size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate mb-1">{nearestPoi.name}</h3>
                            <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                                <Footprints size={12} />
                                <span>{Math.round(nearestPoi.distance)}m away</span>
                            </div>
                            <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                                {nearestPoi.summary || nearestPoi.description || (isHe ? "מזוהה על ידי המכ״ם..." : "Detected by radar...")}
                            </p>
                        </div>
                        <div className="shrink-0 flex flex-col gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-auto" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Footer */}
            <div className="h-20 w-full flex items-center justify-center text-white/30 text-[10px] uppercase tracking-[0.2em] font-medium border-t border-white/5 bg-black/20 backdrop-blur">
                {isScanning ? (
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        Scanning Sector...
                    </span>
                ) : (
                    <span>Radar Active • {radarPois.length} Signals</span>
                )}
            </div>

            <style>{`
                @keyframes radar-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
