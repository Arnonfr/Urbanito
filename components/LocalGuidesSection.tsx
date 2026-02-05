import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { GuidePost } from '../types';
import { ExternalLink, User, Verified, Sparkles, MapPin, ArrowRight, Instagram, Twitter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleImage } from './GoogleImage';

interface LocalGuidesSectionProps {
    city: string; // e.g., 'Jerusalem'
    className?: string;
    onPostClick?: (post: GuidePost) => void;
}

export const LocalGuidesSection: React.FC<LocalGuidesSectionProps> = ({ city, className = '', onPostClick }) => {
    const [posts, setPosts] = useState<GuidePost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            // Normalize city name for query if needed, or rely on exact match for now
            // We check for both English and Hebrew names in the DB if possible, or just the main one
            const { data, error } = await supabase
                .from('guide_posts')
                .select(`
    *,
    guide: local_guides(*)
        `)
                // Simple case-insensitive match or just match the passed city string
                // In a real app we'd map 'ירושלים' to 'Jerusalem' or have synonyms
                // Simple case-insensitive match or just match the passed city string
                // In a real app we'd map 'ירושלים' to 'Jerusalem' or have synonyms
                .or(`city.ilike.% ${city}%, city.eq.Jerusalem, city.eq.Paris`)
                .limit(10);

            if (!error && data && data.length > 0) {
                setPosts(data as GuidePost[]);
            } else {
                // Fallback Mock Data for Demo purposes (since SQL might not be run yet)
                console.warn('Using Local Guide Mock Data (DB empty or missing)', error);
                if (city === 'Jerusalem' || city === 'ירושלים') {
                    setPosts([{
                        id: 'mock-1',
                        guide_id: 'mock-g-1',
                        city: 'Jerusalem',
                        content_text: 'איזה זוג חמוד נכון? והם גם מצטלמים על רקע אחד הסיפורים ההיסטוריים הכי מעניינים בעיר: בית היתומים דיסקין בגבעת שאול.',
                        media_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Diskin_Orphanage_2010.jpg/1200px-Diskin_Orphanage_2010.jpg',
                        media_type: 'image',
                        original_link: 'https://x.com/DinurSharon/status/2019070578234180087',
                        created_at: new Date().toISOString(),
                        guide: {
                            id: 'mock-g-1',
                            name: 'Sharon Dinur',
                            handle: '@DinurSharon',
                            platform: 'x',
                            profile_image_url: 'https://pbs.twimg.com/profile_images/1612345678/sharon_profile.jpg',
                            is_verified: true,
                            bio: 'Architect & Conservation Lead'
                        },
                        poi_data: { name: 'Diskin Orphanage', lat: 31.789, lng: 35.197 },
                        tags: ['Architecture', 'History']
                    }]);
                } else if (city === 'Paris' || city === 'פריז') {
                    setPosts([{
                        id: 'mock-2',
                        guide_id: 'mock-g-2',
                        city: 'Paris',
                        content_text: 'הסיפור הנפלא של הבית הכי עתיק בפריז 🤩',
                        media_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Maison_de_Nicolas_Flamel_%28Paris%29.jpg/800px-Maison_de_Nicolas_Flamel_%28Paris%29.jpg',
                        media_type: 'image',
                        original_link: 'https://www.instagram.com/p/DRxNvmWjFW9/',
                        created_at: new Date().toISOString(),
                        guide: {
                            id: 'mock-g-2',
                            name: 'Francophiles Anonymous',
                            handle: '@francophiles_anonymous',
                            platform: 'instagram',
                            profile_image_url: 'https://instagram.fprofile.placeholder.jpg',
                            is_verified: false,
                            bio: 'Hidden Paris Specialist'
                        },
                        poi_data: { name: 'Maison de Nicolas Flamel', lat: 48.863, lng: 2.354 },
                        tags: ['Hidden Gem', 'Medieval']
                    }]);
                }
            }
            setLoading(false);
        };

        fetchPosts();
    }, [city]);

    if (!loading && posts.length === 0) return null;

    return (
        <div className={`w - full space - y - 6 ${className} `}>
            {/* Header - Editorial Style */}
            <div className="flex items-end justify-between border-b border-amber-200/40 pb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={16} className="text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.15em]">Curated Stories</span>
                    </div>
                    <h2 className="text-2xl font-serif text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Local Voices
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-light">
                        Discover hidden narratives from urban storytellers
                    </p>
                </div>
            </div>

            {/* Cards - Horizontal Scroll */}
            <div className="overflow-x-auto pb-6 -mx-6 px-6 scrollbar-hide">
                <div className="flex gap-6 w-max">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="w-[340px] h-[420px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl animate-pulse" />
                        ))
                    ) : (
                        posts.map((post, idx) => (
                            <GuideCard key={post.id} post={post} onClick={() => onPostClick && onPostClick(post)} index={idx} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const GuideCard = ({ post, onClick, index }: { post: GuidePost, onClick: () => void, index: number }) => {
    const guide = post.guide;
    if (!guide) return null;

    // Determine display values
    const title = post.poi_data?.name || "Hidden Gem";
    const imageQuery = post.poi_data?.name ? `${post.city} ${post.poi_data.name} ` : `${post.city} secret spot`;

    const PlatformIcon = guide.platform === 'instagram' ? Instagram : Twitter;

    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            whileTap={{ scale: 0.98 }}
            className="relative w-[340px] h-[440px] rounded-2xl overflow-hidden shrink-0 group bg-white shadow-lg hover:shadow-2xl transition-all duration-500 text-left border border-slate-100"
        >
            {/* Image Section - 60% height */}
            <div className="relative h-[60%] bg-slate-200 overflow-hidden">
                {post.media_url ? (
                    <img
                        src={post.media_url}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={title}
                    />
                ) : (
                    <GoogleImage
                        query={imageQuery}
                        className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                        size="medium"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Guide Badge - Refined */}
                <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-white/95 backdrop-blur-xl p-2 pr-3.5 rounded-full shadow-lg border border-white/60 z-10 transition-all duration-300 group-hover:bg-white group-hover:shadow-xl">
                    <img
                        src={guide.profile_image_url || 'https://via.placeholder.com/40'}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                        alt={guide.name}
                        onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + guide.name }}
                    />
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
                            {guide.name}
                            {guide.is_verified && <Verified size={11} className="text-blue-500 fill-blue-500" />}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <PlatformIcon size={10} />
                            {guide.platform}
                        </span>
                    </div>
                </div>

                {/* Tags - Floating Bottom */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap">
                    {post.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-white/50 shadow-sm">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Content Section - 40% height */}
            <div className="h-[40%] p-5 flex flex-col justify-between bg-gradient-to-br from-white to-slate-50/50">
                {/* Title & Description */}
                <div>
                    <h3 className="text-lg font-serif font-bold text-slate-900 mb-2 leading-tight line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {title}
                    </h3>
                    <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed font-light" dir="auto">
                        {post.content_text}
                    </p>
                </div>

                {/* CTA - Refined */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-amber-700 font-medium group-hover:text-amber-800 transition-colors">
                        <Sparkles size={13} className="group-hover:rotate-12 transition-transform" />
                        <span>Explore Story</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white group-hover:scale-110 group-hover:shadow-lg transition-all shadow-md">
                        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>
        </motion.button>
    );
};
