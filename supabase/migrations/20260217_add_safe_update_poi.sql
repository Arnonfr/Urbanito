-- Add safe_update_poi RPC to allow anonymous contributions to shared POI data
CREATE OR REPLACE FUNCTION public.safe_update_poi(
    p_name TEXT,
    p_lat FLOAT,
    p_lng FLOAT,
    p_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_poi_id UUID;
BEGIN
    -- Search for existing POI by name and coordinates (with small tolerance)
    SELECT id INTO v_poi_id
    FROM pois
    WHERE name = p_name
      AND ABS(lat - p_lat) < 0.0001
      AND ABS(lng - p_lng) < 0.0001
    LIMIT 1;

    IF v_poi_id IS NOT NULL THEN
        -- Update existing POI data (merge if necessary, but here we just overwrite/update)
        UPDATE pois 
        SET data = p_data -- In a real app we might want to merge JSONB
        WHERE id = v_poi_id;
    ELSE
        -- Insert new POI
        INSERT INTO pois (name, lat, lng, data)
        VALUES (p_name, p_lat, p_lng, p_data)
        RETURNING id INTO v_poi_id;
    END IF;

    RETURN v_poi_id;
END;
$$;
