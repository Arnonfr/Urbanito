
import React, { useState } from 'react';
import { X, Check, MessageSquareHeart, Loader2, Plus, MessageCircle } from 'lucide-react';
import { FeedbackData, FeatureFeedback } from '../types';
import { submitFeedback } from '../services/supabase';

interface Props {
  isHe: boolean;
  userId: string | null;
  onClose: () => void;
}

const EMOJIS = ['😫', '😕', '😐', '🙂', '🤩'];

const initialFeatureState = (): FeatureFeedback => ({
  rating: 5,
  comment: '',
  isSelected: false
});

export const FeedbackModal: React.FC<Props> = ({ isHe, userId, onClose }) => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    sentiment: null,
    features: {
      planning: initialFeatureState(),
      editing: initialFeatureState(),
      saving: initialFeatureState(),
      content: initialFeatureState(),
      audio: initialFeatureState(),
    },
    additionalComments: ''
  });
  
  const [activeComments, setActiveComments] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const t = {
    title: isHe ? 'מה דעתך על Urbanisto?' : 'What do you think of Urbanisto?',
    subtitle: isHe ? 'נשמח לשמוע איך נוכל להשתפר' : 'We would love to hear how we can improve',
    sentimentTitle: isHe ? 'איך ההרגשה הכללית?' : 'How is the general vibe?',
    featuresTitle: isHe ? 'מה עבד לך טוב (או פחות)?' : 'What worked well (or less)?',
    planning: isHe ? 'תכנון מסלול' : 'Planning',
    editing: isHe ? 'עריכה' : 'Editing',
    saving: isHe ? 'שמירה' : 'Saving',
    content: isHe ? 'תוכן עיוני' : 'Historical Content',
    audio: isHe ? 'שמע' : 'Audio',
    placeholder: isHe ? 'הערות שלך כאן...' : 'Your thoughts here...',
    additionalPlaceholder: isHe ? 'משהו נוסף שתרצה לומר?' : 'Anything else you want to say?',
    submit: isHe ? 'שלח משוב' : 'Send Feedback',
    success: isHe ? 'תודה רבה! קיבלנו.' : 'Thanks! We got it.',
    ratingLabels: {
      1: isHe ? 'לא משהו' : 'Not great',
      5: isHe ? 'מעולה' : 'Excellent'
    }
  };

  const handleToggleFeature = (key: keyof FeedbackData['features']) => {
    setFeedback(prev => ({
      ...prev,
      features: { 
        ...prev.features, 
        [key]: { ...prev.features[key], isSelected: !prev.features[key].isSelected } 
      }
    }));
  };

  const updateRating = (key: keyof FeedbackData['features'], rating: number) => {
    setFeedback(prev => ({
      ...prev,
      features: { 
        ...prev.features, 
        [key]: { ...prev.features[key], rating } 
      }
    }));
  };

  const updateComment = (key: keyof FeedbackData['features'], comment: string) => {
    setFeedback(prev => ({
      ...prev,
      features: { 
        ...prev.features, 
        [key]: { ...prev.features[key], comment } 
      }
    }));
  };

  const toggleCommentField = (key: string) => {
    setActiveComments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const ok = await submitFeedback(userId, feedback, isHe ? 'he' : 'en');
    setIsSubmitting(false);
    if (ok) {
      setIsSuccess(true);
      setTimeout(onClose, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div 
        dir={isHe ? 'rtl' : 'ltr'}
        className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]"
      >
        {isSuccess ? (
          <div className="p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t.success}</h2>
          </div>
        ) : (
          <>
            <header className="p-8 pb-4 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <MessageSquareHeart className="text-pink-500" size={24} />
                  {t.title}
                </h2>
                <p className="text-slate-500 text-sm font-light mt-1">{t.subtitle}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                <X size={20} />
              </button>
            </header>

            <div className="p-8 pt-0 space-y-8 overflow-y-auto no-scrollbar flex-1">
              {/* Sentiment Scale */}
              <section className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.sentimentTitle}</label>
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-[2rem]">
                  {EMOJIS.map((emoji, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setFeedback(prev => ({ ...prev, sentiment: idx + 1 }))}
                      className={`text-3xl transition-all hover:scale-125 ${feedback.sentiment === idx + 1 ? 'scale-125 grayscale-0' : 'grayscale opacity-40 hover:opacity-100'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </section>

              {/* Advanced Feature Feedback */}
              <section className="space-y-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.featuresTitle}</label>
                
                <div className="space-y-4">
                  {(Object.keys(feedback.features) as Array<keyof FeedbackData['features']>).map((key) => {
                    const feat = feedback.features[key];
                    return (
                      <div key={key} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleFeature(key)}
                            className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border shrink-0 ${
                              feat.isSelected 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            {t[key]}
                          </button>
                          
                          {feat.isSelected && (
                            <button 
                              onClick={() => toggleCommentField(key)}
                              className={`p-2.5 rounded-xl transition-all ${activeComments[key] ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-900'}`}
                            >
                              <Plus size={18} className={activeComments[key] ? 'rotate-45 transition-transform' : 'transition-transform'} />
                            </button>
                          )}
                        </div>

                        {feat.isSelected && (
                          <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-5 animate-in slide-in-from-top-2 duration-300">
                             <div className="space-y-3">
                               <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                  <span>{t.ratingLabels[1]} (1)</span>
                                  <span className="text-emerald-500 font-black">{feat.rating}</span>
                                  <span>{t.ratingLabels[5]} (5)</span>
                               </div>
                               <input 
                                 type="range" 
                                 min="1" 
                                 max="5" 
                                 step="1"
                                 value={feat.rating} 
                                 onChange={(e) => updateRating(key, parseInt(e.target.value))}
                                 className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-emerald-500 cursor-pointer"
                               />
                             </div>

                             {activeComments[key] && (
                               <div className="animate-in fade-in zoom-in duration-300">
                                 <textarea 
                                   value={feat.comment}
                                   onChange={(e) => updateComment(key, e.target.value)}
                                   placeholder={t.placeholder}
                                   className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-xs font-light outline-none focus:ring-4 ring-emerald-500/10 min-h-[80px] resize-none shadow-inner"
                                 />
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* General Feedback */}
              <section className="space-y-4 pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageCircle size={12} />
                  {isHe ? 'הערות נוספות' : 'General Comments'}
                </label>
                <textarea 
                  value={feedback.additionalComments}
                  onChange={(e) => setFeedback(prev => ({ ...prev, additionalComments: e.target.value }))}
                  placeholder={t.additionalPlaceholder}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-5 text-sm font-light outline-none focus:ring-4 ring-emerald-500/10 min-h-[120px] resize-none shadow-inner"
                />
              </section>
            </div>

            <footer className="p-8 pt-0 shrink-0">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : t.submit}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};
