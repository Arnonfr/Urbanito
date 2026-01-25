import React, { useEffect, useRef } from 'react';

interface GoogleAdProps {
    slot: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    layout?: string;
    responsive?: boolean;
    className?: string;
    style?: React.CSSProperties;
    testMode?: boolean;
}

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

export const GoogleAd: React.FC<GoogleAdProps> = ({
    slot,
    format = 'auto',
    layout,
    responsive = true,
    className = '',
    style = {},
    testMode = false, // Set to true to see a placeholder in dev
}) => {
    const adRef = useRef<HTMLDivElement>(null);
    const isDev = process.env.NODE_ENV === 'development';

    useEffect(() => {
        // Prevent double-pushing if the component re-renders quickly
        // This is a naive check; robust implementations might need more.
        if (adRef.current && adRef.current.innerHTML === "") {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error("AdSense error:", e);
            }
        }
    }, []);

    if (isDev || testMode) {
        return (
            <div
                className={`bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-mono p-4 text-center ${className}`}
                style={{ minHeight: '100px', ...style }}
            >
                Google Ad Placeholder<br />(Slot: {slot})
            </div>
        );
    }

    return (
        <div className={`google-ad-container ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', ...style }}
                data-ad-client="ca-pub-5516166184309166"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? 'true' : 'false'}
                data-ad-layout={layout}
            />
        </div>
    );
};
