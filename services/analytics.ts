import React, { useEffect } from 'react';
import ReactGA from 'react-ga4';

// Initialize GA4 with the Measurement ID
// In production, this should come from VITE_GA_MEASUREMENT_ID
const getTrackingId = () => {
    // @ts-ignore
    const viteKey = import.meta.env?.VITE_GA_MEASUREMENT_ID;
    if (viteKey) return viteKey;

    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env) {
            return process.env.VITE_GA_MEASUREMENT_ID || "G-MHP5DG87W8";
        }
    } catch (e) { }

    return "G-MHP5DG87W8"; // Default fallback (the urbantour ID found)
};

const isProd = () => {
    try {
        // @ts-ignore
        return import.meta.env?.PROD || process.env?.NODE_ENV === 'production';
    } catch (e) {
        return false;
    }
};

export const initGA = () => {
    const id = getTrackingId();
    if (isProd() && id) {
        ReactGA.initialize(id);
        console.log("📊 Google Analytics initialized:", id);
    }
};

export const logPageView = () => {
    if (isProd()) {
        ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }
};

export const logEvent = (category: string, action: string, label?: string) => {
    if (isProd()) {
        ReactGA.event({
            category,
            action,
            label,
        });
    }
};

/**
 * Analytics Hook for page tracking
 */
export const useAnalytics = () => {
    useEffect(() => {
        logPageView();
    }, []);
};
