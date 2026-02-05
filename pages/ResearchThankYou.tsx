import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '../contexts/PremiumContext';

interface Props {
    couponCode: string;
}

const ResearchThankYou: React.FC<Props> = ({ couponCode }) => {
    const navigate = useNavigate();
    const { unlockWithCoupon } = usePremium();
    const [showConfetti, setShowConfetti] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Auto-apply the coupon
        const applyCoupon = async () => {
            try {
                await unlockWithCoupon(couponCode);
            } catch (error) {
                console.error('Failed to apply coupon:', error);
            }
        };
        applyCoupon();

        // Hide confetti after 3 seconds
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, [couponCode, unlockWithCoupon]);

    const handleCopy = () => {
        navigator.clipboard.writeText(couponCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-6 overflow-hidden" dir="rtl">
            {/* Confetti Animation */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${Math.random() * 20}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${3 + Math.random() * 2}s`
                            }}
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][Math.floor(Math.random() * 5)]
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center relative z-10">
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">תודה רבה!</h1>
                <p className="text-slate-600 mb-8">
                    התשובות שלך עוזרות לנו לבנות את Urbanito המושלם עבורך
                </p>

                {/* Coupon Card */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-6 text-white">
                    <div className="text-sm font-medium mb-2 opacity-90">🎁 מתנה מיוחדת בשבילך</div>
                    <div className="text-2xl font-bold mb-1">גישה לפרימיום!</div>
                    <div className="text-sm opacity-90 mb-4">קוד הקופון שלך (מוגבל ל-50 ראשונים)</div>

                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
                        <code className="text-xl font-mono font-bold tracking-wider">{couponCode}</code>
                        <button
                            onClick={handleCopy}
                            className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors"
                        >
                            {copied ? '✓ הועתק' : 'העתק'}
                        </button>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-right">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">✅</div>
                        <div className="flex-1">
                            <div className="font-bold text-green-900 mb-1">הפרימיום הופעל!</div>
                            <div className="text-sm text-green-700">
                                כעת יש לך גישה מלאה לכל התכונות המתקדמות של Urbanito
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:translate-y-[-2px] hover:shadow-xl transition-all shadow-lg active:scale-95"
                >
                    חזרה לאפליקציה
                </button>
            </div>

            {/* CSS for confetti animation */}
            <style>{`
                @keyframes confetti {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                .animate-confetti {
                    animation: confetti linear forwards;
                }
            `}</style>
        </div>
    );
};

export default ResearchThankYou;
