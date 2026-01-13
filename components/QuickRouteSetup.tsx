
import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { Sparkles, Clock, Map, Gem, X, Check, Footprints, Heart, Accessibility, ShieldCheck, MapPinned, Hash, Leaf, Save, Info } from 'lucide-react';

interface Props {
  preferences: UserPreferences;
  onUpdatePreferences: (p: UserPreferences) => void;
  onGenerate: () => void;
  onCancel: () => void;
  isSearchContext?: boolean;
}

export const QuickRouteSetup: React.FC<Props> = ({ preferences, onUpdatePreferences, onGenerate, onCancel, isSearchContext }) => {
  const isHe = preferences.language === 'he';
  const [shouldPersist, setShouldPersist] = useState(true);

  const togglePreference = (key: keyof UserPreferences) => {
    onUpdatePreferences({ ...preferences, [key]: !preferences[key] });
  };

  const setStyle = (style: 'simple' | 'standard' | 'deep') => {
    onUpdatePreferences({ ...preferences, explanationStyle: style });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto" onClick={onCancel} />
      
      <div 
        dir={isHe ? 'rtl' : 'ltr'}
        className="bg-white w-full max-w-[400px] rounded-2xl shadow-2xl pointer-events-auto relative overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-500"
      >
        <div className="p-6 space-y-7 overflow-y-auto no-scrollbar">
          
          {/* Depth Segmented Control */}
          <section className="bg-slate-50/50 p-1 rounded-xl flex gap-1 border border-slate-100 shadow-inner">
             {[
               { id: 'simple', label: isHe ? 'פשוט' : 'Simple' },
               { id: 'standard', label: isHe ? 'סטנדרטי' : 'Standard' },
               { id: 'deep', label: isHe ? 'מתקדם' : 'Deep' }
             ].map((s) => (
               <button
                 key={s.id}
                 onClick={() => setStyle(s.id as any)}
                 className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-all ${
                   preferences.explanationStyle === s.id 
                     ? 'bg-white text-emerald-600 shadow-md' 
                     : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 {s.label}
               </button>
             ))}
          </section>

          <p className="text-[9px] text-slate-400 font-medium px-2 text-center leading-relaxed">
             {preferences.explanationStyle === 'simple' && (isHe ? 'הסברים קלילים על האווירה והסיפורים.' : 'Light explanations.')}
             {preferences.explanationStyle === 'standard' && (isHe ? 'שילוב מאוזן של היסטוריה, אדריכלות ועובדות מעניינות.' : 'Balanced history and facts.')}
             {preferences.explanationStyle === 'deep' && (isHe ? 'ניתוח מעמיק של המבנים והקשרם ההיסטורי והחברתי.' : 'Deep social context.')}
          </p>

          {/* Sensitivities & Preferences */}
          <section className="space-y-3">
             <label className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2 px-1 mb-3">
               <ShieldCheck size={12} />
               {isHe ? 'העדפות ורגישויות' : 'Preferences'}
             </label>
             <div className="space-y-2">
                {[
                  { key: 'religiousFriendly', label: isHe ? 'ללא כנסיות (דתי/ה)' : 'No Churches', icon: <Heart size={14}/> },
                  { key: 'veganFriendly', label: isHe ? 'טבעונות' : 'Vegan Friendly', icon: <Leaf size={14}/> },
                  { key: 'accessibleOnly', label: isHe ? 'נגישות לכסא גלגלים' : 'Accessible Only', icon: <Accessibility size={14}/> }
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-white transition-all">
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${preferences[item.key as keyof UserPreferences] ? 'bg-slate-900 border-slate-900' : 'border-slate-200'}`}>
                      <input type="checkbox" className="hidden" checked={!!preferences[item.key as keyof UserPreferences]} onChange={() => togglePreference(item.key as keyof UserPreferences)} />
                      {preferences[item.key as keyof UserPreferences] && <Check size={12} className="text-white" strokeWidth={4} />}
                    </div>
                  </label>
                ))}
             </div>
          </section>

          {/* Sliders */}
          <section className="space-y-5 px-1">
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={12} /> {isHe ? 'מספר תחנות' : 'Stops'}
                  </label>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">{preferences.desiredPoiCount || 5}</span>
               </div>
               <input type="range" min="3" max="15" value={preferences.desiredPoiCount || 5} onChange={(e) => onUpdatePreferences({ ...preferences, desiredPoiCount: parseInt(e.target.value) })} className="w-full h-1 bg-slate-100 rounded-lg appearance-none accent-emerald-500 cursor-pointer" />
             </div>

             <div className="space-y-3">
               <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                 <Gem size={12} /> {isHe ? 'אופי המסלול' : 'Route Vibe'}
               </label>
               <div className="flex justify-between text-[9px] font-black text-emerald-500 px-0.5">
                  <span>{isHe ? 'פנינים נסתרות' : 'Hidden Gems'}</span>
                  <span className="text-slate-300">{isHe ? 'תיירותי' : 'Tourist'}</span>
               </div>
               <input type="range" min="0" max="100" value={preferences.hiddenGemsLevel} onChange={(e) => onUpdatePreferences({ ...preferences, hiddenGemsLevel: parseInt(e.target.value) })} className="w-full h-1 bg-slate-100 rounded-lg appearance-none accent-emerald-500 cursor-pointer" />
             </div>
          </section>

          <div className="pt-4 space-y-5">
             <label className="flex items-center justify-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${shouldPersist ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200'}`}>
                   <input type="checkbox" className="hidden" checked={shouldPersist} onChange={() => setShouldPersist(!shouldPersist)} />
                   {shouldPersist && <Check size={10} strokeWidth={4} />}
                </div>
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                  {isHe ? 'שמירת ההעדפות להמשך' : 'Save my preferences'}
                </span>
             </label>

             <button 
               onClick={onGenerate} 
               className="w-full py-4.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-50 active:scale-95 transition-all flex items-center justify-center"
             >
               {isHe ? (isSearchContext ? 'יצירת מסלול' : 'עדכון מסלול') : (isSearchContext ? 'Create Route' : 'Update Route')}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
