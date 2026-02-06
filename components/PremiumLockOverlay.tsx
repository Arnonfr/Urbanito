import React from 'react';
import { Lock, Sparkles } from 'lucide-react';

interface PremiumLockOverlayProps {
    message?: string;
    compact?: boolean;
    onUpgradeClick?: () => void;
}

/**
 * Overlay displayed on premium-only content for free users.
 * Shows a lock icon and an upgrade CTA.
 */
export const PremiumLockOverlay: React.FC<PremiumLockOverlayProps> = ({
    message = 'Premium Content',
    compact = false,
    onUpgradeClick
}) => {
    const isHe = document.documentElement.lang === 'he' || document.documentElement.dir === 'rtl';

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-900/80 via-slate-800/60 to-transparent backdrop-blur-[2px] rounded-lg z-10">
            <div className={`text-center ${compact ? 'p-2' : 'p-4'}`}>
                <div className={`mx-auto mb-2 ${compact ? 'w-8 h-8' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg`}>
                    <Lock size={compact ? 14 : 20} className="text-white" />
                </div>
                <p className={`text-white font-medium ${compact ? 'text-xs' : 'text-sm'} mb-2`}>
                    {message}
                </p>
                {onUpgradeClick && (
                    <button
                        onClick={onUpgradeClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
                    >
                        <Sparkles size={12} />
                        {isHe ? 'שדרג לפרימיום' : 'Unlock Premium'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default PremiumLockOverlay;
