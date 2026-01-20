
import React from 'react';
import { UserPreferences } from '../types';
import { Check, Heart, Accessibility, Compass, Wand2, Loader2, Church, Leaf, EyeOff } from 'lucide-react';

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
    explanation: isHe ? 'רמת פירוט ההסבר' : 'Explanation Depth',
    regenerate: isHe ? 'עדכן מסלול לפי ההעדפות' : 'Update Route via Preferences',
    updating: isHe ? 'מעדכן...' : 'Updating...',
    religious: isHe ? 'ללא אתרי דת (כנסיות וכו\')' : 'No religious sites',
    vegan: isHe ? 'התאמה לטבעונים' : 'Vegan friendly',
    accessible: isHe ? 'נגישות לעגלות/נכים' : 'Accessible'
  };

  return (
    <div className={`w-full ${isEmbedded ? 'px-1' : 'p-6 bg-white'}`} dir={isHe ? 'rtl' : 'ltr'}>
      <div className="space-y-8">
        <div className="space-y-8 px-1">
           <div className="space-y-4">
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                 <span className="text-slate-400">{t.stops}</span>
                 <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md text-sm">{preferences.desiredPoiCount || 5}</span>
              </div>
              <input 
                type="range" min="3" max="12" 
                value={preferences.desiredPoiCount || 5} 
                onChange={(e) => onUpdatePreferences({ ...preferences, desiredPoiCount: parseInt(e.target.value) })} 
                className="w-full h-2 bg-slate-100 appearance-none accent-indigo-600 cursor-pointer rounded-full" 
              />
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                 <span className="text-slate-400">{t.distance}</span>
                 <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md text-sm">{preferences.walkingDistance || 3}km</span>
              </div>
              <input 
                type="range" min="1" max="8" 
                value={preferences.walkingDistance || 3} 
                onChange={(e) => onUpdatePreferences({ ...preferences, walkingDistance: parseInt(e.target.value) })} 
                className="w-full h-2 bg-slate-100 appearance-none accent-indigo-600 cursor-pointer rounded-full" 
              />
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                 <span className="text-emerald-600">{t.hidden}</span>
                 <span className="text-slate-400">{t.tourist}</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={preferences.hiddenGemsLevel || 30} 
                onChange={(e) => onUpdatePreferences({ ...preferences, hiddenGemsLevel: parseInt(e.target.value) })} 
                className="w-full h-2 bg-slate-100 appearance-none accent-emerald-500 cursor-pointer rounded-full" 
              />
           </div>
        </div>

        {/* Binary Toggles Section */}
        <div className="grid grid-cols-1 gap-3 px-1">
           <button 
             onClick={() => togglePreference('religiousFriendly')}
             className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${preferences.religiousFriendly ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-500'}`}
           >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${preferences.religiousFriendly ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                {preferences.religiousFriendly ? <Check size={14} /> : <EyeOff size={14} />}
              </div>
              <span className="text-xs font-bold">{t.religious}</span>
           </button>

           <button 
             onClick={() => togglePreference('veganFriendly')}
             className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${preferences.veganFriendly ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}
           >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${preferences.veganFriendly ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                {preferences.veganFriendly ? <Check size={14} /> : <Leaf size={14} />}
              </div>
              <span className="text-xs font-bold">{t.vegan}</span>
           </button>

           <button 
             onClick={() => togglePreference('accessibleOnly')}
             className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${preferences.accessibleOnly ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-500'}`}
           >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${preferences.accessibleOnly ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                {preferences.accessibleOnly ? <Check size={14} /> : <Accessibility size={14} />}
              </div>
              <span className="text-xs font-bold">{t.accessible}</span>
           </button>
        </div>

        <div className="space-y-3">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.explanation}</label>
           <div className="flex bg-slate-100 p-1 border border-slate-200" style={{ borderRadius: '8px' }}>
             {['simple', 'standard', 'deep'].map((s) => (
               <button
                 key={s}
                 onClick={() => setStyle(s as any)}
                 className={`flex-1 py-3 text-[11px] font-black transition-all ${
                   preferences.explanationStyle === s 
                   ? 'bg-slate-900 text-white shadow-md' 
                   : 'text-slate-500 hover:text-slate-700'
                 }`}
                 style={{ borderRadius: '6px' }}
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
            className={`w-full py-5 text-white font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            style={{ borderRadius: '5px' }}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            {isLoading ? t.updating : t.regenerate}
          </button>
        )}
      </div>
    </div>
  );
};
