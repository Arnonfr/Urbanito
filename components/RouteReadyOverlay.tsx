import React, { useEffect, useState } from 'react';
import { CheckCircle, MapPinned } from 'lucide-react';

interface Props {
    onClose: () => void;
    isHe: boolean;
}

export const RouteReadyOverlay: React.FC<Props> = ({ onClose, isHe }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 500); // Wait for exit animation
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

            <div className="bg-white rounded-3xl p-8 shadow-2xl transform scale-100 animate-in zoom-in-50 duration-500 flex flex-col items-center text-center max-w-xs mx-4 relative border-4 border-indigo-100">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-lg shadow-green-200 animate-bounce">
                    <CheckCircle size={40} strokeWidth={3} />
                </div>

                <h2 className="text-2xl font-black text-slate-800 mb-2">
                    {isHe ? 'המסלול מוכן!' : 'Tour Ready!'}
                </h2>

                <p className="text-slate-500 font-medium">
                    {isHe ? 'הכל מוכן ליציאה לדרך.' : 'All set to start exploring.'}
                </p>

                {/* Confetti Particles (CSS Only) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 4)],
                                animation: `ping ${1 + Math.random()}s infinite`
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
