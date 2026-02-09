import React, { useState } from 'react';
import { usePremium } from '../contexts/PremiumContext';
import { Sparkles, Lock, Gift, Check, Crown } from 'lucide-react';

export const PremiumProfileSection: React.FC<{ isHe: boolean }> = ({ isHe }) => {
    const { isPremium, unlockWithCoupon } = usePremium();
    const [coupon, setCoupon] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleRedeem = async () => {
        if (!coupon.trim()) return;
        const result = await unlockWithCoupon(coupon);
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
        <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-indigo-200 fill-indigo-200/20" />
                        <span className="text-xs font-bold tracking-widest uppercase text-indigo-100">Limited Offer</span>
                    </div>
                    <h3 className="text-2xl font-black mb-1 leading-tight">
                        {isHe ? 'שדרג ל-Premium' : 'Go Premium'}
                    </h3>
                    <p className="text-sm text-indigo-100/90 mb-5 font-medium">
                        {isHe ? 'קבל גישה לכל המסלולים, אודיו באיכות גבוהה ותג פרימיום יוקרתי.' : 'Unlock all routes, high-quality audio, and a premium badge.'}
                    </p>

                    <button
                        onClick={() => setCoupon('DEV-UNLOCK')} // Auto-fill for now as requested/testing
                        className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Crown size={16} />
                        {isHe ? 'פתח חברות לכל החיים' : 'Unlock Lifetime Access'}
                    </button>
                    <p className="text-[10px] text-center mt-3 text-indigo-200 font-medium">
                        {isHe ? 'תשלום חד פעמי. גישה לכל החיים.' : 'Single payment. Lifetime access.'}
                    </p>
                </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Gift className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-700 text-sm">
                            {isHe ? 'יש לך קוד קופון?' : 'Got a Gift Code?'}
                        </h4>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder={isHe ? 'הזן קוד...' : 'Enter code...'}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase font-bold text-slate-600"
                    />
                    <button
                        onClick={handleRedeem}
                        className="bg-slate-900 text-white px-5 rounded-xl font-medium text-sm hover:bg-slate-800 active:scale-95 transition-all"
                    >
                        {isHe ? 'החל' : 'Apply'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-[10px] mt-2 font-bold text-center">{error}</p>}
                {success && <p className="text-green-600 text-[10px] mt-2 font-bold text-center flex items-center justify-center gap-1"><Check size={10} /> {isHe ? 'בוצע!' : 'Done!'}</p>}
            </div>
        </div>
    );
};
