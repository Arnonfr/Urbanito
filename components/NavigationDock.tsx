import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Map, Plus, User, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * @UIUX Agent Design Spec:
 * - "Island" design: Floating 24px from bottom.
 * - Glassmorphism: bg-white/80 + backdrop-blur-md + border-white/40.
 * - Active State: Text-indigo-600 + mild background glow.
 * - Interaction: Scale on tap (0.95).
 */

export const NavigationDock = ({ onCreateClick }: { onCreateClick?: () => void }) => {
    const location = useLocation();

    // Determine if we are in a sub-route (like viewing a route) where we might want to hide logic,
    // but for now, the dock is persistent as per PRD.

    const navItems = [
        { id: 'explore', label: 'Explore', path: '/', icon: Compass },
        { id: 'search', label: 'Search', path: '/search', icon: Map },
        { id: 'create', label: 'Create', path: '#', icon: Plus, isPrimary: true },
        { id: 'trips', label: 'My Trips', path: '/library', icon: FileText },
        { id: 'profile', label: 'Profile', path: '/profile', icon: User },
    ];

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none">
            <motion.nav
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl shadow-indigo-500/10 rounded-full px-6 py-3 flex items-center justify-between gap-1 w-full max-w-[360px] mx-auto"
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                    if (item.isPrimary) {
                        return (
                            <button
                                key={item.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (onCreateClick) onCreateClick();
                                }}
                                className="relative -mt-12 group"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-600/40 border-4 border-white transform transition-transform group-hover:-translate-y-1"
                                >
                                    <Plus className="w-8 h-8" strokeWidth={3} />
                                </motion.div>
                            </button>
                        );
                    }

                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            className="relative flex flex-col items-center justify-center w-16 h-12"
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`transition-all duration-300 ${isActive ? 'text-indigo-600 -translate-y-1' : 'text-slate-400'}`}>
                                        <item.icon
                                            size={24}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={isActive ? "fill-indigo-50" : ""}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-medium absolute bottom-0 transition-opacity duration-300 ${isActive ? 'opacity-100 text-indigo-600' : 'opacity-0 translate-y-2'}`}>
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute -bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </motion.nav>
        </div>
    );
};
