import React, { useState } from 'react';
import { Crosshair, Signpost, Compass, Plus, X, Route } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onOptionSelect: (option: 'area' | 'street' | 'nearby') => void;
    onClose: () => void;
    isHe: boolean;
}

export const CreationMenu: React.FC<Props> = ({ onOptionSelect, onClose, isHe }) => {
    return (
        <div className="fixed inset-0 z-[7000] flex items-end justify-center pointer-events-none">

            {/* Backdrop - Animate opacity */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] pointer-events-auto"
                onClick={onClose}
            />

            {/* The Liquid Container - Deep Glassmorphism */}
            <motion.div
                layoutId="create-menu-container"
                initial={{ borderRadius: 28, width: 56, height: 56, y: -28, opacity: 0 }}
                animate={{
                    borderRadius: 32,
                    width: 'min(92vw, 400px)',
                    height: 'auto',
                    y: -110,
                    opacity: 1
                }}
                exit={{
                    borderRadius: 28,
                    width: 56,
                    height: 10,
                    y: 0,
                    opacity: 0
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8
                }}
                className="relative bg-white/90 backdrop-blur-3xl border border-white/40 shadow-2xl shadow-indigo-500/10 overflow-hidden pointer-events-auto mx-auto flex flex-col"
                style={{ transformOrigin: "bottom center" }}
            >

                {/* Header Content */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-5 pb-2 flex items-center justify-between border-b border-white/20"
                >
                    <h3 className="text-sm font-bold text-slate-800">{isHe ? 'יצירת מסלול חדש' : 'Create New Route'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </motion.div>

                {/* Options List */}
                <div className="p-3 space-y-2">
                    <MenuItem
                        icon={<Crosshair size={22} className="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                        color="indigo"
                        title={isHe ? 'סיור אזורי' : 'Regional Tour'}
                        desc={isHe ? 'בינה מלאכותית שתופרת לך חוויה' : 'AI-tailored experience'}
                        onClick={() => onOptionSelect('area')}
                        delay={0.1}
                        isHe={isHe}
                    />
                    <MenuItem
                        icon={<Signpost size={22} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                        color="emerald"
                        title={isHe ? 'סיור רחוב' : 'Street Tour'}
                        desc={isHe ? 'גל פנינים לאורך הציר' : 'Discover gems along the way'}
                        onClick={() => onOptionSelect('street')}
                        delay={0.15}
                        isHe={isHe}
                    />
                    <MenuItem
                        icon={<Compass size={22} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                        color="amber"
                        title={isHe ? 'מסלולים באיזור' : 'Routes Nearby'}
                        desc={isHe ? 'המסלולים הקרובים ביותר אליך' : 'Top routes in your area'}
                        onClick={() => onOptionSelect('nearby')}
                        delay={0.2}
                        isHe={isHe}
                    />
                </div>

            </motion.div>
        </div>
    );
};

// Helper Component for Menu Items
const MenuItem = ({ icon, color, title, desc, onClick, delay, isHe }: any) => {
    // Enhanced colors for glassmorphism context - Deeper and richer as requested
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white',
        emerald: 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
        amber: 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    };

    return (
        <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            onClick={onClick}
            className={`group w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 transition-all text-left ${isHe ? 'flex-row-reverse text-right' : ''}`}
        >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 backdrop-blur-sm ${colors[color]}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-black text-slate-800 leading-tight mb-0.5">{title}</h4>
                <p className="text-[12px] text-slate-500 font-medium truncate opacity-100 group-hover:text-slate-600">{desc}</p>
            </div>
        </motion.button>
    );
};
