
import React, { useState } from 'react';
import { UserPreferences, Route, POI } from '../types';
import { User, Globe, Heart, BookOpen, Navigation, Trash2, LogOut, MessageSquareHeart, Coffee, Download, Users, Zap, Share2, MapPin, X, HelpCircle, ChevronLeft, ChevronRight, BookMarked, CloudOff, Key, Sparkles, CheckCircle } from 'lucide-react';

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
  uniqueUserCount, remainingGens, onVerifyInvite, hasFullAccess
}) => {
  const isHe = preferences.language === 'he';
  const interests = isHe ? INTERESTS_HE : INTERESTS_EN;
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState(false);

  const toggleInterest = (interest: string) => {
    const newInterests = preferences.interests.includes(interest)
      ? preferences.interests.filter(i => i !== interest)
      : [...preferences.interests, interest];
    setPreferences({ ...preferences, interests: newInterests });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onVerifyInvite?.(inviteCode);
    if (!ok) {
      setInviteError(true);
      setTimeout(() => setInviteError(false), 2000);
    }
  };

  const handleShareInvite = () => {
    const url = "https://urbanito.live";
    if (navigator.share) {
      navigator.share({
        title: 'Urbanito',
        text: isHe ? 'כדאי לנסות את Urbanito לפני שנגמר המקום! כבר בפנים.' : 'Check out Urbanito before spots run out! I\'m already in.',
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert(isHe ? 'הלינק הועתק!' : 'Link copied to clipboard!');
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto pb-40 ${isHe ? 'text-right' : 'text-left'}`} dir={isHe ? 'rtl' : 'ltr'}>
      <div className="pt-6 pb-2 flex justify-center opacity-30 grayscale hover:grayscale-0 transition-all">
        <img src={LOGO_URL} alt="Urbanito" className="h-5 w-auto" />
      </div>

      <div className="flex items-center gap-4 py-6 mb-4 border-b border-slate-100">
        <div className="w-12 h-12 bg-white border border-emerald-100 rounded-xl flex items-center justify-center shadow-md shrink-0 relative overflow-hidden">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <User size={24} className="text-emerald-100" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight truncate">
            {user ? (user.user_metadata?.full_name || user.email) : (isHe ? 'אורח/ת' : 'Guest')}
          </h2>
          {user && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-1.5 text-[9px] font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest mt-0.5"
            >
              <LogOut size={10} />
              {isHe ? 'התנתקות' : 'Sign Out'}
            </button>
          )}
        </div>
        {!user && (
          <button 
            onClick={onLogin}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all text-[11px] font-medium text-slate-700"
          >
            <img src="https://www.google.com/favicon.ico" className="w-3 h-3" alt="Google" />
            {isHe ? 'התחברות' : 'Sign In'}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Full Access / Invite Code Logic */}
        {!hasFullAccess ? (
          <section className="bg-indigo-50/50 p-5 rounded-[1.5rem] border border-indigo-100 space-y-4">
            <div className="flex items-center gap-3">
              <Key size={18} className="text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-widest">{isHe ? 'הכנסת קוד הזמנה' : 'Enter Invite Code'}</h3>
            </div>
            <p className="text-[10px] text-slate-500 font-light">{isHe ? 'הכנס קוד גישה כדי לפתוח את כל יכולות המערכת' : 'Enter a code to unlock full AI capabilities'}</p>
            <form onSubmit={handleInviteSubmit} className="flex gap-2">
               <input 
                 type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                 placeholder={isHe ? 'קוד כאן...' : 'Code here...'}
                 className={`flex-1 bg-white border ${inviteError ? 'border-red-300' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 ring-indigo-500/20`}
               />
               <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                 {isHe ? 'אישור' : 'Verify'}
               </button>
            </form>
          </section>
        ) : (
          <section className="bg-emerald-500 text-white p-5 rounded-[1.5rem] shadow-lg shadow-emerald-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                 <Sparkles size={20} />
               </div>
               <div>
                 <h3 className="text-xs font-black uppercase tracking-widest">{isHe ? 'גישה מלאה פתוחה' : 'Full Access Active'}</h3>
                 <p className="text-[9px] opacity-80">{isHe ? 'כל יכולות ה-AI זמינות עבורך' : 'All AI features unlocked'}</p>
               </div>
             </div>
             <CheckCircle size={20} />
          </section>
        )}

        <section>
          <button 
            onClick={onOpenGuide}
            className="w-full flex items-center justify-between p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-50 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <HelpCircle size={20} />
              </div>
              <div className="text-right">
                <h3 className="text-sm font-bold">{isHe ? 'איך משתמשים באורבניטו?' : 'How to use Urbanito?'}</h3>
                <p className="text-[9px] opacity-80">{isHe ? 'מדריך קצר ומרהיב למשתמש/ת' : 'Short & stylish user guide'}</p>
              </div>
            </div>
            <div className={`transition-transform group-hover:translate-x-${isHe ? '-1' : '1'}`}>
              {isHe ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </div>
          </button>
        </section>

        {!user && !hasFullAccess && (
          <section className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-50 flex items-center gap-3.5">
             <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
               <Zap size={18} />
             </div>
             <div className="flex-1">
               <h4 className="text-[11px] font-bold text-emerald-900">
                 {isHe ? `נותרו עוד ${remainingGens} מסלולים` : `${remainingGens} routes remaining`}
               </h4>
               <p className="text-[9px] text-emerald-600 font-light mt-0.5">
                 {isHe ? 'כדאי להתחבר ליצירת מסלולים נוספים' : 'Sign in to create more routes'}
               </p>
             </div>
             <button onClick={onLogin} className="text-[9px] font-black text-emerald-700 uppercase tracking-widest underline decoration-2 underline-offset-4">
               {isHe ? 'התחברות' : 'Sign In'}
             </button>
          </section>
        )}

        <section>
          <button 
            onClick={onOpenFeedback}
            className="w-full flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-emerald-500">
                <MessageSquareHeart size={18} />
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold text-slate-800">{isHe ? 'יש משוב עבורנו?' : 'Have feedback?'}</h3>
                <p className="text-[9px] text-slate-500">{isHe ? 'נשמח לשמוע איך אפשר להשתפר' : 'Tell us how we can improve'}</p>
              </div>
            </div>
            <div className={`text-emerald-400 group-hover:translate-x-${isHe ? '-0.5' : '0.5'} transition-transform`}>
              <Navigation size={14} className={isHe ? "rotate-180" : ""} />
            </div>
          </button>
        </section>

        <section>
          <label className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2.5 px-1">
            <Globe size={10} /> {isHe ? 'שפת האפליקציה' : 'App Language'}
          </label>
          <div className="flex gap-2">
            {['he', 'en'].map((lang) => (
              <button
                key={lang}
                onClick={() => setPreferences({ ...preferences, language: lang as 'he' | 'en' })}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                  preferences.language === lang
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-400 border-slate-100'
                }`}
              >
                {lang === 'he' ? 'עברית' : 'English'}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2.5 px-1">
            <BookOpen size={10} /> {isHe ? 'תחומי עניין' : 'Interests'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-medium transition-all border ${
                  preferences.interests.includes(interest)
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-slate-400 border-slate-100 hover:bg-emerald-50'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </section>

        {/* Saved Routes Section */}
        <section>
          <label className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">
            <Heart size={10} className="fill-current text-emerald-400" /> {isHe ? 'המסלולים שלי' : 'My Saved Tours'}
          </label>
          {(!user && savedRoutes.length === 0) ? (
            <div className="bg-slate-50/50 rounded-xl p-5 text-center border border-dashed border-slate-200">
               <p className="text-[10px] text-slate-400 font-light mb-1.5">{isHe ? 'כדאי להתחבר לשמירת מסלולים' : 'Sign in to save routes'}</p>
               <button onClick={onLogin} className="text-emerald-600 font-bold text-[9px] uppercase tracking-widest">{isHe ? 'התחברות עכשיו' : 'Login Now'}</button>
            </div>
          ) : savedRoutes.length === 0 ? (
            <div className="bg-slate-50/50 rounded-xl p-5 border border-dashed border-slate-200 text-center text-slate-300">
              <p className="text-[8px] font-medium uppercase tracking-widest">
                {isHe ? 'עדיין לא נשמרו מסלולים' : 'No saved tours yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedRoutes.map((row) => {
                const isOffline = offlineRouteIds.includes(row.route_data.id);
                return (
                  <div key={row.id} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex flex-col gap-3 group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-right min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{row.route_data?.city}</span>
                          {isOffline && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[7px] font-black rounded uppercase tracking-tighter shadow-sm">
                              <Download size={8} />
                              {isHe ? 'אופליין' : 'Offline'}
                            </div>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 truncate mt-0.5">{row.route_data?.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => onLoadRoute(row.route_data.city, row.route_data)} 
                          className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-all active:scale-95 shadow-md"
                        >
                          <Navigation size={16} fill="currentColor" />
                        </button>
                        <button 
                          onClick={() => onDeleteRoute(row.id)} 
                          className="w-10 h-10 bg-slate-50 text-slate-300 hover:text-red-500 rounded-lg flex items-center justify-center transition-all active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Saved Places Section */}
        <section>
          <label className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">
            <MapPin size={10} className="text-emerald-400" /> {isHe ? 'המקומות שאהבתי' : 'My Saved Places'}
          </label>
          {savedPois.length === 0 ? (
            <div className="bg-slate-50/50 rounded-xl p-5 border border-dashed border-slate-200 text-center text-slate-300">
              <p className="text-[8px] font-medium uppercase tracking-widest">
                {isHe ? 'אין מקומות שמורים עדיין' : 'No saved places yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {savedPois.map((row) => (
                <div key={row.id} className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm flex flex-col group h-full">
                  <div className="h-20 w-full relative">
                    <img src={row.poi_data.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt={row.poi_name} />
                    <button onClick={() => onDeletePoi(row.id)} className="absolute top-1.5 right-1.5 p-1 bg-white/80 backdrop-blur-sm rounded-lg text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all"><X size={10} /></button>
                  </div>
                  <div className="p-2.5 text-right">
                    <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest">{row.city}</span>
                    <h4 className="text-[10px] font-bold text-slate-800 truncate leading-tight mt-0.5">{row.poi_name}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pt-2 flex justify-center">
           <a 
             href="https://www.buymeacoffee.com/travel.ai" 
             target="_blank" 
             rel="noopener noreferrer"
             className="flex items-center gap-2.5 bg-[#FFDD00] hover:bg-[#ffea00] text-black px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 group border border-black/5"
           >
             <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
               <Coffee size={14} fill="black" />
             </div>
             <span className="text-xs font-bold">
               {isHe ? 'תמיכה בקפה' : 'Buy me a coffee'}
             </span>
           </a>
        </section>

        <div className="pt-10 border-t border-slate-100 space-y-4">
           <div className="flex items-center justify-center gap-5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-1.5">
                <Users size={10} />
                <span>Urbanito v2.9</span>
              </div>
           </div>
           
           <div className="text-center space-y-3">
              <button 
                onClick={handleShareInvite}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-50 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 shadow-sm"
              >
                <Share2 size={10} />
                {isHe ? "לינק להזמנה" : "Invitation Link"}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
