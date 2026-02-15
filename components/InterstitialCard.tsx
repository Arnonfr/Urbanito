import React, { useState } from 'react';
import { History, Image as ImageIcon, Loader2, Info } from 'lucide-react';

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

    // Highlight Card
    return (
        <div className="my-4 mx-2">
            <div className="relative bg-white/90 backdrop-blur-md p-4 rounded-[16px] border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] overflow-hidden">

                <div className="relative flex gap-3">
                    <div className="shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                            <Info size={14} />
                        </div>
                    </div>

                    <div className="flex-1">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            {isHe ? 'הידעת?' : 'Did You Know?'}
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {content || (isHe ? 'פרט מעניין...' : 'Interesting fact...')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
