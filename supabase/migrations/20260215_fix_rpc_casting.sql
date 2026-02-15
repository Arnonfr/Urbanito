-- Fix casting issues in save_generated_route RPC
CREATE OR REPLACE FUNCTION save_generated_route(
    p_user_id UUID,
    p_name TEXT,
    p_city TEXT,
    p_description TEXT,
    p_duration_minutes INT,
    p_preferences JSONB,
    p_is_public BOOLEAN,
    p_is_favorite BOOLEAN,
    p_parent_route_id UUID,
    p_pois JSONB,
    p_reconstruction_image_url TEXT DEFAULT NULL,
    p_historical_reconstruction_prompt TEXT DEFAULT NULL,
    p_share_teaser TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_route_id UUID;
    v_poi_id UUID;
    v_poi JSONB;
    v_order INT;
BEGIN
    -- 1. Insert or Return Existing Route (Deduplication for same user/name/city)
    IF p_user_id IS NOT NULL THEN
        SELECT id INTO v_route_id
        FROM routes
        WHERE user_id = p_user_id
          AND name = p_name
          AND city = p_city
        LIMIT 1;
    END IF;

    IF v_route_id IS NULL THEN
        INSERT INTO routes (
            user_id, name, city, description, duration_minutes, 
            preferences, is_public, parent_route_id,
            reconstruction_image_url, historical_reconstruction_prompt, share_teaser
        )
        VALUES (
            p_user_id, p_name, p_city, p_description, p_duration_minutes, 
            p_preferences, p_is_public, p_parent_route_id,
            p_reconstruction_image_url, p_historical_reconstruction_prompt, p_share_teaser
        )
        RETURNING id INTO v_route_id;
    ELSE
        -- Update the existing route with new fields if they are missing
        UPDATE routes SET
            share_teaser = COALESCE(share_teaser, p_share_teaser),
            reconstruction_image_url = COALESCE(reconstruction_image_url, p_reconstruction_image_url),
            historical_reconstruction_prompt = COALESCE(historical_reconstruction_prompt, p_historical_reconstruction_prompt)
        WHERE id = v_route_id;
    END IF;

    -- 2. Link User if not creator (Favorite)
    -- Ensure user_saved_routes exists before this runs (handled by previous migration, but good to be safe)
    IF p_user_id IS NOT NULL AND p_is_favorite THEN
        INSERT INTO user_saved_routes (user_id, route_id, is_favorite)
        VALUES (p_user_id, v_route_id, TRUE)
        ON CONFLICT (user_id, route_id) DO UPDATE SET is_favorite = TRUE;
    END IF;

    -- 3. Process POIs (Clear existing to avoid duplicates on re-save)
    DELETE FROM route_pois WHERE route_id = v_route_id;

    FOR v_poi IN SELECT * FROM jsonb_array_elements(p_pois)
    LOOP
        v_order := (v_poi->>'order_index')::INT;
        
        -- Insert/Get POI (Deduplicate by proper coordinates/name)
        SELECT id INTO v_poi_id
        FROM pois
        WHERE name = (v_poi->>'name')
          AND ABS(lat - (v_poi->>'lat')::FLOAT) < 0.0001
          AND ABS(lng - (v_poi->>'lng')::FLOAT) < 0.0001
        LIMIT 1;

        IF v_poi_id IS NULL THEN
            INSERT INTO pois (name, lat, lng, data)
            VALUES (
                (v_poi->>'name'), 
                (v_poi->>'lat')::FLOAT, 
                (v_poi->>'lng')::FLOAT, 
                (v_poi->'poi_data') -- Use -> to get JSONB directly
            )
            RETURNING id INTO v_poi_id;
        END IF;

        -- Link to Route
        INSERT INTO route_pois (route_id, poi_id, order_index, travel_data)
        VALUES (v_route_id, v_poi_id, v_order, (v_poi->'travel_data')); -- Use -> to get JSONB directly

    END LOOP;

    RETURN v_route_id;
END;
$$;
