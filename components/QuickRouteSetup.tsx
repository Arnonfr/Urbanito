
import React from 'react';
import { UserPreferences } from '../types';
import { Check, Accessibility, Loader2, Leaf, X, MapPinned, EyeOff, Star } from 'lucide-react';

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
    regenerate: isEmbedded ? (isHe ? 'עדכן את המסלול' : 'Update Route') : (isHe ? 'בנה מסלול אישי' : 'Build Personal Route'),
    updating: isHe ? 'מעדכן...' : 'Updating...',
    religious: isHe ? 'אני פחות בקטע של כנסיות ומסגדים' : 'No religious sites',
    vegan: isHe ? 'התאמה לטבעונים' : 'Vegan friendly',
    accessible: isHe ? 'נגישות לעגלות/נכים' : 'Accessible',
    customTitle: isHe ? 'משהו ספציפי בראש?' : 'Something special in mind?',
    customPlaceholder: isHe ? 'למשל: סיבוב גלידריות, אומנות רחוב, פאבים נסתרים...' : 'e.g., Ice cream tour, Street art, Hidden bars...',
    examples: isHe ? ['אומנות רחוב', 'גלידריות', 'ברים נסתרים', 'נקודות תצפית'] : ['Street art', 'Ice cream', 'Hidden bars', 'Viewpoints'],
    jewish: isHe ? 'מורשת יהודית' : 'Jewish Heritage'
  };

  return (
    <div className={`w-full ${isEmbedded ? 'px-1' : 'p-6 bg-white'}`} dir={isHe ? 'rtl' : 'ltr'}>
      <div className="space-y-6">
        {/* Header Title for Context */}
        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
          <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
          <h3 className="text-sm font-bold text-slate-800">{isHe ? 'העדפות מסלול' : 'Route Preferences'}</h3>
        </div>

        {/* 1. Custom Prompt - Moved to TOP as requested */}
        <div className="space-y-4 px-1">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            {t.customTitle}
          </label>
          <div className="relative group">
            <input
              type="text"
              value={preferences.customPrompt || ''}
              onChange={(e) => onUpdatePreferences({ ...preferences, customPrompt: e.target.value })}
              placeholder={t.customPlaceholder}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none transition-all shadow-sm group-hover:bg-white placeholder:text-slate-500"
            />
            {preferences.customPrompt && (
              <button
                onClick={() => onUpdatePreferences({ ...preferences, customPrompt: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {t.examples.map((ex) => (
              <button
                key={ex}
                onClick={() => onUpdatePreferences({ ...preferences, customPrompt: ex })}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${preferences.customPrompt === ex
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700'
                  }`}
              >
                + {ex}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Preferences / Filters */}
        <div className="grid grid-cols-2 gap-2 px-1">
          <button
            onClick={() => togglePreference('religiousFriendly')}
            className={`flex items-center gap-3 p-3 rounded-[12px] border transition-all col-span-2 ${!preferences.religiousFriendly ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${!preferences.religiousFriendly ? 'bg-[#6366F1] text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
              {!preferences.religiousFriendly ? <Check size={12} strokeWidth={3} /> : <EyeOff size={12} />}
            </div>
            <span className="text-[12px] font-bold">{t.religious}</span>
          </button>

          <button
            onClick={() => togglePreference('veganFriendly')}
            className={`flex items-center gap-3 p-3 rounded-[12px] border transition-all ${preferences.veganFriendly ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${preferences.veganFriendly ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
              <Leaf size={12} />
            </div>
            <span className="text-[12px] font-bold">{t.vegan}</span>
          </button>

          <button
            onClick={() => togglePreference('accessibleOnly')}
            className={`flex items-center gap-3 p-3 rounded-[12px] border transition-all ${preferences.accessibleOnly ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${preferences.accessibleOnly ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
              <Accessibility size={12} />
            </div>
            <span className="text-[12px] font-bold">{t.accessible}</span>
          </button>

          <button
            onClick={() => togglePreference('jewishHistory')}
            className={`flex items-center gap-3 p-3 rounded-[12px] border transition-all ${preferences.jewishHistory ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${preferences.jewishHistory ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
              <Star size={12} />
            </div>
            <span className="text-[12px] font-bold">{t.jewish}</span>
          </button>
        </div>

        <div className="h-px bg-slate-100 mx-1" />

        {/* 3. Sliders */}
        <div className="space-y-6 px-1">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[12px] font-bold uppercase tracking-widest">
              <span className="text-slate-800">{t.stops}</span>
              <span className="text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">{preferences.desiredPoiCount || 5}</span>
            </div>
            <input
              type="range" min="3" max="12"
              value={preferences.desiredPoiCount || 5}
              onChange={(e) => onUpdatePreferences({ ...preferences, desiredPoiCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-300 appearance-none accent-indigo-700 cursor-pointer rounded-full"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-[12px] font-bold uppercase tracking-widest">
              <span className="text-slate-800">{t.distance}</span>
              <span className="text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">{preferences.walkingDistance || 3}km</span>
            </div>
            <input
              type="range" min="1" max="8"
              value={preferences.walkingDistance || 3}
              onChange={(e) => onUpdatePreferences({ ...preferences, walkingDistance: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-300 appearance-none accent-indigo-700 cursor-pointer rounded-full"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-[12px] font-bold uppercase tracking-widest">
              <span className="text-teal-700">{t.hidden}</span>
              <span className="text-slate-600">{t.tourist}</span>
            </div>
            <input
              type="range" min="0" max="100"
              value={preferences.hiddenGemsLevel || 30}
              onChange={(e) => onUpdatePreferences({ ...preferences, hiddenGemsLevel: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-300 appearance-none accent-teal-600 cursor-pointer rounded-full"
            />
          </div>
        </div>

        {/* 4. Detail Level */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1">{t.explanation}</label>
          <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-[12px]">
            {['simple', 'standard', 'deep'].map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s as any)}
                className={`flex-1 py-3 text-[12px] font-bold transition-all rounded-[10px] ${preferences.explanationStyle === s
                  ? 'bg-white text-slate-900 shadow-md border border-slate-100 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
              >
                {t[s as keyof typeof t]}
              </button>
            ))}
          </div>
        </div>

        {!hideActionButton && (
          <div className="pt-2">
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className={`w-full py-5 text-white font-bold text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 rounded-[12px] ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPinned size={18} />}
              {isLoading ? t.updating : t.regenerate}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
