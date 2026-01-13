
import React, { useState } from 'react';
/* Added missing Search, Plus, BookMarked icons to the import */
import { X, ChevronRight, ChevronLeft, Map, Wand2, MapPin, Navigation, Sparkles, BookOpen, Heart, Eye, Trash2, Sliders, Layers, Search, Plus, BookMarked } from 'lucide-react';

interface Props {
  isHe: boolean;
  onClose: () => void;
}

export const UserGuide: React.FC<Props> = ({ isHe, onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: isHe ? "ברוכים הבאים לאורבניטו" : "Welcome to Urbanito",
      description: isHe 
        ? "אורבניטו הוא כלי מבוסס בינה מלאכותית המיועד ליצירת סיורי עומק עירוניים בהתאמה אישית." 
        : "Urbanito is an AI-powered tool designed to create personalized deep urban tours.",
      icon: <Sparkles className="text-emerald-500" size={40} />,
      color: "bg-emerald-50"
    },
    {
      title: isHe ? "יצירת מסלול חדש" : "Creating a Route",
      description: isHe 
        ? "חיפוש עיר בסרגל העליון או לחיצה על 'יצירה באזור המפה' תפעיל את ה-AI. כדאי להגדיר העדפות (סגנון, מרחק, כמות תחנות) לפני היצירה." 
        : "Search for a city or tap 'Create in area'. Set your preferences (style, distance, stops) before generating.",
      icon: <Wand2 className="text-indigo-500" size={40} />,
      visual: (
        <div className="mt-6 flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
           <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-slate-100">
             <Search className="text-slate-400" size={14}/>
             <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
           </div>
           <div className="flex gap-2">
             <div className="flex-1 bg-slate-900 text-white text-[10px] font-bold py-3 rounded-lg text-center">יצירת מסלול</div>
             <div className="flex-1 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold py-3 rounded-lg text-center flex items-center justify-center gap-1"><Sliders size={12}/> העדפות</div>
           </div>
        </div>
      ),
      color: "bg-indigo-50"
    },
    {
      title: isHe ? "ניהול ועריכת תחנות" : "Managing Stations",
      description: isHe 
        ? "אפשר לשנות את המסלול בכל רגע. לחיצה על תחנה פותחת את פרטי המקום, שם ניתן להסיר את התחנה או לנווט אליה. בסקירת המסלול ניתן להוסיף תחנות חדשות." 
        : "Modify your route anytime. Tap a station to see details, remove it, or navigate. Add new stations from the route overview.",
      icon: <Layers className="text-amber-500" size={40} />,
      visual: (
        <div className="mt-6 flex flex-col gap-2">
           <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg"></div>
                <div className="h-2 w-20 bg-slate-100 rounded"></div>
              </div>
              <Trash2 size={14} className="text-red-300" />
           </div>
           <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-700">
              <Plus size={12}/> הוספת תחנה מהשמורים או בחיפוש
           </div>
        </div>
      ),
      color: "bg-amber-50"
    },
    {
      title: isHe ? "חקר פנינים נסתרות" : "Discovering Hidden Gems",
      description: isHe 
        ? "שימוש בכפתור 'חיפוש מקומות בסביבה' מאפשר לסרוק את האזור ולמצוא נקודות עניין שה-AI זיהה כחשובות, גם אם הן לא חלק מהמסלול המקורי." 
        : "Use 'Discover spots' to scan the area for interesting points the AI identified, even if they aren't in the original route.",
      icon: <Eye className="text-blue-500" size={40} />,
      visual: (
        <div className="mt-6 bg-white p-4 rounded-xl border border-slate-100 shadow-lg flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center"><Eye size={24}/></div>
           <div className="text-right space-y-1 flex-1">
              <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
              <div className="h-2 w-full bg-slate-100 rounded"></div>
           </div>
        </div>
      ),
      color: "bg-blue-50"
    },
    {
      title: isHe ? "ניווט ושמירה" : "Navigation & Saving",
      description: isHe 
        ? "לחיצה על כפתור הניווט תפתח את המיקום המדויק בגוגל מפות. ניתן לשמור מסלולים ומקומות באזור האישי לשימוש חוזר בעתיד." 
        : "The navigation button opens locations in Google Maps. Save routes and places in your personal area for future use.",
      icon: <Navigation className="text-rose-500" size={40} />,
      visual: (
        <div className="mt-6 flex justify-around p-2">
           <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm"><Navigation size={20} className="text-rose-500" /></div>
           <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm"><Heart size={20} className="text-pink-500" /></div>
           <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm"><BookMarked size={20} className="text-amber-500" /></div>
        </div>
      ),
      color: "bg-rose-50"
    }
  ];

  const next = () => step < steps.length - 1 ? setStep(step + 1) : onClose();
  const prev = () => step > 0 && setStep(step - 1);

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg pointer-events-auto" onClick={onClose} />
      
      <div 
        dir={isHe ? 'rtl' : 'ltr'}
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl pointer-events-auto relative overflow-hidden flex flex-col h-[520px] animate-in zoom-in-95 duration-500"
      >
        <button onClick={onClose} className={`absolute top-6 ${isHe ? 'left-6' : 'right-6'} p-2 text-slate-400 hover:text-slate-900 transition-colors z-10`}>
          <X size={20} />
        </button>

        <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors duration-700 ${current.color}`}>
           <div className="mb-6 p-5 bg-white rounded-xl shadow-lg animate-in slide-in-from-bottom-4">
              {current.icon}
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-3">{current.title}</h3>
           <p className="text-xs text-slate-600 leading-relaxed font-light">{current.description}</p>
           
           {(current as any).visual && (current as any).visual}
        </div>

        <footer className="p-6 flex items-center justify-between bg-white border-t border-slate-50">
           <div className="flex gap-1">
             {steps.map((_, i) => (
               <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step === i ? 'w-4 bg-slate-900' : 'w-1 bg-slate-200'}`} />
             ))}
           </div>
           <div className="flex gap-2">
             {step > 0 && (
               <button onClick={prev} className="p-3 bg-slate-100 text-slate-600 rounded-lg active:scale-90 transition-all">
                 {isHe ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
               </button>
             )}
             <button onClick={next} className="px-6 py-3 bg-slate-900 text-white rounded-lg font-bold active:scale-95 transition-all text-xs shadow-lg shadow-slate-200">
               {step === steps.length - 1 ? (isHe ? 'התחלת שימוש' : 'Get Started') : (isHe ? 'המשך' : 'Next')}
             </button>
           </div>
        </footer>
      </div>
    </div>
  );
};
