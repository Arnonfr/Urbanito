
import React from 'react';
import { Search, Loader2, X, User } from 'lucide-react';

interface UnifiedSearchBarProps {
    value: string;
    onChange: (val: string) => void;
    onSearch?: () => void;
    placeholder?: string;
    isLoading?: boolean;
    className?: string;
    autoFocus?: boolean;
    onProfileClick?: () => void;
    userImage?: string | null;
}

export const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
    value,
    onChange,
    onSearch,
    placeholder = "Search...",
    isLoading = false,
    className = "",
    autoFocus = false,
    onProfileClick,
    userImage
}) => {

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch();
        }
    };

    return (
        <div className={`relative flex items-center bg-white border border-slate-200 rounded-[12px] px-3 py-1 transition-all focus-within:ring-2 focus-within:ring-indigo-100 ${className}`}>
            {/* Leading Icon - Search Icon */}
            <div className="shrink-0 text-slate-400">
                {isLoading ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <Search size={18} onClick={onSearch} className={onSearch ? 'cursor-pointer hover:text-indigo-600' : ''} />}
            </div>

            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 px-3 h-10 w-full"
            />

            {value && (
                <button onClick={() => onChange('')} className="shrink-0 text-slate-300 hover:text-slate-500 p-1 rounded-full hover:bg-slate-100 transition-colors mr-1">
                    <X size={14} />
                </button>
            )}

            {/* Profile Icon - Google Maps Style */}
            {onProfileClick && (
                <button
                    onClick={onProfileClick}
                    className="shrink-0 w-8 h-8 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden hover:ring-4 hover:ring-indigo-50 transition-all ml-1 active:scale-90"
                >
                    {userImage ? (
                        <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <User size={16} className="text-slate-400" />
                    )}
                </button>
            )}
        </div>
    );
};
