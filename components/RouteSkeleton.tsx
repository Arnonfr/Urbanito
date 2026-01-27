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
            <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100">
               {/* Center Loader - Simplified and Clean */}
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pb-20">
                  {/* Animated Icon */}
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6 animate-pulse">
                     <RouteTravelIcon className="w-14 h-14" animated={true} />
                  </div>

                  {/* Loading Message */}
                  <h2 className="text-2xl md:text-3xl font-light text-slate-800 mb-3 animate-pulse">
                     {isHe ? 'המסלול בהכנה...' : 'Route in Progress...'}
                  </h2>
                  <p className="text-slate-400 max-w-md leading-relaxed text-sm mb-10 px-4">
                     {isHe ? 'ה-AI בונה עבורך את המסלול המושלם' : 'AI is crafting your perfect route'}
                  </p>

                  {/* Large Prominent Ad */}
                  <div className="w-full max-w-[336px] mx-auto overflow-hidden rounded-2xl border-2 border-slate-200 shadow-xl bg-white">
                     <GoogleAd
                        slot="4724021981"
                        format="rectangle"
                        responsive={true}
                        className="w-full h-auto"
                        style={{ minHeight: '280px' }}
                     />
                     <div className="text-[9px] text-center text-slate-300 py-2 bg-slate-50 uppercase tracking-widest font-medium">
                        {isHe ? 'מודעה' : 'Advertisement'}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </>
   );
};
