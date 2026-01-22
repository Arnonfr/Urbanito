
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, Navigation, Signpost, Heart, BookOpen, Layers, Library as LibraryIcon } from 'lucide-react';

interface Props {
  isHe: boolean;
  onClose: () => void;
}

const LOGO_SVG = "data:image/svg+xml,%3Csvg width='274' height='274' viewBox='0 0 274 274' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_1_2)'%3E%3Crect width='274' height='274' rx='77' fill='%23801ED6'/%3E%3Cpath d='M67.9708 171.182L87.0037 89.5812L94.6606 107.083L70.8148 85.2058L71.9086 81.0492H136.664L135.789 85.6434L107.787 106.864L120.038 89.5812L101.661 168.776C98.1609 184.235 98.3068 196.122 102.099 204.435C106.037 212.602 113.402 216.686 124.194 216.686C131.633 216.686 137.977 215.082 143.227 211.873C148.478 208.519 152.926 203.341 156.572 196.341C160.364 189.34 163.573 180.152 166.198 168.776L184.575 89.5812L189.825 102.926L166.636 84.5495L167.511 81.0492H221.109L220.234 84.7683L194.857 102.707L203.608 89.5812L185.231 168.776C175.022 213.259 152.853 235.5 118.725 235.5C98.0151 235.5 83.2117 229.885 74.3151 218.655C65.4185 207.279 63.3037 191.455 67.9708 171.182Z' fill='white'/%3E%3Ccircle cx='100' cy='78' r='35.5' fill='white' stroke='%23801ED6' stroke-width='5'/%3E%3Ccircle cx='190' cy='78' r='35.5' fill='white' stroke='%23801ED6' stroke-width='5'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_1_2'%3E%3Crect width='274' height='274' rx='77' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E";

export const UserGuide: React.FC<Props> = ({ isHe, onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: isHe ? "ברוכים הבאים לאורבניטו 🏙️" : "Welcome to Urbanito 🏙️",
      description: isHe 
        ? "אורבניטו הוא המדריך האישי שלכם, מבוסס AI, שיהפוך כל פינת רחוב לחוויה היסטורית מרתקת." 
        : "Urbanito is your AI-powered companion, turning every street corner into a captivating journey through time.",
      visualEmoji: "",
      color: "bg-indigo-50",
      content: (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-1000 slide-in-from-bottom-4">
           <img src={LOGO_SVG} alt="Urbanito" className="w-24 h-24 drop-shadow-2xl animate-bounce duration-[3000ms]" />
           <div className="p-4 bg-white rounded-[20px] shadow-xl border border-indigo-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center text-lg">✨</div>
              <div className="text-right">
                 <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Urbanito AI</div>
                 <div className="text-xs font-medium text-slate-800">{isHe ? "המסע בזמן שלך מתחיל עכשיו" : "Your time travel starts now"}</div>
              </div>
           </div>
        </div>
      )
    },
    {
      title: isHe ? "הכל מתחיל בכפתור אחד 🎯" : "It All Starts Here 🎯",
      description: isHe 
        ? "לחצו על כפתור הפלוס (+) בתחתית המסך כדי לפתוח את תפריט היצירה של המסלול האישי שלכם." 
        : "Tap the Plus (+) button at the bottom to open the creation menu and start your personal tour.",
      visualEmoji: "✨",
      color: "bg-emerald-50",
      content: (
        <div className="flex flex-col items-center animate-in zoom-in duration-500">
           <div className="w-20 h-20 bg-white text-indigo-600 shadow-[0_15px_40px_rgba(79,70,229,0.3)] flex items-center justify-center rounded-full border border-slate-100 relative">
             <Plus size={44} />
             <div className="absolute inset-0 rounded-full animate-ping bg-indigo-500/20" />
           </div>
        </div>
      )
    },
    {
      title: isHe ? "סיור באזור או מסלול רחוב? 🛤️" : "Area or Street? 🛤️",
      description: isHe 
        ? "בחרו 'סיור חכם' כדי לגלות הכל סביבכם, או 'מסלול רחוב' לטיול ממוקד לאורך שדרה מפורסמת." 
        : "Choose 'Smart Tour' to discover surroundings, or 'Street Tour' for a focused walk along a famous boulevard.",
      visualEmoji: "🚥",
      color: "bg-amber-50",
      content: (
        <div className="grid grid-cols-1 gap-3 w-full max-w-[220px] animate-in fade-in slide-in-from-right duration-700">
           <div className="bg-white p-4 rounded-[15px] shadow-md border border-slate-100 flex items-center gap-4 transition-transform hover:scale-105">
              <Navigation size={22} className="text-indigo-600 shrink-0" />
              <span className="text-xs font-medium text-slate-700">{isHe ? "סיור חכם באזור" : "Smart Area Tour"}</span>
           </div>
           <div className="bg-white p-4 rounded-[15px] shadow-md border border-slate-100 flex items-center gap-4 transition-transform hover:scale-105">
              <Signpost size={22} className="text-indigo-600 shrink-0" />
              <span className="text-xs font-medium text-slate-700">{isHe ? "מסלול רחוב" : "Street Tour"}</span>
           </div>
        </div>
      )
    },
    {
      title: isHe ? "הספריה הפרטית שלכם ❤️" : "Your Personal Library ❤️",
      description: isHe 
        ? "אהבתם מסלול? שמרו אותו לספריה. אנחנו ממליצים להתחבר כדי שהמסלולים יהיו זמינים תמיד." 
        : "Loved a tour? Save it to your library. We recommend signing in to access your tours anytime.",
      visualEmoji: "📚",
      color: "bg-rose-50",
      content: (
        <div className="flex gap-6 animate-in zoom-in duration-700">
           <div className="w-16 h-16 bg-white rounded-[20px] shadow-lg flex items-center justify-center text-rose-500 border border-rose-50 transition-transform hover:scale-110">
              <Heart size={32} fill="currentColor" />
           </div>
           <div className="w-16 h-16 bg-white rounded-[20px] shadow-lg flex items-center justify-center text-indigo-600 border border-indigo-50 transition-transform hover:scale-110">
              <LibraryIcon size={32} />
           </div>
        </div>
      )
    }
  ];

  const next = () => step < steps.length - 1 ? setStep(step + 1) : onClose();
  const prev = () => step > 0 && setStep(step - 1);

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl pointer-events-auto" />
      
      <div 
        dir={isHe ? 'rtl' : 'ltr'}
        className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl pointer-events-auto relative overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-500 border border-white/20"
      >
        <div className={`flex-1 flex flex-col items-center justify-center p-10 text-center transition-colors duration-700 ${current.color}`}>
           {current.visualEmoji && (
             <div className="mb-6 text-7xl transform transition-transform duration-700 hover:scale-110 drop-shadow-lg">
                {current.visualEmoji}
             </div>
           )}
           <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">{current.title}</h3>
           <p className="text-sm text-slate-600 leading-relaxed font-normal mb-10 max-w-[240px] mx-auto">{current.description}</p>
           
           <div className="w-full flex justify-center py-4">
              {current.content}
           </div>
        </div>

        <footer className="p-8 flex items-center justify-between bg-white border-t border-slate-100">
           <div className="flex items-center gap-6">
              <button 
                onClick={onClose} 
                className="text-slate-300 hover:text-indigo-600 transition-colors text-[10px] font-black uppercase tracking-[0.2em] py-2"
              >
                {isHe ? 'דלג' : 'Skip'}
              </button>
              
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200'}`} />
                ))}
              </div>
           </div>

           <div className="flex gap-2">
             {step > 0 && (
               <button onClick={prev} className="p-4 bg-slate-50 text-slate-400 rounded-[18px] active:scale-90 transition-all border border-slate-100">
                 {isHe ? <ChevronRight size={22}/> : <ChevronLeft size={22}/>}
               </button>
             )}
             <button onClick={next} className="px-8 py-4 bg-slate-900 text-white rounded-[18px] font-bold active:scale-95 transition-all text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100/50">
               {step === steps.length - 1 ? (isHe ? 'יוצאים לדרך' : 'Let\'s Go') : (isHe ? 'המשך' : 'Next')}
             </button>
           </div>
        </footer>
      </div>
    </div>
  );
};
