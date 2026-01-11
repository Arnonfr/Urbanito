
import React from 'react';
import { UserPreferences } from '../types';
import { Sparkles, Clock, Map, Gem, X, Check, Footprints, Heart, Accessibility, ShieldCheck, MapPinned, Hash } from 'lucide-react';

interface Props {
  preferences: UserPreferences;
  onUpdatePreferences: (p: UserPreferences) => void;
  onGenerate: () => void;
  onCancel: () => void;
}

const INTERESTS_HE = ['היסטוריה', 'ארכיטקטורה', 'מוזיקה', 'אוכל', 'אמנות', 'טבע', 'קניות'];
const INTERESTS_EN = ['History', 'Architecture', 'Music', 'Food', 'Art', 'Nature', 'Shopping'];

export const QuickRouteSetup: React.FC<Props> = ({ preferences, onUpdatePreferences, onGenerate, onCancel }) => {
  const isHe = preferences.language === 'he';
  const interests = isHe ? INTERESTS_HE : INTERESTS_EN;

  const toggleInterest = (interest: string) => {
    const newInterests = preferences.interests.includes(interest)
      ? preferences.interests.filter(i => i !== interest)
      : [...preferences.interests, interest];
    onUpdatePreferences({ ...preferences, interests: newInterests });
  };

  const togglePreference = (key: keyof UserPreferences) => {
    onUpdatePreferences({ ...preferences, [key]: !preferences[key] });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center pointer-events-none p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onCancel} />
      
      <div 
        dir={isHe ? 'rtl' : 'ltr'}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl pointer-events-auto relative overflow-hidden animate-in slide-in-from-bottom-10 duration-300 border border-slate-100 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
          
          <header className="flex items-start justify-between shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="text-emerald-500" size={20} />
                {isHe ? 'תכנון והתאמה מחדש' : 'Refine & Regenerate'}
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-light">
                {isHe ? 'דייק את ההעדפות וניצור עבורך מסלול חדש' : 'Adjust settings to generate a fresh route'}
              </p>
            </div>
            <button onClick={onCancel} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900">
              <X size={20} />
            </button>
          </header>

          {/* Route Style Selector */}
          <section className="space-y-4">
             <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <MapPinned size={12} />
               {isHe ? 'סגנון המסלול' : 'Route Style'}
             </label>
             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => onUpdatePreferences({ ...preferences, routeStyle: 'classic' })}
                 className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                   preferences.routeStyle !== 'street' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200'
                 }`}
               >
                 <Map size={20} />
                 <span className="text-xs font-bold">{isHe ? 'מסלול תחנות' : 'Classic Tour'}</span>
                 <span className="text-[9px] opacity-70 leading-tight">{isHe ? 'ניווט בין אתרים נבחרים' : 'Point-to-point stops'}</span>
               </button>

               <button 
                 onClick={() => onUpdatePreferences({ ...preferences, routeStyle: 'street' })}
                 className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                   preferences.routeStyle === 'street' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200'
                 }`}
               >
                 <Footprints size={20} />
                 <span className="text-xs font-bold">{isHe ? 'הליכה ברחוב' : 'Street Stroll'}</span>
                 <span className="text-[9px] opacity-70 leading-tight">{isHe ? 'רצף הליכה ברחוב ראשי' : 'Linear walk along a street'}</span>
               </button>
             </div>
          </section>

          {/* Number of Stops Slider */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Hash size={12} />
                  {isHe ? 'מספר תחנות' : 'Number of Stops'}
                </label>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                   {preferences.desiredPoiCount || 5}
                </span>
             </div>
             <input 
               type="range" 
               min="3" 
               max="15" 
               step="1"
               value={preferences.desiredPoiCount || 5} 
               onChange={(e) => onUpdatePreferences({ ...preferences, desiredPoiCount: parseInt(e.target.value) })}
               className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
             />
             <div className="flex justify-between text-[10px] text-slate-300 font-medium uppercase tracking-tighter px-1">
                <span>3</span>
                <span>15</span>
             </div>
          </section>

          {/* Walking Distance Slider */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} />
                  {isHe ? 'מרחק הליכה' : 'Walking Distance'}
                </label>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                   {preferences.walkingDistance} {isHe ? 'ק"מ' : 'km'}
                </span>
             </div>
             <input 
               type="range" 
               min="1" 
               max="10" 
               step="1"
               value={preferences.walkingDistance || 3} 
               onChange={(e) => onUpdatePreferences({ ...preferences, walkingDistance: parseInt(e.target.value) })}
               className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
             />
             <div className="flex justify-between text-[10px] text-slate-300 font-medium uppercase tracking-tighter px-1">
                <span>1km</span>
                <span>10km</span>
             </div>
          </section>

          {/* Sensitivities */}
          <section className="space-y-3">
             <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <ShieldCheck size={12} />
               {isHe ? 'רגישויות והתאמות' : 'Sensitivities'}
             </label>
             <div className="flex flex-col gap-2">
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${preferences.religiousFriendly ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                   <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${preferences.religiousFriendly ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}><Heart size={14} /></div>
                      <span className="text-xs font-medium text-slate-700">{isHe ? 'מותאם לציבור דתי (ללא כנסיות)' : 'Religious Friendly'}</span>
                   </div>
                   <input type="checkbox" checked={!!preferences.religiousFriendly} onChange={() => togglePreference('religiousFriendly')} className="w-4 h-4 accent-emerald-600" />
                </label>

                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${preferences.accessibleOnly ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                   <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${preferences.accessibleOnly ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}><Accessibility size={14} /></div>
                      <span className="text-xs font-medium text-slate-700">{isHe ? 'נגישות לנכים' : 'Wheelchair Accessible'}</span>
                   </div>
                   <input type="checkbox" checked={!!preferences.accessibleOnly} onChange={() => togglePreference('accessibleOnly')} className="w-4 h-4 accent-emerald-600" />
                </label>
             </div>
          </section>

          {/* Hidden Gems Slider */}
          <section className="space-y-4">
             <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Map size={12} />
               {isHe ? 'אופי המסלול' : 'Route Vibe'}
             </label>
             <div className="flex items-center justify-between text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-xl mb-2">
                <span className="flex items-center gap-2">{isHe ? 'תיירותי' : 'Tourist'}</span>
                <span className="flex items-center gap-2 text-emerald-600">{isHe ? 'פנינים נסתרות' : 'Hidden Gems'} <Gem size={14}/></span>
             </div>
             <input 
               type="range" 
               min="0" 
               max="100" 
               value={preferences.hiddenGemsLevel} 
               onChange={(e) => onUpdatePreferences({ ...preferences, hiddenGemsLevel: parseInt(e.target.value) })}
               className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
             />
          </section>

          <button 
            onClick={onGenerate}
            className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 shrink-0"
          >
            {isHe ? 'רענן מסלול' : 'Regenerate Route'}
            <Check size={20} />
          </button>

        </div>
      </div>
    </div>
  );
};
