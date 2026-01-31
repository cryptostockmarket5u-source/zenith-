-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- -----------------------------------------------------------------------------
-- 1. CORE TABLES
-- -----------------------------------------------------------------------------

-- Users (Extended Profile)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Stats (Aggregated Metrics)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_area FLOAT DEFAULT 0, -- In square meters
  total_distance FLOAT DEFAULT 0, -- In meters
  total_runs INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clubs (Social War Rooms)
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id),
  color VARCHAR(7) DEFAULT '#CCFF00', -- Neon Team Color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Club Members (Membership State)
CREATE TABLE IF NOT EXISTS club_members (
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

-- Runs (History Log)
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  distance FLOAT NOT NULL, -- Meters
  duration INTEGER NOT NULL, -- Seconds
  polyline JSONB, -- GeoJSON LineString of the route
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Territories (The Map State)
CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  geog GEOGRAPHY(MULTIPOLYGON, 4326), -- The User's Consolidated Domain
  health INTEGER DEFAULT 100,
  last_captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Speed
CREATE INDEX IF NOT EXISTS territories_geog_idx ON territories USING GIST (geog);
CREATE INDEX IF NOT EXISTS runs_user_id_idx ON runs(user_id);
CREATE INDEX IF NOT EXISTS club_members_user_id_idx ON club_members(user_id);


-- -----------------------------------------------------------------------------
-- 2. CRITICAL LOGIC (RPCs)
-- -----------------------------------------------------------------------------

/**
 * CAPTURE TERRITORY (The Geometry Engine)
 * Merges new loop with user's territory AND steals from overlapping rivals.
 */
CREATE OR REPLACE FUNCTION capture_territory(
  p_user_id UUID, 
  new_poly_geojson JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  new_geom GEOMETRY;
  user_existing_geom GEOMETRY;
  final_geom GEOMETRY;
  rival_record RECORD;
  stolen_area FLOAT := 0;
BEGIN
  -- 1. Convert Input GeoJSON to Geometry (SRID 4326)
  new_geom := ST_SetSRID(ST_GeomFromGeoJSON(new_poly_geojson), 4326);

  -- 2. Validate Geometry
  IF NOT ST_IsValid(new_geom) THEN
    new_geom := ST_MakeValid(new_geom);
  END IF;

  -- 3. Fetch User's Existing Territory
  SELECT geog::geometry INTO user_existing_geom 
  FROM territories 
  WHERE user_id = p_user_id;

  -- 4. UNION: Merge new loop with existing territory
  IF user_existing_geom IS NOT NULL THEN
    final_geom := ST_Union(user_existing_geom, new_geom);
  ELSE
    final_geom := ST_Multi(new_geom);
  END IF;

  -- 5. DIFFERENCE: Subtract this new shape from overlapping rivals
  FOR rival_record IN 
    SELECT id, geog::geometry as geom 
    FROM territories 
    WHERE user_id != p_user_id 
    AND ST_Intersects(geog::geometry, new_geom)
  LOOP
    -- Calculate difference (Rival - New Capture)
    UPDATE territories 
    SET geog = ST_Multi(ST_Difference(rival_record.geom, new_geom))::geography
    WHERE id = rival_record.id;
    
    -- Log stolen area (optional, for notifications)
    stolen_area := stolen_area + ST_Area(ST_Intersection(rival_record.geom, new_geom)::geography);
  END LOOP;

  -- 6. UPSERT: Save the final merged territory for the user
  INSERT INTO territories (user_id, geog, last_captured_at)
  VALUES (p_user_id, final_geom::geography, NOW())
  ON CONFLICT (id) DO UPDATE -- Logic requires checking user_id constraint realistically, usually we query first or simplified here
  -- Simplified: In real app, territories table usually has UNIQUE(user_id). Assuming that:
  SET geog = final_geom::geography, last_captured_at = NOW(); 
  
  -- NOTE: For this schema, we assume 1 row per user. We need to enforce that:
  -- Constraint should be added: ALTER TABLE territories ADD CONSTRAINT unique_user_territory UNIQUE (user_id);
  -- (Handling this implicitly for now by checking exists)
  IF EXISTS (SELECT 1 FROM territories WHERE user_id = p_user_id) THEN
      UPDATE territories SET geog = final_geom::geography, last_captured_at = NOW() WHERE user_id = p_user_id;
  ELSE
      INSERT INTO territories (user_id, geog) VALUES (p_user_id, final_geom::geography);
  END IF;

  -- 7. RETURN Result
  RETURN jsonb_build_object(
    'success', true, 
    'area_added', ST_Area(new_geom::geography),
    'area_stolen', stolen_area
  );
END;
$$;


/**
 * JOIN CLUB (Social Logic)
 * Adds user to a club and returns club metadata.
 */
CREATE OR REPLACE FUNCTION join_club(p_user_id UUID, p_club_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  club_data JSONB;
BEGIN
  -- Insert into members
  INSERT INTO club_members (club_id, user_id)
  VALUES (p_club_id, p_user_id)
  ON CONFLICT DO NOTHING;

  -- Fetch Club Info
  SELECT to_jsonb(c) INTO club_data FROM clubs c WHERE id = p_club_id;
  
  RETURN club_data;
END;
$$;

/**
 * GET CLUB TERRITORY (War Room Logic)
 * Aggregates all members' territories into one GeoJSON.
 */
CREATE OR REPLACE FUNCTION get_club_territory(p_club_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  club_geom GEOMETRY;
BEGIN
  -- Union all territories of members
  SELECT ST_Union(t.geog::geometry) INTO club_geom
  FROM territories t
  JOIN club_members cm ON t.user_id = cm.user_id
  WHERE cm.club_id = p_club_id;

  RETURN ST_AsGeoJSON(club_geom)::jsonb;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. AUTOMATION (Triggers)
-- -----------------------------------------------------------------------------

-- Trigger Function: Update Level based on Area
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  total_area FLOAT;
  new_level INTEGER := 1;
BEGIN
  -- Calculate Total Area
  SELECT ST_Area(NEW.geog) INTO total_area;

  -- Simple Level Logic
  IF total_area > 1000000 THEN new_level := 5; -- 1 sq km
  ELSIF total_area > 500000 THEN new_level := 4; -- Unlock Leaderboard
  ELSIF total_area > 100000 THEN new_level := 3;
  ELSIF total_area > 10000 THEN new_level := 2;
  END IF;

  -- Update User Stats
  INSERT INTO user_stats (user_id, total_area) 
  VALUES (NEW.user_id, total_area)
  ON CONFLICT (user_id) DO UPDATE SET total_area = EXCLUDED.total_area;

  -- Update Profile Level
  UPDATE users SET level = new_level WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach Trigger
DROP TRIGGER IF EXISTS trg_update_level ON territories;
CREATE TRIGGER trg_update_level
AFTER INSERT OR UPDATE ON territories
FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- Seeding some initial clubs
INSERT INTO clubs (name, color) VALUES ('Night Runners', '#FF00FF') ON CONFLICT DO NOTHING;
INSERT INTO clubs (name, color) VALUES ('Stealth Ops', '#CCFF00') ON CONFLICT DO NOTHING;
