
import React, { useState, useEffect } from 'react';
import { UserPreferences, Route, POI } from '../types';
import { User, Globe, Heart, BookOpen, Navigation, Trash2, LogOut, MessageSquareHeart, Coffee, Download, Users, Zap, Share2, MapPin, X, HelpCircle, ChevronLeft, ChevronRight, BookMarked, CloudOff, Key, Sparkles, CheckCircle, ExternalLink, Settings2 } from 'lucide-react';

declare var window: any;

interface Props {
  preferences: UserPreferences;
  setPreferences: (p: UserPreferences) => void;
  savedRoutes: any[];
  savedPois: any[];
  offlineRouteIds: string[];
  onLoadOfflineRoute: (id: string) => void;
  onRemoveOffline?: (id: string) => void;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  onLoadRoute: (cityName: string, route: Route) => void;
  onDeleteRoute: (id: string) => void;
  onDeletePoi: (id: string) => void;
  onOpenFeedback: () => void;
  onOpenGuide: () => void;
  uniqueUserCount: number;
  remainingGens: number;
  onVerifyInvite?: (code: string) => boolean;
  hasFullAccess?: boolean;
}

const LOGO_URL = "https://drive.google.com/uc?id=1YITDQ6V-4bjfWKnamvgVGm0uLuHcgXdP";
const INTERESTS_HE = ['היסטוריה', 'ארכיטקטורה', 'מוזיקה', 'אוכל', 'אמנות', 'צילום', 'קולינריה מקומית', 'אמנות רחוב', 'חיי לילה'];
const INTERESTS_EN = ['History', 'Architecture', 'Music', 'Food', 'Art', 'Photography', 'Local Cuisine', 'Street Art', 'Nightlife'];

export const PreferencesPanel: React.FC<Props> = ({ 
  preferences, setPreferences, savedRoutes, savedPois, offlineRouteIds, onLoadOfflineRoute, onRemoveOffline,
  user, onLogin, onLogout, onLoadRoute, onDeleteRoute, onDeletePoi, onOpenFeedback, onOpenGuide,
  uniqueUserCount, remainingGens
}) => {
  const isHe = preferences.language === 'he';
  const interests = isHe ? INTERESTS_HE : INTERESTS_EN;
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    if (window.aistudio?.hasSelectedApiKey) {
      window.aistudio.hasSelectedApiKey().then(setHasCustomKey);
    }
  }, []);

  const handleOpenApiKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasCustomKey(true);
    }
  };

  const toggleInterest = (interest: string) => {
    const newInterests = preferences.interests.includes(interest)
      ? preferences.interests.filter(i => i !== interest)
      : [...preferences.interests, interest];
    setPreferences({ ...preferences, interests: newInterests });
  };

  const handleShareInvite = () => {
    const url = "https://urbanito.live";
    if (navigator.share) {
      navigator.share({
        title: 'Urbanito',
        text: isHe ? 'כדאי לנסות את Urbanito!' : 'Check out Urbanito!',
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert(isHe ? 'הלינק הועתק!' : 'Link copied!');
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto pb-40 ${isHe ? 'text-right' : 'text-left'}`} dir={isHe ? 'rtl' : 'ltr'}>
      <div className="pt-6 pb-2 flex justify-center opacity-30 grayscale hover:grayscale-0 transition-all">
        <img src={LOGO_URL} alt="Urbanito" className="h-5 w-auto" />
      </div>

      <div className="flex items-center gap-4 py-6 mb-8 border-b border-slate-100">
        <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm shrink-0 relative overflow-hidden">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <User size={28} className="text-slate-200" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-slate-900 tracking-tight truncate">
            {user ? (user.user_metadata?.full_name || user.email) : (isHe ? 'אורח/ת' : 'Guest')}
          </h2>
          {user ? (
            <button 
              onClick={onLogout}
              className="flex items-center gap-1.5 text-[9px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-[0.2em] mt-1"
            >
              <LogOut size={10} />
              {isHe ? 'התנתקות מהחשבון' : 'Sign Out'}
            </button>
          ) : (
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{isHe ? 'מצב תצוגה בלבד' : 'Viewing only mode'}</p>
          )}
        </div>
        {!user && (
          <button 
            onClick={onLogin}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all text-[11px] font-black text-slate-700 uppercase tracking-widest"
          >
            <img src="https://www.google.com/favicon.ico" className="w-3 h-3" alt="Google" />
            {isHe ? 'התחברות' : 'Sign In'}
          </button>
        )}
      </div>

      <div className="space-y-10">
        {/* Language & Interests - User content priority */}
        <div className="grid grid-cols-1 gap-8">
            <section>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">
                <Globe size={12} /> {isHe ? 'שפת האפליקציה' : 'App Language'}
              </label>
              <div className="flex gap-2">
                {['he', 'en'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setPreferences({ ...preferences, language: lang as 'he' | 'en' })}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all border uppercase tracking-widest ${
                      preferences.language === lang
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                        : 'bg-white text-slate-400 border-slate-100'
                    }`}
                  >
                    {lang === 'he' ? 'עברית' : 'English'}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">
                <BookOpen size={12} /> {isHe ? 'תחומי עניין עיקריים' : 'Key Interests'}
              </label>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                      preferences.interests.includes(interest)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </section>
        </div>

        {/* Saved Content */}
        <section>
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 px-1">
            <Heart size={12} className="fill-current text-rose-500" /> {isHe ? 'המסלולים השמורים שלי' : 'My Saved Tours'}
          </label>
          {savedRoutes.length === 0 ? (
            <div className="bg-slate-50/50 rounded-[20px] p-10 border border-dashed border-slate-200 text-center text-slate-300">
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">
                {isHe ? 'עדיין לא שמרת מסלולים' : 'No saved tours yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedRoutes.map((row) => {
                const isOffline = offlineRouteIds.includes(row.route_data.id);
                return (
                  <div key={row.id} className="bg-white rounded-[18px] p-4 border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div className="flex-1 text-right min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{row.route_data?.city}</span>
                        {isOffline && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[7px] font-black rounded uppercase tracking-tighter shadow-sm">
                            <Download size={8} /> {isHe ? 'זמין אופליין' : 'Offline'}
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-slate-900 truncate mt-1">{row.route_data?.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => onLoadRoute(row.route_data.city, row.route_data)} 
                        className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-95 shadow-md"
                      >
                        <Navigation size={18} fill="currentColor" />
                      </button>
                      <button 
                        onClick={() => onDeleteRoute(row.id)} 
                        className="w-11 h-11 bg-white border border-slate-100 text-slate-300 hover:text-red-500 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Feedback & Social */}
        <section className="pt-6 border-t border-slate-100 space-y-4">
           <button 
            onClick={onOpenFeedback}
            className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[18px] hover:bg-slate-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                <MessageSquareHeart size={20} />
              </div>
              <div className="text-right">
                <h3 className="text-xs font-black text-slate-900">{isHe ? 'יש לך משוב עבורנו?' : 'Have feedback?'}</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{isHe ? 'נשמח לשמוע ולשפר' : 'Tell us how to improve'}</p>
              </div>
            </div>
            <ChevronLeft size={16} className="text-slate-300" />
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleShareInvite}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-50 text-indigo-700 rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 active:scale-95 transition-all shadow-sm"
            >
              <Share2 size={14} /> {isHe ? "שיתוף אפליקציה" : "Share App"}
            </button>
            <a 
              href="https://www.buymeacoffee.com/travel.ai" 
              target="_blank" 
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-amber-50 text-amber-700 rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 active:scale-95 transition-all shadow-sm"
            >
              <Coffee size={14} /> {isHe ? "תמיכה בקפה" : "Buy Coffee"}
            </a>
          </div>
        </section>

        {/* Minimal API Key Footer */}
        <div className="pt-8 text-center space-y-4">
           {!hasCustomKey && (
             <button onClick={handleOpenApiKeySelector} className="text-[9px] font-black text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-1.5 mx-auto uppercase tracking-widest">
                <Key size={10} /> {isHe ? 'חיבור מפתח אישי (Pro)' : 'Connect Personal Key (Pro)'}
             </button>
           )}
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Urbanito v3.1 • 2024</p>
        </div>
      </div>
    </div>
  );
};
