import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Plus, X, Search, Route as RouteIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NavigationDock = ({
    onCreateClick,
    onLibraryClick,
    isAiMenuOpen = false
}: {
    onCreateClick?: () => void;
    onLibraryClick?: () => void;
    isAiMenuOpen?: boolean;
}) => {
    const location = useLocation();

    // Determine active states
    const isLibraryActive = location.pathname === '/library';
    const isExploreActive = location.pathname === '/' || location.pathname === '';

    return (
        <div className="fixed inset-x-0 bottom-0 pointer-events-none z-[8000]" dir="ltr">

            {/* FAB for Creation */}
            <div className="absolute bottom-24 right-5">
                <button
                    onClick={onCreateClick}
                    className={`pointer-events-auto w-14 h-14 rounded-full shadow-[0_8px_16px_rgba(211,47,47,0.3)] flex items-center justify-center active:scale-95 transition-all duration-300 z-[9000] ${isAiMenuOpen
                        ? 'bg-slate-900 text-white shadow-xl'
                        : 'bg-[#DE4C3A] text-white hover:bg-[#c94131]'
                        }`}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isAiMenuOpen ? 'close' : 'plus'}
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isAiMenuOpen ? <X size={26} strokeWidth={2.5} /> : <Plus size={26} strokeWidth={2.5} />}
                        </motion.div>
                    </AnimatePresence>
                </button>
            </div>

            {/* Bottom Pill Navigation */}
            <motion.nav
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-full px-8 py-3 flex items-center gap-12"
            >
                {/* Library / Trips */}
                <button
                    onClick={onLibraryClick}
                    className="group relative flex flex-col items-center gap-1 transition-all duration-300 ease-out"
                >
                    <div className={`transition-transform duration-300 group-active:scale-90 ${isLibraryActive ? 'text-[#DE4C3A]' : 'text-slate-400'}`}>
                        <RouteIcon size={24} strokeWidth={isLibraryActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wide ${isLibraryActive ? 'text-[#DE4C3A]' : 'text-slate-400'}`}>
                        Trips
                    </span>
                </button>

                {/* Explore / Search */}
                <NavLink
                    to="/"
                    className="group relative flex flex-col items-center gap-1 transition-all duration-300 ease-out"
                >
                    <div className={`transition-transform duration-300 group-active:scale-90 ${isExploreActive ? 'text-[#DE4C3A]' : 'text-slate-400'}`}>
                        <Search size={24} strokeWidth={isExploreActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wide ${isExploreActive ? 'text-[#DE4C3A]' : 'text-slate-400'}`}>
                        Explore
                    </span>
                </NavLink>
            </motion.nav>
        </div>
    );
};

