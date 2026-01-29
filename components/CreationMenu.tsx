import React, { useState } from 'react';
import { Radar, MapPinned, Footprints, Plus, X } from 'lucide-react';
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
                    borderRadius: 24,
                    width: 'min(90vw, 360px)',
                    height: 'auto',
                    y: -100,
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
                    stiffness: 300,
                    damping: 25,
                    mass: 0.8
                }}
                className="relative bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-indigo-500/10 overflow-hidden pointer-events-auto mx-auto flex flex-col"
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
                <div className="p-2 space-y-1">
                    <MenuItem
                        icon={<Radar size={20} />}
                        color="indigo"
                        title={isHe ? 'סיור חכם באזור' : 'Smart Area Tour'}
                        desc={isHe ? 'חוויה מותאמת אישית' : 'Curated just for you'}
                        onClick={() => onOptionSelect('area')}
                        delay={0.2}
                        isHe={isHe}
                    />
                    <MenuItem
                        icon={<Footprints size={20} />}
                        color="emerald"
                        title={isHe ? 'מסלול רחוב' : 'Street Route'}
                        desc={isHe ? 'הליכה לאורך רחוב' : 'Walk a specific street'}
                        onClick={() => onOptionSelect('street')}
                        delay={0.25}
                        isHe={isHe}
                    />
                    <MenuItem
                        icon={<MapPinned size={20} />}
                        color="amber"
                        title={isHe ? 'מסלולים מוכנים' : 'Ready Routes'}
                        desc={isHe ? 'מה שחם בסביבה' : 'Popular nearby'}
                        onClick={() => onOptionSelect('nearby')}
                        delay={0.3}
                        isHe={isHe}
                    />
                </div>

            </motion.div>
        </div>
    );
};

// Helper Component for Menu Items
const MenuItem = ({ icon, color, title, desc, onClick, delay, isHe }: any) => {
    // Enhanced colors for glassmorphism context
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white',
        emerald: 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white',
        amber: 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white',
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
                <h4 className="text-sm font-bold text-slate-800 leading-tight">{title}</h4>
                <p className="text-[11px] text-slate-500 font-medium truncate opacity-80">{desc}</p>
            </div>
        </motion.button>
    );
};
