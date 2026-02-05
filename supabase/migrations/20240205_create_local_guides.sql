-- Create Local Guides table
CREATE TABLE IF NOT EXISTS public.local_guides (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    handle text NOT NULL,
    platform text CHECK (platform IN ('x', 'instagram', 'tiktok', 'facebook', 'youtube')),
    profile_image_url text,
    bio text,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Create Guide Posts table (The specific content pieces)
CREATE TABLE IF NOT EXISTS public.guide_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    guide_id uuid REFERENCES public.local_guides(id) ON DELETE CASCADE,
    city text, -- e.g., 'Jerusalem', 'Paris'
    content_text text,
    media_url text, -- The main image/video to show
    media_type text CHECK (media_type IN ('image', 'video')),
    original_link text, -- Link back to the social post
    linked_route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL, -- Optional: link to a full route if it exists
    poi_data jsonb, -- Optional: embedded POI data if it's just a single spot
    tags text[], -- e.g. ['architecture', 'history']
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.local_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_posts ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public can read local guides" ON public.local_guides FOR SELECT USING (true);
CREATE POLICY "Public can read guide posts" ON public.guide_posts FOR SELECT USING (true);

-- Insert Mock Data (Sharon Dinur)
INSERT INTO public.local_guides (id, name, handle, platform, profile_image_url, bio, is_verified)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Sharon Dinur',
    '@DinurSharon',
    'x',
    'https://pbs.twimg.com/profile_images/1612345678/sharon_profile.jpg', -- Placeholder
    'Architect & Conservation Lead. Jerusalem enthusiast.',
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert Mock Data (Post: Diskin Orphanage)
INSERT INTO public.guide_posts (guide_id, city, content_text, media_url, media_type, original_link, poi_data, tags)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Jerusalem',
    'איזה זוג חמוד נכון? והם גם מצטלמים על רקע אחד הסיפורים ההיסטוריים הכי מעניינים בעיר: בית היתומים דיסקין בגבעת שאול.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Diskin_Orphanage_2010.jpg/1200px-Diskin_Orphanage_2010.jpg',
    'image',
    'https://x.com/DinurSharon/status/2019070578234180087',
    '{"name": "Diskin Orphanage", "lat": 31.789, "lng": 35.197}',
    ARRAY['history', 'architecture']
);

-- Insert Mock Data (Francophiles Anonymous)
INSERT INTO public.local_guides (id, name, handle, platform, profile_image_url, bio, is_verified)
VALUES (
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'Francophiles Anonymous',
    '@francophiles_anonymous',
    'instagram',
    'https://instagram.fprofile.placeholder.jpg',
    'Revealing the hidden magic of Paris.',
    false
) ON CONFLICT (id) DO NOTHING;

-- Insert Mock Data (Post: Oldest House)
INSERT INTO public.guide_posts (guide_id, city, content_text, media_url, media_type, original_link, poi_data, tags)
VALUES (
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'Paris',
    'הסיפור הנפלא של הבית הכי עתיק בפריז 🤩',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Maison_de_Nicolas_Flamel_%28Paris%29.jpg/800px-Maison_de_Nicolas_Flamel_%28Paris%29.jpg',
    'image', -- Using image for now instead of video for simplicity
    'https://www.instagram.com/p/DRxNvmWjFW9/',
    '{"name": "Nicolas Flamel House", "lat": 48.863, "lng": 2.354}',
    ARRAY['hidden_gem', 'history']
);
