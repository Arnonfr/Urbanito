import React, { useState } from 'react';
import { ArrowLeft, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import ResearchThankYou from './ResearchThankYou';

interface Question {
    id: string;
    category: string;
    question: string;
    subtitle?: string;
    type?: 'horizontal_cards' | 'conditional' | 'slider' | 'text';
    options?: {
        id: string;
        label: string;
        icon: string;
        description?: string;
    }[];
    multiSelect?: boolean;
    maxSelect?: number;
    showIf?: () => boolean;
    followUp?: {
        condition: string;
        question: string;
        options: { id: string; label: string; icon: string; }[];
    };
    sliderConfig?: {
        min: number;
        max: number;
        labels: string[];
        emojis: string[];
    };
    placeholder?: string;
    optional?: boolean;
}

const Research: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [couponCode, setCouponCode] = useState<string>('');

    // Determine which questions to show based on traveler type
    const getTravelerType = () => answers['traveler_type'] as string | undefined;
    const isUrbanTraveler = () => {
        const type = getTravelerType();
        return type === 'urban' || type === 'both';
    };
    const isNatureTraveler = () => {
        const type = getTravelerType();
        return type === 'nature' || type === 'both';
    };

    const questions = [
        {
            id: 'traveler_type',
            category: 'התחלה',
            question: 'איזה סוג של מטייל/ת את/ה?',
            subtitle: 'בחר את הסגנון שמתאר אותך הכי טוב',
            type: 'horizontal_cards',
            options: [
                {
                    id: 'urban',
                    label: 'עירוני',
                    icon: '🏙️',
                    description: 'מעדיף/ה טיולים בערים, מוזיאונים, מסעדות ותרבות'
                },
                {
                    id: 'nature',
                    label: 'טבע',
                    icon: '🏞️',
                    description: 'אוהב/ת נחלים, הרים, שבילים ופעילות בחיק הטבע'
                },
                {
                    id: 'both',
                    label: 'גם וגם',
                    icon: '🌍',
                    description: 'נהנה/ת משניהם - תלוי במצב הרוח'
                }
            ]
        },
        {
            id: 'urban_interests',
            category: 'פרופיל אישי',
            showIf: () => isUrbanTraveler(),
            question: 'מה מעניין אותך בטיולים עירוניים?',
            subtitle: 'ניתן לבחור מספר אפשרויות',
            multiSelect: true,
            options: [
                { id: 'history', label: 'היסטוריה וסיפורי מקום', icon: '🏛️' },
                { id: 'foodie', label: 'קולינריה ומקומות בילוי (Foodie)', icon: '🍔' },
                { id: 'art', label: 'אמנות, מוזיאונים וגלריות', icon: '🎨' },
                { id: 'architecture', label: 'ארכיטקטורה ועיצוב עירוני', icon: '🏗️' },
                { id: 'nightlife', label: 'חיי לילה ובידור', icon: '🎭' },
                { id: 'shopping', label: 'קניות ושווקים', icon: '🛍️' },
                { id: 'local_culture', label: 'תרבות מקומית ואנשים', icon: '👥' }
            ]
        },
        {
            id: 'nature_interests',
            category: 'פרופיל אישי',
            showIf: () => isNatureTraveler() && !isUrbanTraveler(),
            question: 'מה מעניין אותך בטיולי טבע?',
            subtitle: 'ניתן לבחור מספר אפשרויות',
            multiSelect: true,
            options: [
                { id: 'streams', label: 'נחלים ומעיינות', icon: '💧' },
                { id: 'long_treks', label: 'טרקים ארוכים', icon: '🥾' },
                { id: 'viewpoints', label: 'נקודות תצפית ונופים', icon: '🏔️' },
                { id: 'camping', label: 'קמפינג ולינה בשטח', icon: '⛺' },
                { id: 'wildlife', label: 'חי וצומח', icon: '🦅' },
                { id: 'challenging', label: 'מסלולים מאתגרים', icon: '⚡' },
                { id: 'family_friendly', label: 'מסלולים משפחתיים נגישים', icon: '👨‍👩‍👧‍👦' }
            ]
        },
        {
            id: 'travel_companions',
            category: 'פרופיל אישי',
            question: 'עם מי את/ה מטייל/ת לרוב?',
            subtitle: 'ניתן לבחור מספר אפשרויות',
            multiSelect: true,
            maxSelect: 3,
            options: [
                { id: 'solo', label: 'לבד', icon: '🚶' },
                { id: 'partner', label: 'עם בן/בת זוג', icon: '💑' },
                { id: 'family_kids', label: 'משפחה עם ילדים', icon: '👨‍👩‍👧‍👦' },
                { id: 'friends', label: 'עם חברים', icon: '👥' },
                { id: 'group', label: 'קבוצה מאורגנת', icon: '🚌' }
            ]
        },
        {
            id: 'israel_vs_abroad',
            category: 'הרגלי טיול',
            question: 'איפה יוצא לך לטייל בדרך כלל?',
            options: [
                { id: 'mostly_israel', label: 'בעיקר בארץ', icon: '🇮🇱' },
                { id: 'mixed', label: 'משלב/ת - גם בארץ וגם בחו"ל', icon: '🌍' },
                { id: 'mostly_abroad', label: 'בעיקר בחו"ל', icon: '✈️' }
            ]
        },


        {
            id: 'trust_and_content',
            category: 'מקורות מידע',
            question: 'על מי את/ה סומך/ת הכי הרבה כשאת/ה מחפש/ת המלצות לטיולים?',
            subtitle: 'ניתן לבחור עד 2 אפשרויות',
            multiSelect: true,
            maxSelect: 2,
            options: [
                { id: 'friends', label: 'חברים ומשפחה', icon: '👥' },
                { id: 'influencers', label: 'בלוגרים ומשפיענים מקומיים', icon: '✍️' },
                { id: 'crowd', label: 'דירוגי המונים (Google/TripAdvisor)', icon: '⭐' },
                { id: 'ai', label: 'המלצות מותאמות אישית (AI)', icon: '🤖' }
            ]
        },
        {
            id: 'travel_style',
            category: 'DNA של המטייל',
            question: 'כשאת/ה מגיע/ה לעיר חדשה, מה מתאר אותך הכי טוב?',
            options: [
                { id: 'planner', label: 'חורש/ת על בלוגים ובונה לו"ז מדויק מראש', icon: '📝' },
                { id: 'hybrid', label: 'מסמן/ת כמה נקודות עניין בגוגל מאפס וזורמ/ת', icon: '📍' },
                { id: 'wanderer', label: 'מגיע/ה ופשוט מתחיל/ה ללכת לאן שהרגליים לוקחות אותי', icon: '🚶' }
            ]
        },



        {
            id: 'guided_tours',
            category: 'חשיפת הכאב',
            showIf: () => isUrbanTraveler(),
            question: 'האם אי פעם השתמשת בסיור מודרך (אנושי או אודיו)?',
            type: 'conditional',
            options: [
                { id: 'yes', label: 'כן, השתמשתי', icon: '✅' },
                { id: 'no', label: 'לא, מעולם לא', icon: '❌' }
            ],
            followUp: {
                condition: 'no',
                question: 'למה לא?',
                options: [
                    { id: 'expensive', label: 'זה יקר מדי', icon: '💸' },
                    { id: 'restrictive', label: 'לא אוהב/ת לקבל הוראות', icon: '🚫' },
                    { id: 'heavy', label: 'זה מרגיש כבד ולא ספונטני', icon: '⏱️' },
                    { id: 'other', label: 'סיבה אחרת', icon: '🤷' }
                ]
            }
        },
        {
            id: 'nature_guided',
            category: 'חשיפת הכאב',
            showIf: () => isNatureTraveler() && !isUrbanTraveler(),
            question: 'האם אי פעם השתמשת במדריך טיולים או אפליקציה לניווט בשטח?',
            type: 'conditional',
            options: [
                { id: 'yes', label: 'כן, השתמשתי', icon: '✅' },
                { id: 'no', label: 'לא, מעולם לא', icon: '❌' }
            ],
            followUp: {
                condition: 'no',
                question: 'למה לא?',
                options: [
                    { id: 'prefer_spontaneous', label: 'מעדיף/ה לגלות בעצמי', icon: '🧭' },
                    { id: 'no_need', label: 'יודע/ת את השטח', icon: '🗺️' },
                    { id: 'tech_issues', label: 'בעיות סוללה/קליטה', icon: '📵' },
                    { id: 'other', label: 'סיבה אחרת', icon: '🤷' }
                ]
            }
        },
        {
            id: 'ai_route',
            category: 'בדיקת היתכנות',
            showIf: () => isUrbanTraveler(),
            question: 'אם היתה אפליקציה שבונה לך מסלול של שעה לפי הטעם שלך (למשל: רק ארכיטקטורה וקפה), כמה סביר שתשתמש/י בה?',
            type: 'slider',
            sliderConfig: {
                min: 1,
                max: 5,
                labels: ['בכלל לא', 'לא סביר', 'אולי', 'סביר', 'בטוח כן!'],
                emojis: ['❌', '😕', '🤔', '👍', '🔥']
            }
        },
        {
            id: 'nature_route',
            category: 'בדיקת היתכנות',
            showIf: () => isNatureTraveler() && !isUrbanTraveler(),
            question: 'אם היתה אפליקציה שמציעה מסלולי טיול בטבע מותאמים אישית (קושי, אורך, נופים), כמה סביר שתשתמש/י בה?',
            type: 'slider',
            sliderConfig: {
                min: 1,
                max: 5,
                labels: ['בכלל לא', 'לא סביר', 'אולי', 'סביר', 'בטוח כן!'],
                emojis: ['❌', '😕', '🤔', '👍', '🔥']
            }
        },
        {
            id: 'content_pref',
            category: 'בדיקת היתכנות',
            showIf: () => isUrbanTraveler(),
            question: 'כשאת/ה עומד/ת מול בניין מרשים, מה היית מעדיף/ה?',
            options: [
                { id: 'text', label: 'לקרוא טקסט קצר עליו (כמו בויקיפדיה)', icon: '📖' },
                { id: 'audio', label: 'לשמוע סיפור אודיו קצר (דקה) באוזניות', icon: '🎧' },
                { id: 'video', label: 'לראות סרטון קצר', icon: '🎬' },
                { id: 'none', label: 'לא מעניין אותי המידע, רק היופי', icon: '🤷' }
            ]
        },
        {
            id: 'nature_content_pref',
            category: 'בדיקת היתכנות',
            showIf: () => isNatureTraveler() && !isUrbanTraveler(),
            question: 'כשאת/ה מגיע/ה לנקודת תצפית או מפל, מה היית מעדיף/ה?',
            options: [
                { id: 'text', label: 'לקרוא על ההיסטוריה הגיאולוגית', icon: '📖' },
                { id: 'audio', label: 'לשמוע הסבר על הטבע והחי והצומח', icon: '🎧' },
                { id: 'app', label: 'אפליקציה שמזהה צמחים ובעלי חיים', icon: '📱' },
                { id: 'none', label: 'רק ליהנות מהנוף', icon: '🤷' }
            ]
        },
        {
            id: 'pricing',
            category: 'נכונות לשלם',
            question: 'כמה היית מוכן/ה לשלם עבור גרסת פרימיום?',
            subtitle: 'מסלולים ארוכים יותר, אודיו מקצועי, הורדה לאופליין, תמונות ופיצ\'רים נוספים',
            type: 'slider',
            sliderConfig: {
                min: 1,
                max: 4,
                labels: ['רק חינם', '$5-10 לשנה', '$10-15 לשנה', 'מעל $15'],
                emojis: ['🆓', '💵', '💰', '💎']
            }
        }
    ];

    const typedQuestions = (questions as Question[]);

    // Filter questions based on showIf conditions
    const filteredQuestions = typedQuestions.filter(q => !q.showIf || q.showIf());
    const currentQ = filteredQuestions[step];
    const progress = ((step + 1) / filteredQuestions.length) * 100;

    const handleOptionSelect = (optionId: string) => {
        if (currentQ.multiSelect) {
            const currentSelected = (answers[currentQ.id] as string[]) || [];
            if (currentSelected.includes(optionId)) {
                setAnswers({ ...answers, [currentQ.id]: currentSelected.filter(id => id !== optionId) });
            } else {
                if (currentSelected.length < (currentQ.maxSelect || 99)) {
                    setAnswers({ ...answers, [currentQ.id]: [...currentSelected, optionId] });
                }
            }
        } else {
            setAnswers({ ...answers, [currentQ.id]: optionId });
            // Auto advance disabled per user request
        }
    };

    const handleNext = () => {
        if (step < filteredQuestions.length - 1) {
            setStep(s => s + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Get next available coupon
            const { data: couponData, error: couponError } = await supabase
                .rpc('get_next_coupon');

            if (couponError) {
                console.error('Error getting coupon:', couponError);
                alert('אופס! משהו השתבש. אנא נסה שוב.');
                setIsSubmitting(false);
                return;
            }

            const code = couponData as string;

            if (!code) {
                alert('מצטערים, כל הקופונים נתפסו! תודה על ההשתתפות.');
                navigate('/');
                return;
            }

            // Save research response
            const { error: responseError } = await supabase
                .from('research_responses')
                .insert({
                    answers,
                    coupon_code: code
                });

            if (responseError) {
                console.error('Error saving response:', responseError);
            }

            // Show thank you page with coupon
            setCouponCode(code);
            setIsComplete(true);
        } catch (error) {
            console.error('Unexpected error:', error);
            alert('אופס! משהו השתבש. אנא נסה שוב.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show thank you page if complete
    if (isComplete && couponCode) {
        return <ResearchThankYou couponCode={couponCode} />;
    }

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-y-auto overflow-x-hidden" dir="rtl">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex items-center gap-4 border-b border-slate-100 shadow-sm sticky top-0 z-10 shrink-0">
                <button
                    onClick={() => navigate('/')}
                    className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400"
                >
                    <ChevronRight />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">מחקר משתמשים</h1>
                    <p className="text-xs text-slate-500">עזרו לנו לעצב את העתיד של Urbanito</p>
                </div>
                <div className="mr-auto">
                    <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                        <span>{step + 1}</span>
                        <span className="text-indigo-300">/</span>
                        <span>{filteredQuestions.length}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-indigo-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 -z-10" />
            </div>

            {/* Content */}
            <div className="flex-1 max-w-lg w-full mx-auto p-6 pb-32">
                <div className="mb-8">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#6366F1] bg-indigo-50 px-2 py-1 rounded-md">
                        {currentQ.category}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 mt-3 leading-tight">
                        {currentQ.question}
                    </h2>
                    {currentQ.subtitle && (
                        <p className="text-slate-500 text-sm mt-2">{currentQ.subtitle}</p>
                    )}
                </div>

                <div className="space-y-3">
                    {currentQ.type === 'slider' && currentQ.sliderConfig ? (
                        <div className="py-6">
                            <div className="relative px-2">
                                {/* Slider Track */}
                                <input
                                    type="range"
                                    min={currentQ.sliderConfig.min}
                                    max={currentQ.sliderConfig.max}
                                    value={answers[currentQ.id] as number || currentQ.sliderConfig.min}
                                    onChange={(e) => setAnswers({ ...answers, [currentQ.id]: parseInt(e.target.value) })}
                                    className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full appearance-none cursor-pointer slider-thumb"
                                    style={{
                                        background: `linear-gradient(to right, #FCA5A5 0%, #FDE047 50%, #86EFAC 100%)`
                                    }}
                                />

                                {/* Labels */}
                                <div className="flex justify-between mt-4 px-1">
                                    {currentQ.sliderConfig.labels.map((label, idx) => {
                                        const value = currentQ.sliderConfig!.min + idx;
                                        const isSelected = (answers[currentQ.id] as number || currentQ.sliderConfig!.min) === value;
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex flex-col items-center transition-all duration-300 ${isSelected ? 'scale-110' : 'scale-90 opacity-40'}`}
                                            >
                                                <div className={`text-4xl mb-2 transition-all duration-500 ${isSelected ? 'animate-bounce drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`}>
                                                    {currentQ.sliderConfig!.emojis[idx]}
                                                </div>
                                                <span className={`text-[10px] font-bold text-center leading-tight max-w-[60px] ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                    {label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Slider Styles */}
                            <style>{`
                                .slider-thumb::-webkit-slider-thumb {
                                    appearance: none;
                                    width: 32px;
                                    height: 32px;
                                    border-radius: 50%;
                                    background: #6366F1;
                                    border: 4px solid white;
                                    cursor: pointer;
                                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                                }
                                .slider-thumb::-webkit-slider-thumb:hover {
                                    transform: scale(1.1);
                                    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.6);
                                }
                                .slider-thumb::-moz-range-thumb {
                                    width: 32px;
                                    height: 32px;
                                    border-radius: 50%;
                                    background: #6366F1;
                                    border: 4px solid white;
                                    cursor: pointer;
                                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                                }
                                .slider-thumb::-moz-range-thumb:hover {
                                    transform: scale(1.1);
                                    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.6);
                                }
                            `}</style>
                        </div>
                    ) : currentQ.type === 'horizontal_cards' ? (
                        <div className="grid grid-cols-3 gap-4">
                            {currentQ.options?.map((opt) => {
                                const isSelected = answers[currentQ.id] === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleOptionSelect(opt.id)}
                                        className={`group relative text-right p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 overflow-hidden ${isSelected
                                            ? 'border-[#6366F1] bg-indigo-50/50 shadow-md ring-4 ring-indigo-50'
                                            : 'border-white bg-white hover:border-slate-100 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-all duration-500 shadow-sm ${isSelected ? 'bg-white scale-110 rotate-3' : 'bg-slate-50 group-hover:scale-105'
                                            }`}>
                                            {opt.icon}
                                        </div>
                                        <div className="text-center">
                                            <span className={`block font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                {opt.label}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 text-center leading-relaxed h-[40px] flex items-center">
                                            {'description' in opt ? opt.description : ''}
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-[#6366F1] rounded-full flex items-center justify-center text-white shadow-sm scale-110 animate-in zoom-in duration-300">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                        )}
                                        {!isSelected && (
                                            <div className="absolute inset-0 bg-transparent group-hover:bg-indigo-50/5 transition-colors pointer-events-none" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : currentQ.type === 'conditional' ? (
                        <>
                            {/* Main question options */}
                            <div className="space-y-3">
                                {currentQ.options?.map((opt) => {
                                    const isSelected = answers[currentQ.id] === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleOptionSelect(opt.id)}
                                            className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${isSelected
                                                ? 'border-[#6366F1] bg-indigo-50 shadow-sm'
                                                : 'border-slate-100 bg-white hover:border-slate-200'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:bg-slate-100'
                                                }`}>
                                                {opt.icon}
                                            </div>
                                            <div className="flex-1">
                                                <span className={`font-medium text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <div className="w-6 h-6 bg-[#6366F1] rounded-full flex items-center justify-center text-white">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Follow-up question if condition is met */}
                            {currentQ.followUp && answers[currentQ.id] === currentQ.followUp.condition && (
                                <div className="mt-8 pt-8 border-t border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">{currentQ.followUp.question}</h3>
                                    <div className="space-y-3">
                                        {currentQ.followUp.options?.map((opt) => {
                                            const followUpKey = `${currentQ.id}_followup`;
                                            const isSelected = answers[followUpKey] === opt.id;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setAnswers({ ...answers, [followUpKey]: opt.id })}
                                                    className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${isSelected
                                                        ? 'border-[#6366F1] bg-indigo-50 shadow-sm'
                                                        : 'border-slate-100 bg-white hover:border-slate-200'
                                                        }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:bg-slate-100'
                                                        }`}>
                                                        {opt.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className={`font-medium text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                            {opt.label}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-6 h-6 bg-[#6366F1] rounded-full flex items-center justify-center text-white">
                                                            <Check size={14} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : currentQ.options ? (
                        currentQ.options.map((opt) => {
                            const isSelected = currentQ.multiSelect
                                ? (answers[currentQ.id] as string[])?.includes(opt.id)
                                : answers[currentQ.id] === opt.id;

                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(opt.id)}
                                    className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${isSelected
                                        ? 'border-[#6366F1] bg-indigo-50 shadow-sm'
                                        : 'border-slate-100 bg-white hover:border-slate-200'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:bg-slate-100'
                                        }`}>
                                        {opt.icon}
                                    </div>
                                    <div className="flex-1">
                                        <span className={`font-medium text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                            {opt.label}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 bg-[#6366F1] rounded-full flex items-center justify-center text-white">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    ) : (
                        <textarea
                            className="w-full h-40 p-4 rounded-xl border-2 border-slate-200 focus:border-[#6366F1] focus:ring-0 outline-none resize-none bg-white text-base"
                            placeholder={currentQ.placeholder}
                            value={answers[currentQ.id] as string || ''}
                            onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                        />
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 p-6 flex justify-between items-center z-20 max-w-lg mx-auto w-full left-0 right-0">
                <button
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="px-6 py-3 rounded-full text-slate-500 font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                    חזור
                </button>

                <button
                    onClick={handleNext}
                    disabled={(() => {
                        // If optional, never disable
                        if (currentQ.optional) return false;

                        // Check if main question is answered
                        const mainAnswered = currentQ.multiSelect
                            ? (answers[currentQ.id] as string[])?.length > 0
                            : (currentQ.type === 'slider' ? !!answers[currentQ.id] : !!answers[currentQ.id]);

                        if (!mainAnswered) return true;

                        // For conditional questions, check if follow-up is answered when needed
                        if (currentQ.type === 'conditional' && currentQ.followUp) {
                            const shouldShowFollowUp = answers[currentQ.id] === currentQ.followUp.condition;
                            if (shouldShowFollowUp) {
                                const followUpKey = `${currentQ.id}_followup`;
                                return !answers[followUpKey];
                            }
                        }

                        return false;
                    })()}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-[0_10px_20px_-5px_rgba(99,102,241,0.4)] flex items-center gap-2 disabled:opacity-50 disabled:shadow-none hover:translate-y-[-2px] hover:shadow-[0_15px_25px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95"
                >
                    {isSubmitting ? 'שולח...' : (step === filteredQuestions.length - 1 ? 'סיים ושלח' : 'הבא')}
                    {!isSubmitting && <ChevronLeft size={18} />}
                </button>
            </div>

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default Research;
