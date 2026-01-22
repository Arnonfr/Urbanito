
import React, { useState, useEffect } from 'react';
import { UserPreferences, Route, POI } from '../types';
import { User, Globe, Heart, BookOpen, Navigation, Trash2, LogOut, MessageSquareHeart, Coffee, Download, Users, Zap, Share2, MapPin, X, HelpCircle, ChevronLeft, ChevronRight, BookMarked, CloudOff, Key, CheckCircle, ExternalLink, Settings2, ThumbsUp, Info } from 'lucide-react';
import { logPremiumInterest } from '../services/supabase';
import { FeedbackModal } from './FeedbackModal';

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

const LOGO_SVG = "data:image/svg+xml,%3Csvg width='274' height='274' viewBox='0 0 274 274' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_1_2)'%3E%3Crect width='274' height='274' rx='77' fill='%23801ED6'/%3E%3Cpath d='M67.9708 171.182L87.0037 89.5812L94.6606 107.083L70.8148 85.2058L71.9086 81.0492H136.664L135.789 85.6434L107.787 106.864L120.038 89.5812L101.661 168.776C98.1609 184.235 98.3068 196.122 102.099 204.435C106.037 212.602 113.402 216.686 124.194 216.686C131.633 216.686 137.977 215.082 143.227 211.873C148.478 208.519 152.926 203.341 156.572 196.341C160.364 189.34 163.573 180.152 166.198 168.776L184.575 89.5812L189.825 102.926L166.636 84.5495L167.511 81.0492H221.109L220.234 84.7683L194.857 102.707L203.608 89.5812L185.231 168.776C175.022 213.259 152.853 235.5 118.725 235.5C98.0151 235.5 83.2117 229.885 74.3151 218.655C65.4185 207.279 63.3037 191.455 67.9708 171.182Z' fill='white'/%3E%3Ccircle cx='100' cy='78' r='35.5' fill='white' stroke='%23801ED6' stroke-width='5'/%3E%3Ccircle cx='190' cy='78' r='35.5' fill='white' stroke='%23801ED6' stroke-width='5'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_1_2'%3E%3Crect width='274' height='274' rx='77' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E";

const INTERESTS_HE = ['היסטוריה', 'ארכיטקטורה', 'מוזיקה', 'אוכל', 'אמנות', 'צילום', 'קולינריה מקומית', 'אמנות רחוב', 'חיי לילה'];
const INTERESTS_EN = ['History', 'Architecture', 'Music', 'Food', 'Art', 'Photography', 'Local Cuisine', 'Street Art', 'Nightlife'];

export const PreferencesPanel: React.FC<Props> = ({ 
  preferences, setPreferences, savedRoutes, savedPois, offlineRouteIds, onLoadOfflineRoute, onRemoveOffline,
  user, onLogin, onLogout, onLoadRoute, onDeleteRoute, onDeletePoi, onOpenFeedback, onOpenGuide,
  uniqueUserCount, remainingGens
}) => {
  const isHe = preferences.language === 'he';
  const interests = isHe ? INTERESTS_HE : INTERESTS_EN;
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [premiumLiked, setPremiumLiked] = useState(false);

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

  const handlePremiumInterest = async () => {
    if (premiumLiked) return;
    setPremiumLiked(true);
    await logPremiumInterest(user?.id || null);
  };

  const toggleInterest = (interest: string) => {
    const newInterests = preferences.interests.includes(interest)
      ? preferences.interests.filter((i) => i !== interest)
      : [...preferences.interests, interest];
    setPreferences({ ...preferences, interests: newInterests });
  };

  return (
    <div className={`w-full max-w-xl mx-auto pb-40 ${isHe ? 'text-right' : 'text-left'}`} dir={isHe ? 'rtl' : 'ltr'}>
      <div className="pt-6 pb-2 flex justify-center opacity-40 hover:opacity-100 transition-all">
        <img src={LOGO_SVG} alt="Urbanito" className="h-10 w-auto" />
      </div>

      <div className="flex items-center gap-4 py-6 mb-8 border-b border-slate-100">
        <div className="w-14 h-14 bg-white border border-slate-100 rounded-[12px] flex items-center justify-center shadow-sm shrink-0 relative overflow-hidden">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <User size={28} className="text-slate-200" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-medium text-slate-900 tracking-tight truncate">
            {user ? (user.user_metadata?.full_name || user.email) : (isHe ? 'אורח/ת' : 'Guest')}
          </h2>
          {user ? (
            <button 
              onClick={onLogout}
              className="flex items-center gap-1.5 text-[11px] font-medium text-rose-500 hover:text-rose-600 active:bg-rose-50 py-2 px-3 -mx-3 rounded-[8px] transition-all uppercase tracking-[0.1em] mt-1"
            >
              <LogOut size={14} />
              {isHe ? 'התנתקות מהחשבון' : 'Sign Out'}
            </button>
          ) : (
             <p className="text-[10px] text-slate-400 font-normal uppercase tracking-widest mt-1">{isHe ? 'מצב תצוגה בלבד' : 'Viewing only mode'}</p>
          )}
        </div>
        {!user && (
          <button 
            onClick={onLogin}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-[8px] shadow-sm hover:shadow-md active:scale-95 transition-all text-[11px] font-medium text-slate-700 uppercase tracking-widest"
          >
            <img src="https://www.google.com/favicon.ico" className="w-3 h-3" alt="Google" />
            {isHe ? 'התחברות' : 'Sign In'}
          </button>
        )}
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 gap-8">
            <section>
              <label className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">
                <Globe size={12} /> {isHe ? 'שפת האפליקציה' : 'App Language'}
              </label>
              <div className="flex gap-2">
                {['he', 'en'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setPreferences({ ...preferences, language: lang as 'he' | 'en' })}
                    className={`flex-1 py-3 rounded-[8px] text-[11px] font-medium transition-all border uppercase tracking-widest ${
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
              <label className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">
                <BookOpen size={12} /> {isHe ? 'תחומי עניין עיקריים' : 'Key Interests'}
              </label>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-[8px] text-[10px] font-normal transition-all border ${
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

        <section>
          <label className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-5 px-1">
            <Heart size={12} className="fill-current text-rose-500" /> {isHe ? 'המסלולים השמורים שלי' : 'My Saved Tours'}
          </label>
          {savedRoutes.length === 0 ? (
            <div className="bg-slate-50/50 rounded-[8px] p-10 border border-dashed border-slate-200 text-center text-slate-300">
              <p className="text-[9px] font-normal uppercase tracking-[0.2em]">
                {isHe ? 'עדיין לא שמרת מסלולים' : 'No saved tours yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedRoutes.map((row) => {
                const isOffline = offlineRouteIds.includes(row.route_data.id);
                return (
                  <div key={row.id} className="bg-white rounded-[8px] p-4 border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div className="flex-1 text-right min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-medium text-indigo-500 uppercase tracking-widest">{row.route_data?.city}</span>
                        {isOffline && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[7px] font-medium rounded uppercase tracking-tighter shadow-sm">
                            <Download size={8} /> {isHe ? 'זמין אופליין' : 'Offline'}
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-slate-900 truncate mt-1">{row.route_data?.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => onLoadRoute(row.route_data.city, row.route_data)} 
                        className="w-11 h-11 bg-slate-900 text-white rounded-[8px] flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-95 shadow-md"
                      >
                        <Navigation size={18} fill="currentColor" />
                      </button>
                      <button 
                        onClick={() => onDeleteRoute(row.id)} 
                        className="w-11 h-11 bg-white border border-slate-100 text-slate-300 hover:text-red-500 rounded-[8px] flex items-center justify-center transition-all active:scale-95 shadow-sm"
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

        <section className="pt-6 border-t border-slate-100 space-y-4">
           <button 
            onClick={() => setShowFeedbackModal(true)}
            className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[8px] hover:bg-slate-50 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-indigo-50 rounded-[8px] flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                <MessageSquareHeart size={22} />
              </div>
              <div className="text-right">
                <h3 className="text-[13px] font-medium text-slate-900">{isHe ? 'יש לך משוב עבורנו?' : 'Have feedback?'}</h3>
                <p className="text-[10px] text-slate-400 font-normal uppercase tracking-widest mt-0.5">{isHe ? 'נשמח לשמוע ולשפר' : 'Tell us how to improve'}</p>
              </div>
            </div>
            <ChevronLeft size={18} className="text-slate-300" />
          </button>

          <button 
            onClick={onOpenGuide}
            className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[8px] hover:bg-slate-50 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-50 rounded-[8px] flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Info size={22} />
              </div>
              <div className="text-right">
                <h3 className="text-[13px] font-medium text-slate-900">{isHe ? 'איך משתמשים באפליקציה?' : 'How to use?'}</h3>
                <p className="text-[10px] text-slate-400 font-normal uppercase tracking-widest mt-0.5">{isHe ? 'צפייה חוזרת במדריך' : 'Watch user guide'}</p>
              </div>
            </div>
            <ChevronLeft size={18} className="text-slate-300" />
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={handleShareInvite}
              className="flex-1 h-14 flex items-center justify-center gap-3 bg-white border border-slate-100 text-slate-600 rounded-[8px] text-[11px] font-medium uppercase tracking-widest hover:border-indigo-100 hover:text-indigo-600 active:scale-95 transition-all shadow-sm"
            >
              <Share2 size={16} /> {isHe ? "שיתוף אפליקציה" : "Share App"}
            </button>
            <a 
              href="https://www.buymeacoffee.com/travel.ai" 
              target="_blank" 
              className="flex-1 h-14 flex items-center justify-center gap-3 bg-white border border-slate-100 text-slate-600 rounded-[8px] text-[11px] font-medium uppercase tracking-widest hover:border-amber-200 hover:text-amber-600 active:scale-95 transition-all shadow-sm"
            >
              <Coffee size={16} /> Buy me coffee
            </a>
          </div>
        </section>

        <section className="pt-2">
           <div className="bg-indigo-600 text-white p-7 rounded-[8px] shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 flex items-center justify-between gap-6">
                 <div className="flex-1 text-right">
                    <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-200 mb-1">{isHe ? 'בקרוב באורבניטו' : 'COMING SOON'}</h4>
                    <h3 className="text-xl font-medium tracking-tight">{isHe ? 'גירסת פרימיום' : 'Premium Version'}</h3>
                    <p className="text-[11px] text-indigo-50 mt-2 leading-relaxed opacity-90">
                      {isHe ? 'יותר תמונות היסטוריות, הסברים מעמיקים, קריינות קולית חיה ועוד הרבה פנינים.' : 'More historical photos, deep insights, live voice narration and more gems.'}
                    </p>
                 </div>
                 <button 
                  onClick={handlePremiumInterest}
                  className={`w-16 h-16 rounded-[8px] flex items-center justify-center text-2xl transition-all active:scale-90 shadow-xl ${premiumLiked ? 'bg-white text-indigo-600 scale-110' : 'bg-white/20 text-white hover:bg-white/30'}`}
                 >
                   {premiumLiked ? <Heart size={24} fill="#4f46e5" /> : <Heart size={24} />}
                 </button>
              </div>
           </div>
        </section>

        <div className="pt-12 text-center space-y-2 opacity-30">
           <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.4em]">URBANITO V3.1 • 2025</p>
        </div>
      </div>

      {showFeedbackModal && (
        <FeedbackModal 
          isHe={isHe} 
          userId={user?.id || null} 
          onClose={() => setShowFeedbackModal(false)} 
        />
      )}
    </div>
  );
};
