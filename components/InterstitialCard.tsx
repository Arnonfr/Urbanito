import React, { useState } from 'react';
import { History, Image as ImageIcon, Loader2, Info, Timer } from 'lucide-react';

interface InterstitialCardProps {
    type: 'reconstruction' | 'highlight';
    content?: string; // For highlight text
    imageUrl?: string; // For reconstruction image
    prompt?: string; // For reconstruction prompt
    onGenerateImage?: () => Promise<void>;
    isLoading?: boolean;
    isHe?: boolean;
}

export const InterstitialCard: React.FC<InterstitialCardProps> = ({
    type,
    content,
    imageUrl,
    prompt,
    onGenerateImage,
    isLoading,
    isHe
}) => {
    const [imageError, setImageError] = useState(false);

    if (type === 'reconstruction') {
        return (
            <div className="my-6 mx-2">
                {imageUrl && !imageError ? (
                    <div className="rounded-[16px] overflow-hidden shadow-lg border border-slate-200 relative group">
                        <img
                            src={imageUrl}
                            alt="Historical Reconstruction"
                            className="w-full h-auto object-cover max-h-[300px]"
                            referrerPolicy="no-referrer"
                            onError={() => setImageError(true)}
                        />
                        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5">
                            <History size={10} className="text-amber-400" />
                            {isHe ? 'שחזור היסטורי' : 'Historical View'}
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onGenerateImage}
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white rounded-[16px] py-4 px-4 flex items-center justify-between shadow-lg active:scale-[0.98] transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                {isLoading ? <Loader2 size={18} className="animate-spin text-indigo-300" /> : <History size={18} className="text-indigo-300" />}
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white">
                                    {isHe ? 'איך זה נראה פעם?' : 'What did it look like?'}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium">
                                    {isHe ? 'לחץ לצפייה בשחזור היסטורי' : 'Tap to see history revealed'}
                                </div>
                            </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                            <ImageIcon size={16} />
                        </div>
                    </button>
                )}
                {imageError && (
                    <div className="mt-2 text-center">
                        <button onClick={onGenerateImage} className="text-xs text-indigo-600 underline font-medium">
                            {isHe ? 'נסה שוב' : 'Try Again'}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Highlight Card - Premium Narrative Style
    return (
        <div className="my-6 mx-2">
            <div className="relative bg-gradient-to-br from-white to-slate-50 p-6 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-700" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-700" />

                <div className="relative flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-[10px] bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100/50">
                                <Info size={14} />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500/60">
                                {isHe ? 'הידעת?' : 'Did You Know?'}
                            </h4>
                        </div>
                    </div>

                    <div className="flex-1">
                        <p className="text-[15px] text-slate-700 leading-relaxed font-semibold italic">
                            &ldquo;{content || (isHe ? 'פרט מעניין...' : 'Interesting fact...')}&rdquo;
                        </p>
                    </div>

                    <div className="h-0.5 w-8 bg-indigo-500/20 rounded-full" />
                </div>
            </div>
        </div>
    );
};
