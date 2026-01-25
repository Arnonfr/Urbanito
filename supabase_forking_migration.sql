-- Migration to support Route Forking and Optimization
-- 1. Table for shared POI content (deduplicated)
CREATE TABLE IF NOT EXISTS public.pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT UNIQUE NOT NULL, -- SHA256 of stable_id or similar
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store heavy narrative, images here
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for pois
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;
CREATE POLICY "POIs are viewable by everyone" ON public.pois FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert POIs" ON public.pois FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 2. Table for Routes (lightweight, user-specific)
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL, -- For forking
    city TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    preferences JSONB DEFAULT '{}'::jsonb, -- Store constraints/prefs used to generate this
    is_public BOOLEAN DEFAULT false,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for routes
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own routes" ON public.routes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public routes" ON public.routes FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert their own routes" ON public.routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routes" ON public.routes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routes" ON public.routes FOR DELETE USING (auth.uid() = user_id);


-- 3. Junction table linking Routes to POIs with order
CREATE TABLE IF NOT EXISTS public.route_pois (
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    poi_id UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    travel_data JSONB, -- Optional: distance/time from previous POI specific to this route context
    PRIMARY KEY (route_id, poi_id)
);

-- RLS for route_pois
ALTER TABLE public.route_pois ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view route_pois if they can view the route" ON public.route_pois FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.routes r WHERE r.id = route_pois.route_id AND (r.user_id = auth.uid() OR r.is_public = true))
);
CREATE POLICY "Users can insert route_pois if they own the route" ON public.route_pois FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.routes r WHERE r.id = route_pois.route_id AND r.user_id = auth.uid())
);
CREATE POLICY "Users can delete route_pois if they own the route" ON public.route_pois FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.routes r WHERE r.id = route_pois.route_id AND r.user_id = auth.uid())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pois_content_hash ON public.pois(content_hash);
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON public.routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_parent_id ON public.routes(parent_route_id);
CREATE INDEX IF NOT EXISTS idx_route_pois_route_id ON public.route_pois(route_id);
