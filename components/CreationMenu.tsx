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

            {/* Bottom Sheet Container */}
            <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white rounded-t-[32px] shadow-2xl pb-[env(safe-area-inset-bottom)] pointer-events-auto flex flex-col mt-auto"
            >
                {/* Drag Indicator */}
                <div className="w-full flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>

                {/* Header Content */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">{isHe ? 'יצירת מסלול חדש' : 'Create New Route'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Options List */}
                {/* Options List */}
                <div className="p-3 space-y-2">
                    <MenuItem
                        icon={<Crosshair size={22} className="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                        color="indigo"
                        title={isHe ? 'מסלול איזורי' : 'Area Tour'}
                        desc={isHe ? 'צור מסלול ברדיוס סביבך' : 'Create a route in a radius around you'}
                        onClick={() => onOptionSelect('area')}
                        delay={0.1}
                        isHe={isHe}
                    />
                    <MenuItem
                        icon={<Signpost size={22} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                        color="emerald"
                        title={isHe ? 'מסלול רחוב' : 'Street Tour'}
                        desc={isHe ? 'צור מסלול על רחוב ספיציפי' : 'Create a tour on a specific street'}
                        onClick={() => onOptionSelect('street')}
                        delay={0.15}
                        isHe={isHe}
                    />
                    <MenuItem
                        icon={<Compass size={22} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
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
        indigo: 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white',
        emerald: 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
        amber: 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    };

    return (
        <button
            onClick={onClick}
            className={`group w-full flex items-center gap-4 p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left border-b border-slate-50 last:border-0 ${isHe ? 'flex-row-reverse text-right' : ''}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-slate-500 bg-slate-50`}>
                {React.cloneElement(icon, { className: '', strokeWidth: 2, size: 20 })}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-black text-slate-800 leading-tight mb-0.5">{title}</h4>
                <p className="text-[12px] text-slate-500 font-medium truncate opacity-100 group-hover:text-slate-600">{desc}</p>
            </div>
        </button>
    );
};
