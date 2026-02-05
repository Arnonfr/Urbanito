import React, { useState } from 'react';
import { usePremium } from '../contexts/PremiumContext';
import { Sparkles, Lock, Gift, Check, Crown } from 'lucide-react';

export const PremiumProfileSection: React.FC<{ isHe: boolean }> = ({ isHe }) => {
    const { isPremium, unlockWithCoupon } = usePremium();
    const [coupon, setCoupon] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleRedeem = () => {
        if (!coupon.trim()) return;
        const result = unlockWithCoupon(coupon);
        if (result) {
            setSuccess(true);
            setError('');
            // Optional: trigger confetti or animation
        } else {
            setError(isHe ? 'קוד קופון שגוי' : 'Invalid coupon code');
            setSuccess(false);
        }
    };

    if (isPremium) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 relative overflow-hidden group">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-indigo-100">
                        <Crown className="w-6 h-6 text-indigo-500 fill-indigo-100" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">
                            {isHe ? 'Urbanito Premium' : 'Urbanito Premium'}
                        </h3>
                        <p className="text-slate-600 text-sm">
                            {isHe ? 'חברות פעילה לכל החיים 💎' : 'Lifetime Membership Active 💎'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Free Tier View
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">
                        {isHe ? 'יש לך קוד קופון?' : 'Got a Gift Code?'}
                    </h3>
                    <p className="text-xs text-slate-500">
                        {isHe ? 'הזן אותו כאן כדי לשדרג לפרימיום' : 'Enter it here to unlock Premium'}
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder={isHe ? 'לדוגמה: URBAN-PRO-2026' : 'Ex: URBAN-PRO-2026'}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center uppercase tracking-wider font-medium placeholder:normal-case placeholder:tracking-normal"
                />
                <button
                    onClick={handleRedeem}
                    className="bg-slate-900 text-white px-5 rounded-xl font-medium text-sm hover:bg-slate-800 active:scale-95 transition-all"
                >
                    {isHe ? 'ממש' : 'Redeem'}
                </button>
            </div>
            {error && (
                <p className="text-red-500 text-xs mt-2 font-medium text-center animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
            {success && (
                <p className="text-green-600 text-xs mt-2 font-medium text-center flex items-center justify-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <Check size={12} /> {isHe ? 'הקוד נקלט בהצלחה!' : 'Code accepted! Welcome to Premium.'}
                </p>
            )}
        </div>
    );
};
