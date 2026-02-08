import React, { useState } from 'react';
import { usePremium } from '../contexts/PremiumContext';
import { Crown, User, RefreshCw } from 'lucide-react';

/**
 * Development Testing Panel
 * Only visible for admin user (arnon7700@gmail.com)
 */
export const DevTestingPanel: React.FC<{ user: any }> = ({ user }) => {
    const { isPremium, tier, clearPremium, unlockWithCoupon } = usePremium();
    const [isVisible, setIsVisible] = useState(true);

    // Only show for admin user OR if manually enabled via console
    const isAdmin = user?.email === 'arnon7700@gmail.com' || localStorage.getItem('urbanito_dev') === 'true';
    if (!isAdmin) return null;

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="fixed bottom-32 right-6 z-[1000000] w-12 h-12 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 border-2 border-white ring-4 ring-indigo-500/20"
                title="Dev Testing Panel"
            >
                {isPremium ? <Crown size={22} className="fill-white/20" /> : <User size={22} />}
            </button>

            {/* Panel */}
            {isVisible && (
                <div className="fixed bottom-48 right-6 z-[1000001] bg-white rounded-2xl shadow-2xl border-2 border-indigo-100 p-4 w-72 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <RefreshCw size={17} className="text-indigo-600" />
                            Dev Engine
                        </h3>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                        >
                            ×
                        </button>
                    </div>

                    {/* Current Status */}
                    <div className={`mb-3 p-3 rounded-xl border-2 ${isPremium ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="text-xs font-medium text-slate-500 mb-1">Current Tier</div>
                        <div className="flex items-center gap-2">
                            {isPremium ? (
                                <>
                                    <Crown size={18} className="text-indigo-600 fill-indigo-50" />
                                    <span className="font-bold text-indigo-600 tracking-tight">PREMIUM ACTIVE</span>
                                </>
                            ) : (
                                <>
                                    <User size={18} className="text-slate-400" />
                                    <span className="font-bold text-slate-500 tracking-tight">FREE TIER</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2.5">
                        {!isPremium ? (
                            <button
                                onClick={() => unlockWithCoupon('URBAN-PRO-2026')}
                                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100 uppercase tracking-wider"
                            >
                                Activate Pro Mode
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    clearPremium();
                                    // reload happens in clearPremium
                                }}
                                className="w-full bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-slate-900 active:scale-95 transition-all shadow-md uppercase tracking-wider"
                            >
                                Reset to Free
                            </button>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg font-medium text-sm hover:bg-slate-200 active:scale-95 transition-all"
                        >
                            Reload App
                        </button>
                    </div>

                    {/* Info */}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="text-xs text-slate-500">
                            <div className="font-medium mb-1">Test Features:</div>
                            <ul className="space-y-0.5 text-[11px]">
                                <li>• Audio Quality (Premium AI vs Free TTS)</li>
                                <li>• Offline Download (Premium only)</li>
                                <li>• Extended Content</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
