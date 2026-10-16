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
                    <h3 className="text-lg font-display text-indigo-900">{isHe ? 'יצירת מסלול חדש' : 'Create New Route'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </motion.div>

                {/* Options List */}
                {/* Options List */}
                <div className="p-3 space-y-2">
                    <MenuItem
                        icon={<Crosshair size={22} />}
                        color="indigo"
                        title={isHe ? 'מסלול איזורי' : 'Area Tour'}
                        desc={isHe ? 'צור מסלול ברדיוס סביבך' : 'Create a route in a radius around you'}
                        onClick={() => onOptionSelect('area')}
                        delay={0.1}
                        isHe={isHe}
                    />
                    <MenuItem
                        icon={<Signpost size={22} />}
                        color="emerald"
                        title={isHe ? 'מסלול רחוב' : 'Street Tour'}
                        desc={isHe ? 'צור מסלול על רחוב ספיציפי' : 'Create a tour on a specific street'}
                        onClick={() => onOptionSelect('street')}
                        delay={0.15}
                        isHe={isHe}
                    />
                    <MenuItem
                        icon={<Compass size={22} />}
                        color="amber"
                        title={isHe ? 'מסלולים באזור' : 'Routes Nearby'}
                        desc={isHe ? 'מסלולים מוכנים באזור' : 'Ready trails in the area'}
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
        indigo: 'text-indigo-700 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white',
        emerald: 'text-emerald-700 group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white',
        amber: 'text-signal-600 group-hover:bg-signal-500 group-hover:border-signal-500 group-hover:text-white',
    };

    return (
        <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            onClick={onClick}
            className={`group w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 transition-all text-left ${isHe ? 'flex-row-reverse text-right' : ''}`}
        >
            <div className={`w-11 h-11 rounded-[12px] bg-white border border-slate-200 flex items-center justify-center shrink-0 transition-colors duration-300 ${colors[color]}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-black text-slate-800 leading-tight mb-0.5">{title}</h4>
                <p className="text-[12px] text-slate-500 font-medium truncate opacity-100 group-hover:text-slate-600">{desc}</p>
            </div>
        </motion.button>
    );
};
