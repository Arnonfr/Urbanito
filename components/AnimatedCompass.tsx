import React, { useEffect, useState } from 'react';

interface AnimatedCompassProps {
    className?: string;
    size?: number;
}

export const AnimatedCompass: React.FC<AnimatedCompassProps> = ({ className = "", size = 24 }) => {
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        // The animation takes 3s to complete the spin and lock sequence
        const timer = setTimeout(() => {
            setIsLocked(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <style>{`
        @keyframes compass-spin-nav {
            0% { transform: rotate(0deg); animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1); }
            20% { transform: rotate(720deg); animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); } /* Spin & Undershoot */
            30% { transform: rotate(700deg); animation-timing-function: ease-in-out; }
            40% { transform: rotate(725deg); animation-timing-function: ease-in-out; }
            50% { transform: rotate(720deg); } /* Lock */
            100% { transform: rotate(720deg); } /* Stay Locked */
        }
        .nav-compass-needle {
            transform-origin: 12px 12px;
            animation: compass-spin-nav 3s forwards;
        }
      `}</style>

            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-current">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" className="nav-compass-needle" />
            </svg>
        </div>
    );
};
