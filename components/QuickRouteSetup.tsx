
import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { Check, Heart, Accessibility, ShieldCheck, Hash, Compass, Route as RouteIcon, MapPin, Sparkles, ChevronDown, Sliders, Wand2, Settings2 } from 'lucide-react';

interface Props {
  preferences: UserPreferences;
  onUpdatePreferences: (p: UserPreferences) => void;
  onGenerate: () => void;
  onCancel: () => void;
  isSearchContext?: boolean;
  isEmbedded?: boolean;
}

export const QuickRouteSetup: React.FC<Props> = ({ preferences, onUpdatePreferences, onGenerate, isEmbedded }) => {
  const isHe = preferences.language === 'he';
  // Always start closed now to satisfy the "closed accordion" request
  const [isOpen, setIsOpen] = useState(false);

  const togglePreference = (key: keyof UserPreferences) => {
    onUpdatePreferences({ ...preferences, [key]: !preferences[key] });
  };

  const setStyle = (style: 'simple' | 'standard' | 'deep') => {
    onUpdatePreferences({ ...preferences, explanationStyle: style });
  };

  const t = {
    advanced: isHe ? 'העדפות מסלול מתקדמות' : 'Advanced Route Options',
    preferences: isHe ? 'העדפות ורגישויות' : 'Preferences',
    simple: isHe ? 'פשוט' : 'Simple',
    standard: isHe ? 'סטנדרטי' : 'Deep',
    deep: isHe ? 'היסטורי' : 'History+',
    stops: isHe ? 'מספר תחנות' : 'Stops',
    distance: isHe ? 'מרחק הליכה (ק"מ)' : 'Distance (km)',
    gems: isHe ? 'סוג מסלול' : 'Route Type',
    hidden: isHe ? 'פנינים נסתרות' : 'Hidden Gems',
    tourist: isHe ? 'תיירותי' : 'Mainstream',
    religiousFriendly: isHe ? 'ללא כנסיות (דתי/ה)' : 'No Churches',
    veganFriendly: isHe ? 'טבעונות' : 'Vegan',
    accessibleOnly: isHe ? 'נגישות' : 'Accessibility',
    explanation: isHe ? 'רמת פירוט ההסבר' : 'Explanation Depth',
    regenerate: isHe ? 'עדכן מסלול לפי ההעדפות' : 'Update Route via Preferences'
  };

  return (
    <div className={`w-full transition-all duration-300 ${isEmbedded ? '' : 'p-6 bg-white'}`} dir={isHe ? 'rtl' : 'ltr'}>
      
      {/* Accordion Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 transition-all duration-300 ${
          isOpen 
          ? 'bg-slate-900 text-white shadow-lg' 
          : 'bg-slate-50 text-slate-700 border border-slate-100 hover:bg-slate-100'
        }`}
        style={{ borderRadius: '5px' }}
      >
        <div className="flex items-center gap-3">
           <Settings2 size={18} className={isOpen ? 'text-indigo-400' : 'text-indigo-600'} />
           <span className="text-[11px] font-black uppercase tracking-widest">{t.advanced}</span>
        </div>
        <ChevronDown 
          size={18} 
          className={`transition-transform duration-500 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} 
        />
      </button>

      {/* Accordion Content */}
      <div 
        className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-6 py-2">
          {/* Explanation Depth Segmented */}
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.explanation}</label>
             <div className="flex bg-slate-100 p-1 border border-slate-200" style={{ borderRadius: '5px' }}>
               {['simple', 'standard', 'deep'].map((s) => (
                 <button
                   key={s}
                   onClick={() => setStyle(s as any)}
                   className={`flex-1 py-2.5 text-[10px] font-black transition-all ${
                     preferences.explanationStyle === s 
                     ? 'bg-slate-900 text-white shadow-md' 
                     : 'text-slate-500 hover:text-slate-700'
                   }`}
                   style={{ borderRadius: '5px' }}
                 >
                   {t[s as keyof typeof t]}
                 </button>
               ))}
             </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 gap-2">
             {[
               { key: 'religiousFriendly', label: t.religiousFriendly, icon: <Heart size={14}/> },
               { key: 'veganFriendly', label: t.veganFriendly, icon: <Compass size={14}/> },
               { key: 'accessibleOnly', label: t.accessibleOnly, icon: <Accessibility size={14}/> }
             ].map((item) => (
               <div 
                 key={item.key} 
                 onClick={() => togglePreference(item.key as keyof UserPreferences)}
                 className={`flex items-center justify-between p-4 border cursor-pointer transition-all active:scale-[0.98] ${
                   preferences[item.key as keyof UserPreferences] 
                   ? 'bg-indigo-50 border-indigo-200' 
                   : 'bg-white border-slate-100'
                 }`}
                 style={{ borderRadius: '5px' }}
               >
                  <div className="flex items-center gap-3 pointer-events-none">
                     <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                       preferences[item.key as keyof UserPreferences] 
                       ? 'bg-indigo-600 border-indigo-600' 
                       : 'bg-white border-slate-300'
                     }`} style={{ borderRadius: '3px' }}>
                        {preferences[item.key as keyof UserPreferences] && <Check size={12} className="text-white" strokeWidth={4} />}
                     </div>
                     <span className="text-[11px] font-bold text-slate-800">{item.label}</span>
                  </div>
                  <div className={`transition-colors duration-300 ${preferences[item.key as keyof UserPreferences] ? 'text-indigo-500' : 'text-slate-300'}`}>
                    {item.icon}
                  </div>
               </div>
             ))}
          </div>

          {/* Sliders Area */}
          <div className="space-y-6 px-1 pb-2">
             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black">
                   <span className="text-slate-400 uppercase tracking-widest">{t.stops}</span>
                   <span className="text-indigo-600 text-xs">{preferences.desiredPoiCount || 5}</span>
                </div>
                <input 
                  type="range" min="3" max="12" 
                  value={preferences.desiredPoiCount || 5} 
                  onChange={(e) => onUpdatePreferences({ ...preferences, desiredPoiCount: parseInt(e.target.value) })} 
                  className="w-full h-1.5 bg-slate-200 appearance-none accent-indigo-600 cursor-pointer" 
                  style={{ borderRadius: '99px' }}
                />
             </div>
             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black">
                   <span className="text-slate-400 uppercase tracking-widest">{t.distance}</span>
                   <span className="text-indigo-600 text-xs">{preferences.walkingDistance}km</span>
                </div>
                <input 
                  type="range" min="1" max="8" 
                  value={preferences.walkingDistance} 
                  onChange={(e) => onUpdatePreferences({ ...preferences, walkingDistance: parseInt(e.target.value) })} 
                  className="w-full h-1.5 bg-slate-200 appearance-none accent-indigo-600 cursor-pointer" 
                  style={{ borderRadius: '99px' }}
                />
             </div>
             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black">
                   <span className="text-emerald-600 uppercase tracking-widest">{t.hidden}</span>
                   <span className="text-slate-400 uppercase tracking-widest">{t.tourist}</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={preferences.hiddenGemsLevel} 
                  onChange={(e) => onUpdatePreferences({ ...preferences, hiddenGemsLevel: parseInt(e.target.value) })} 
                  className="w-full h-1.5 bg-slate-200 appearance-none accent-emerald-500 cursor-pointer" 
                  style={{ borderRadius: '99px' }}
                />
             </div>
          </div>

          {/* Update Action Button */}
          <button 
            onClick={onGenerate}
            className="w-full py-4 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-700 active:scale-95 transition-all mt-4"
            style={{ borderRadius: '5px' }}
          >
            <Wand2 size={16} />
            {t.regenerate}
          </button>
        </div>
      </div>
    </div>
  );
};
