import React from 'react';
import { GoogleAd } from './GoogleAd';

// Copied from App.tsx to avoid circular dependency
const RouteTravelIcon = ({ className = "", animated = true }: { className?: string, animated?: boolean }) => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 11.3137 20 8" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" className={animated ? "climbing-path" : ""} />
      <circle r="3" fill="#6366F1" className={animated ? "climbing-dot" : ""} />
   </svg>
);

export const RouteSkeleton: React.FC<{ isHe: boolean }> = ({ isHe }) => {
   return (
      <>
         <style>{`
        @keyframes climb {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        .climbing-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: dash 2s ease-in-out infinite;
        }
        @keyframes dash {
          0% { stroke-dashoffset: 100; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -100; }
        }
        .climbing-dot {
          offset-path: path('M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 11.3137 20 8');
          animation: climb 2s ease-in-out infinite;
        }
      `}</style>
         <div className={`fixed inset-0 z-[100] bg-slate-50 flex flex-col lg:flex-row ${isHe ? 'lg:flex-row-reverse' : ''}`}>
            {/* Sidebar Skeleton */}
            <div className="hidden lg:flex flex-col w-[30%] min-w-[420px] h-full bg-white border-x border-slate-100 p-8 space-y-8">
               <div className="space-y-4">
                  <div className="w-1/2 h-8 bg-slate-200 rounded-[10px] animate-pulse" />
                  <div className="w-3/4 h-4 bg-slate-100 rounded-lg animate-pulse" />
               </div>
               <div className="w-full aspect-video bg-slate-100 rounded-[10px] animate-pulse" />
               <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                     <div key={i} className="flex gap-4 p-4 border border-slate-50 rounded-[10px]">
                        <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0 animate-pulse" />
                        <div className="flex-1 space-y-2">
                           <div className="w-1/3 h-4 bg-slate-200 rounded animate-pulse" />
                           <div className="w-3/4 h-3 bg-slate-100 rounded animate-pulse" />
                        </div>
                     </div>
                  ))}
               </div>

               {/* Ad Placeholder for Loading State */}
               <div className="mt-auto">
                  <GoogleAd
                     slot="4724021981"
                     className="rounded-[8px] overflow-hidden"
                     style={{ minHeight: '120px' }}
                  />
               </div>
            </div>

            {/* Main Map Area Skeleton */}
            <div className="flex-1 relative bg-slate-100/50">
               {/* Center Loader */}
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-8">
                     <RouteTravelIcon className="w-12 h-12" animated={true} />
                  </div>
                  <h2 className="text-2xl font-normal text-slate-800 mb-2 animate-pulse">
                     {isHe ? 'בונה את המסלול המושלם...' : 'Crafting your perfect route...'}
                  </h2>
                  <p className="text-slate-400 max-w-xs leading-relaxed text-sm font-light">
                     {isHe ? 'ה-AI סורק את העיר, מחבר נקודות עניין ומתאים את הזמנים.' : 'AI is scanning the city, connecting points of interest, and optimizing timing.'}
                  </p>
               </div>

               {/* Mobile Bottom Sheet Skeleton */}
               <div className="lg:hidden fixed inset-x-0 bottom-0 h-[45vh] bg-white rounded-t-[10px] p-6 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col">
                  <div className="w-16 h-1 bg-slate-200 rounded-full mx-auto shrink-0" />
                  <div className="flex items-center gap-4 shrink-0">
                     <div className="w-14 h-14 rounded-[10px] bg-slate-200 animate-pulse" />
                     <div className="space-y-2 flex-1">
                        <div className="w-2/3 h-5 bg-slate-200 rounded animate-pulse" />
                        <div className="w-1/3 h-3 bg-slate-100 rounded animate-pulse" />
                     </div>
                  </div>
                  <div className="space-y-3 shrink-0">
                     <div className="w-full h-12 bg-slate-100 rounded-[10px] animate-pulse" />
                     <div className="w-full h-12 bg-slate-100 rounded-[10px] animate-pulse" />
                  </div>

                  {/* Ad Placeholder for Mobile Loading */}
                  <div className="mt-auto pt-2">
                     <GoogleAd
                        slot="4724021981"
                        className="rounded-[8px] overflow-hidden bg-slate-50"
                        style={{ maxHeight: '100px' }}
                     />
                  </div>
               </div>
            </div>
         </div>
      </>
   );
};
