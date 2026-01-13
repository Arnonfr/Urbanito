
import React from 'react';
import { MapPin, Navigation, Sparkles } from 'lucide-react';

export const RouteSkeleton: React.FC<{ isHe: boolean }> = ({ isHe }) => {
  return (
    <div className={`fixed inset-0 z-[100] bg-slate-50 flex flex-col lg:flex-row ${isHe ? 'lg:flex-row-reverse' : ''}`}>
      {/* Sidebar Skeleton */}
      <div className="hidden lg:flex flex-col w-[30%] min-w-[420px] h-full bg-white border-x border-slate-100 p-8 space-y-8">
        <div className="space-y-4">
           <div className="w-1/2 h-8 bg-slate-200 rounded-xl animate-pulse" />
           <div className="w-3/4 h-4 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="w-full aspect-video bg-slate-100 rounded-[2.5rem] animate-pulse" />
        <div className="space-y-4">
           {[1, 2, 3, 4].map((i) => (
             <div key={i} className="flex gap-4 p-4 border border-slate-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0 animate-pulse" />
                <div className="flex-1 space-y-2">
                   <div className="w-1/3 h-4 bg-slate-200 rounded animate-pulse" />
                   <div className="w-3/4 h-3 bg-slate-100 rounded animate-pulse" />
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Main Map Area Skeleton */}
      <div className="flex-1 relative bg-slate-100/50">
         {/* Center Loader */}
         <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-8 animate-bounce">
               <Sparkles className="text-emerald-500 animate-spin-slow" size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 animate-pulse">
               {isHe ? 'בונה את המסלול המושלם...' : 'Crafting your perfect route...'}
            </h2>
            <p className="text-slate-400 max-w-xs leading-relaxed">
               {isHe ? 'ה-AI סורק את העיר, מחבר נקודות עניין ומתאים את הזמנים.' : 'AI is scanning the city, connecting points of interest, and optimizing timing.'}
            </p>
         </div>

         {/* Mobile Bottom Sheet Skeleton */}
         <div className="lg:hidden fixed inset-x-0 bottom-0 h-[40vh] bg-white rounded-t-[3rem] p-8 space-y-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto" />
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl bg-slate-200 animate-pulse" />
               <div className="space-y-2 flex-1">
                  <div className="w-2/3 h-6 bg-slate-200 rounded-lg animate-pulse" />
                  <div className="w-1/3 h-4 bg-slate-100 rounded-lg animate-pulse" />
               </div>
            </div>
            <div className="space-y-3">
               <div className="w-full h-12 bg-slate-100 rounded-2xl animate-pulse" />
               <div className="w-full h-12 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
         </div>
      </div>
    </div>
  );
};
