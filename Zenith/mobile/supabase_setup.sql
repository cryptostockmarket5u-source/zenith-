-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Territories Table
CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  geom GEOGRAPHY(MULTIPOLYGON, 4326),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Public territories are viewable by everyone" ON territories;
DROP POLICY IF EXISTS "Users can insert their own territory" ON territories;
DROP POLICY IF EXISTS "Users can update their own territory" ON territories;

-- Policy: Everyone can read territories
CREATE POLICY "Public territories are viewable by everyone" 
ON territories FOR SELECT 
USING (true);

-- Policy: Users update their own territory
CREATE POLICY "Users can insert their own territory" 
ON territories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own territory" 
ON territories FOR UPDATE 
USING (auth.uid() = user_id);


-- Function: Capture Territory (The Paper.io Logic)
-- Refined to handle MultiPolygon conversion and stealing more cleanly.
CREATE OR REPLACE FUNCTION capture_territory(new_poly_geojson TEXT)
RETURNS void AS $$
DECLARE
  new_poly GEOMETRY;
BEGIN
  -- Convert input GeoJSON (Polygon) to Geometry
  new_poly := ST_SetSRID(ST_GeomFromGeoJSON(new_poly_geojson), 4326);
  
  -- 1. Steal from others (Stealing Logic)
  UPDATE territories 
  SET geom = ST_Multi(ST_Difference(geom::geometry, new_poly))::geography
  WHERE user_id != auth.uid() 
  AND ST_Intersects(geom::geometry, new_poly);
  
  -- 2. Add to self (Merge/Union Logic)
  INSERT INTO territories (user_id, geom)
  VALUES (auth.uid(), ST_Multi(new_poly)::geography)
  ON CONFLICT (user_id) 
  DO UPDATE SET geom = ST_Multi(ST_Union(territories.geom::geometry, ST_SetSRID(ST_GeomFromGeoJSON(new_poly_geojson), 4326)))::geography;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Specific User Territory
CREATE OR REPLACE FUNCTION get_user_territory(uid UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(json_agg(
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object('user_id', user_id)
        )
      ), '[]'::json)
    )
    FROM territories
    WHERE user_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  username TEXT,
  total_area_sqm FLOAT,
  is_current_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(au.email::TEXT, 'Unknown Runner') as username,
    ST_Area(t.geom) as total_area_sqm,
    (au.id = auth.uid()) as is_current_user
  FROM territories t
  JOIN auth.users au ON t.user_id = au.id
  ORDER BY total_area_sqm DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: World Map (GeoJSON)
CREATE OR REPLACE FUNCTION get_world_map()
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(json_agg(
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object('user_id', user_id)
        )
      ), '[]'::json)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
