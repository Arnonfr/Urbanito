-- Create user_saved_routes table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_saved_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, route_id)
);

-- Enable RLS
ALTER TABLE user_saved_routes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own saved routes" 
ON user_saved_routes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved routes" 
ON user_saved_routes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved routes" 
ON user_saved_routes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved routes" 
ON user_saved_routes FOR DELETE 
USING (auth.uid() = user_id);

-- Also fix RLS for routes if needed (security definer in RPC handles some, but direct select needs policy)
CREATE POLICY "Public routes are visible to everyone" 
ON routes FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own routes" 
ON routes FOR SELECT 
USING (auth.uid() = user_id);

-- Verify the table creation by logging
DO $$
BEGIN
    RAISE NOTICE 'Created user_saved_routes table';
END
$$;
