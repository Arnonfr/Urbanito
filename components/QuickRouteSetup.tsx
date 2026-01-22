
import React from 'react';
import { UserPreferences } from '../types';
import { Check, Accessibility, Loader2, Leaf, EyeOff, MapPinned } from 'lucide-react';

interface Props {
  preferences: UserPreferences;
  onUpdatePreferences: (p: UserPreferences) => void;
  onGenerate: () => void;
  onCancel: () => void;
  isSearchContext?: boolean;
  isEmbedded?: boolean;
  isLoading?: boolean;
  hideActionButton?: boolean;
}

export const QuickRouteSetup: React.FC<Props> = ({ preferences, onUpdatePreferences, onGenerate, isEmbedded, isLoading, hideActionButton }) => {
  const isHe = preferences.language === 'he';

  const togglePreference = (key: keyof UserPreferences) => {
    onUpdatePreferences({ ...preferences, [key]: !preferences[key] });
  };

  const setStyle = (style: 'simple' | 'standard' | 'deep') => {
    onUpdatePreferences({ ...preferences, explanationStyle: style });
  };

  const t = {
    simple: isHe ? 'פשוט' : 'Simple',
    standard: isHe ? 'סטנדרטי' : 'Standard',
    deep: isHe ? 'מעמיק' : 'Deep Dive',
    stops: isHe ? 'מספר תחנות' : 'Stops',
    distance: isHe ? 'מרחק הליכה (ק"מ)' : 'Distance (km)',
    hidden: isHe ? 'פנינים נסתרות' : 'Hidden Gems',
    tourist: isHe ? 'תיירותי' : 'Mainstream',
    explanation: isHe ? 'רמת פירוט' : 'Detail Level',
    regenerate: isHe ? 'בנה מסלול אישי' : 'Build Personal Route',
    updating: isHe ? 'מעדכן...' : 'Updating...',
    religious: isHe ? 'אני פחות בקטע של כנסיות ומסגדים' : 'No religious sites',
    vegan: isHe ? 'התאמה לטבעונים' : 'Vegan friendly',
    accessible: isHe ? 'נגישות לעגלות/נכים' : 'Accessible'
  };

  return (
    <div className={`w-full ${isEmbedded ? 'px-1' : 'p-6 bg-white'}`} dir={isHe ? 'rtl' : 'ltr'}>
      <div className="space-y-8">
        <div className="space-y-8 px-1">
           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-widest">
                 <span className="text-slate-400">{t.stops}</span>
                 <span className="text-[#6366F1] bg-indigo-50 px-3 py-1 rounded-[8px] text-xs font-medium">{preferences.desiredPoiCount || 5}</span>
              </div>
              <input 
                type="range" min="3" max="12" 
                value={preferences.desiredPoiCount || 5} 
                onChange={(e) => onUpdatePreferences({ ...preferences, desiredPoiCount: parseInt(e.target.value) })} 
                className="w-full h-1.5 bg-slate-100 appearance-none accent-[#6366F1] cursor-pointer rounded-full" 
              />
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-widest">
                 <span className="text-slate-400">{t.distance}</span>
                 <span className="text-[#6366F1] bg-indigo-50 px-3 py-1 rounded-[8px] text-xs font-medium">{preferences.walkingDistance || 3}km</span>
              </div>
              <input 
                type="range" min="1" max="8" 
                value={preferences.walkingDistance || 3} 
                onChange={(e) => onUpdatePreferences({ ...preferences, walkingDistance: parseInt(e.target.value) })} 
                className="w-full h-1.5 bg-slate-100 appearance-none accent-[#6366F1] cursor-pointer rounded-full" 
              />
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-widest">
                 <span className="text-[#14B8A6]">{t.hidden}</span>
                 <span className="text-slate-400">{t.tourist}</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={preferences.hiddenGemsLevel || 30} 
                onChange={(e) => onUpdatePreferences({ ...preferences, hiddenGemsLevel: parseInt(e.target.value) })} 
                className="w-full h-1.5 bg-slate-100 appearance-none accent-[#14B8A6] cursor-pointer rounded-full" 
              />
           </div>
        </div>

        <div className="grid grid-cols-1 gap-2 px-1">
           <button 
             onClick={() => togglePreference('religiousFriendly')}
             className={`flex items-center gap-3 p-4 rounded-[8px] border transition-all ${!preferences.religiousFriendly ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}`}
           >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${!preferences.religiousFriendly ? 'bg-[#6366F1] text-white' : 'bg-slate-100 text-slate-300'}`}>
                {!preferences.religiousFriendly ? <Check size={12} /> : <EyeOff size={12} />}
              </div>
              <span className="text-xs font-medium">{t.religious}</span>
           </button>
        </div>

        <div className="space-y-3">
           <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-1">{t.explanation}</label>
           <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-[8px]">
             {['simple', 'standard', 'deep'].map((s) => (
               <button
                 key={s}
                 onClick={() => setStyle(s as any)}
                 className={`flex-1 py-3 text-[11px] font-medium transition-all rounded-[8px] ${
                   preferences.explanationStyle === s 
                   ? 'bg-[#0F172A] text-white shadow-md' 
                   : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 {t[s as keyof typeof t]}
               </button>
             ))}
           </div>
        </div>

        {!hideActionButton && (
          <button 
            onClick={onGenerate}
            disabled={isLoading}
            className={`w-full py-5 text-white font-medium text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 rounded-[8px] ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#6366F1] hover:bg-indigo-700'}`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPinned size={18} />}
            {isLoading ? t.updating : t.regenerate}
          </button>
        )}
      </div>
    </div>
  );
};
