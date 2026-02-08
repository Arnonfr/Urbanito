import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

type PremiumTier = 'free' | 'premium';

interface PremiumContextType {
    tier: PremiumTier;
    isPremium: boolean;
    unlockWithCoupon: (code: string) => Promise<boolean>;
    clearPremium: () => void; // For debugging/testing
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const usePremium = () => {
    const context = useContext(PremiumContext);
    if (!context) {
        throw new Error('usePremium must be used within a PremiumProvider');
    }
    return context;
};

const VALID_COUPONS = ['URBAN-PRO-2026', 'PARIS-MAGIC', 'DEV-UNLOCK'];

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tier, setTier] = useState<PremiumTier>('free');

    useEffect(() => {
        // Check local storage on mount ONLY if user is logged in
        const checkPremiumStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // User is logged in, check for saved premium status
                const savedTier = localStorage.getItem('urbanito_tier') as PremiumTier;
                const legacyAudioMode = localStorage.getItem('urbanito_audio_mode');

                if (savedTier === 'premium' || legacyAudioMode === 'premium') {
                    setTier('premium');
                } else {
                    setTier('free');
                }
            } else {
                // User is NOT logged in
                // CHECK LOCAL STORAGE ANYWAY (For Dev/Testing Override)
                const savedTier = localStorage.getItem('urbanito_tier') as PremiumTier;
                if (savedTier === 'premium') {
                    setTier('premium'); // Allow sticky premium for testing
                } else {
                    setTier('free');
                    localStorage.removeItem('urbanito_tier');
                    localStorage.removeItem('urbanito_audio_mode');
                }
            }
        };

        checkPremiumStatus();
    }, []);

    const unlockWithCoupon = async (code: string): Promise<boolean> => {
        const normalizeCode = code.trim().toUpperCase();

        // Check if it's a research coupon from Supabase
        try {
            const { data, error } = await supabase
                .from('research_coupons')
                .select('code, is_used')
                .eq('code', normalizeCode)
                .single();

            if (!error && data && !data.is_used) {
                setTier('premium');
                localStorage.setItem('urbanito_tier', 'premium');
                localStorage.setItem('urbanito_audio_mode', 'premium');
                return true;
            }
        } catch (err) {
            console.error('Error validating coupon:', err);
        }

        // Fallback to legacy hardcoded coupons
        if (VALID_COUPONS.includes(normalizeCode)) {
            setTier('premium');
            localStorage.setItem('urbanito_tier', 'premium');
            localStorage.setItem('urbanito_audio_mode', 'premium');
            return true;
        }

        return false;
    };

    const clearPremium = () => {
        setTier('free');
        localStorage.removeItem('urbanito_tier');
        localStorage.removeItem('urbanito_audio_mode');
        window.location.reload();
    };

    const value = {
        tier,
        isPremium: tier === 'premium',
        unlockWithCoupon,
        clearPremium
    };

    return (
        <PremiumContext.Provider value={value}>
            {children}
        </PremiumContext.Provider>
    );
};
