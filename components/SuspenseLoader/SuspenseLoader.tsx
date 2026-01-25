import React from 'react';
import { Loader2 } from 'lucide-react';

export const SuspenseLoader: React.FC<{ children?: React.ReactNode, isHe?: boolean }> = ({ children, isHe = true }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] w-full h-full p-8 animate-in fade-in duration-500">
            <style>{`
                @keyframes compass-spin-lock {
                    0% { transform: rotate(0deg); animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1); }
                    20% { transform: rotate(720deg); animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); } /* Spin & Undershoot */
                    30% { transform: rotate(700deg); animation-timing-function: ease-in-out; }
                    40% { transform: rotate(725deg); animation-timing-function: ease-in-out; }
                    50% { transform: rotate(720deg); } /* Lock */
                    100% { transform: rotate(720deg); } /* Stay Locked */
                }
                .compass-needle {
                    transform-origin: 12px 12px;
                    animation: compass-spin-lock 3s infinite;
                }
            `}</style>

            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 text-indigo-500">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-20" />
                <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M2 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

                <g className="compass-needle">
                    <polygon points="12 6 15 12 12 18 9 12" fill="currentColor" />
                    <circle cx="12" cy="12" r="1" fill="white" />
                </g>
            </svg>

            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">{isHe ? 'טוען...' : 'Loading...'}</span>
            {children}
        </div>
    );
};

export default SuspenseLoader;
