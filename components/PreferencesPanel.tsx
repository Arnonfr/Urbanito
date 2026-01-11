
import React, { useState } from 'react';
import { UserPreferences, Route } from '../types';
import { User, ChevronDown, ChevronUp, Globe, Heart, BookOpen, Leaf, Accessibility, ShieldCheck, Play, Trash2 } from 'lucide-react';

interface Props {
  preferences: UserPreferences;
  setPreferences: (p: UserPreferences) => void;
  savedRoutes: Route[];
  onLoadRoute: (cityName: string, route: Route) => void;
  onDeleteRoute: (id: string) => void;
}

const INTERESTS_HE = ['היסטוריה', 'ארכיטקטורה', 'מוזיקה', 'אוכל', 'אמנות', 'צילום', 'קולינריה מקומית', 'אמנות רחוב', 'חיי לילה'];
const INTERESTS_EN = ['History', 'Architecture', 'Music', 'Food', 'Art', 'Photography', 'Local Cuisine', 'Street Art', 'Nightlife'];

export const PreferencesPanel: React.FC<Props> = ({ preferences, setPreferences, savedRoutes, onLoadRoute, onDeleteRoute }) => {
  const isHe = preferences.language === 'he';
  const interests = isHe ? INTERESTS_HE : INTERESTS_EN;
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const toggleInterest = (interest: string) => {
    const newInterests = preferences.interests.includes(interest)
      ? preferences.interests.filter(i => i !== interest)
      : [...preferences.interests, interest];
    setPreferences({ ...preferences, interests: newInterests });
  };

  const togglePreference = (key: keyof UserPreferences) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  return (
    <div className={`w-full max-w-2xl mx-auto pb-32 ${isHe ? 'text-right' : 'text-left'}`} dir={isHe ? 'rtl' : 'ltr'}>
      {/* Profile Header */}
      <div className="flex flex-col items-center py-12">
        <div className="w-20 h-20 bg-white border border-emerald-100 rounded-full flex items-center justify-center shadow-sm mb-4 group relative overflow-hidden">
          <User size={32} className="text-emerald-200 group-hover:text-emerald-400 transition-colors" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-light text-slate-900 tracking-tight">
          {isHe ? 'הפרופיל שלי' : 'My Profile'}
        </h2>
      </div>

      <div className="space-y-10 px-6">
        {/* Language Selection */}
        <section>
          <label className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4">
            <Globe size={14} /> {isHe ? 'שפת האפליקציה' : 'App Language'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'he', label: 'עברית' },
              { id: 'en', label: 'English' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setPreferences({ ...preferences, language: lang.id as 'he' | 'en' })}
                className={`py-3 rounded-2xl text-[11px] font-medium transition-all border ${
                  preferences.language === lang.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]'
                    : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-300'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        {/* Interests */}
        <section>
          <label className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4">
            <BookOpen size={14} /> {isHe ? 'תחומי עניין' : 'Interests'}
          </label>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-5 py-2 rounded-full text-[10px] font-medium transition-all border ${
                  preferences.interests.includes(interest)
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-white text-slate-400 border-slate-100 hover:bg-emerald-50'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </section>

        {/* Additional Preferences Accordion */}
        <section className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
          <button 
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-slate-400" />
              <span className="text-sm font-light text-slate-700">
                {isHe ? 'העדפות נוספות' : 'Additional Preferences'}
              </span>
            </div>
            {isAccordionOpen ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
          </button>
          
          {isAccordionOpen && (
            <div className="p-5 pt-0 space-y-4 border-t border-slate-50">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Heart size={14} /></div>
                   <span className="text-xs font-light text-slate-600">{isHe ? 'מותאם לציבור דתי' : 'Religious Friendly'}</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={!!preferences.religiousFriendly} 
                  onChange={() => togglePreference('religiousFriendly')}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Leaf size={14} /></div>
                   <span className="text-xs font-light text-slate-600">{isHe ? 'טבעוני' : 'Vegan Friendly'}</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={!!preferences.veganFriendly} 
                  onChange={() => togglePreference('veganFriendly')}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Accessibility size={14} /></div>
                   <span className="text-xs font-light text-slate-600">{isHe ? 'נגישות לנכים' : 'Accessible Only'}</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={!!preferences.accessibleOnly} 
                  onChange={() => togglePreference('accessibleOnly')}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </section>

        {/* Saved Tours (Favorites) */}
        <section className="pt-6">
          <label className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-6">
            <Heart size={14} className="fill-current text-emerald-400" /> {isHe ? 'המסלולים השמורים שלי' : 'My Saved Tours'}
          </label>
          {savedRoutes.length === 0 ? (
            <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-dashed border-slate-200 text-center">
              <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest leading-loose">
                {isHe ? 'עדיין לא שמרת מסלולים.\nלחץ על סמל הלב בתוך מסלול פעיל כדי לשמור.' : 'No saved tours yet.\nClick the heart icon in an active route to save it.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedRoutes.map((route) => (
                <div key={route.id} className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex-1 text-right">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">{route.city}</span>
                    <h3 className="text-sm font-medium text-slate-800 truncate">{route.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onDeleteRoute(route.id)}
                      className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => onLoadRoute(route.city, route)}
                      className="p-3 bg-slate-900 text-white rounded-xl hover:bg-emerald-500 transition-all active:scale-95"
                    >
                      <Play size={16} fill="currentColor" strokeWidth={0} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
