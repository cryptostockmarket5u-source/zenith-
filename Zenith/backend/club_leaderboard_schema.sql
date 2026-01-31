-- =====================================================================
-- ZENITH CLUBS SCHEMA ENHANCEMENT
-- This file extends the clubs table and adds RPC functions for
-- real-time club leaderboards based on aggregated member territories.
-- =====================================================================

-- 1. EXTEND CLUBS TABLE
-- Add columns for country, flag, image, and cached territory score
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS country_name VARCHAR(100);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS country_flag VARCHAR(10);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS total_territory_sqm FLOAT DEFAULT 0;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- 2. CREATE CLUB LEADERBOARD RPC
-- Returns clubs ranked by their total captured territory
CREATE OR REPLACE FUNCTION get_club_leaderboard(p_country_name TEXT DEFAULT NULL)
RETURNS TABLE (
  club_id UUID,
  club_name TEXT,
  country_name TEXT,
  country_flag TEXT,
  image_url TEXT,
  total_territory_sqm FLOAT,
  member_count BIGINT,
  rank BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH club_territories AS (
    -- Aggregate ALL member territories for each club
    SELECT 
      c.id as cid,
      c.name,
      c.country_name as cname,
      c.country_flag as cflag,
      c.image_url as cimg,
      COALESCE(SUM(ST_Area(t.geog)), 0) as total_area,
      COUNT(DISTINCT cm.user_id) as members
    FROM clubs c
    LEFT JOIN club_members cm ON c.id = cm.club_id
    LEFT JOIN territories t ON cm.user_id = t.user_id
    GROUP BY c.id, c.name, c.country_name, c.country_flag, c.image_url
  )
  SELECT 
    ct.cid,
    ct.name::TEXT,
    ct.cname::TEXT,
    ct.cflag::TEXT,
    ct.cimg::TEXT,
    ct.total_area,
    ct.members,
    ROW_NUMBER() OVER (ORDER BY ct.total_area DESC)::BIGINT as rank
  FROM club_territories ct
  WHERE (p_country_name IS NULL OR ct.cname = p_country_name)
  ORDER BY ct.total_area DESC;
END;
$$;

-- 3. CREATE CLUB FUNCTION
-- Creates a new club and sets the creator as owner
CREATE OR REPLACE FUNCTION create_club(
  p_user_id UUID,
  p_club_name TEXT,
  p_country_name TEXT,
  p_country_flag TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_color VARCHAR(7) DEFAULT '#CCFF00'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  new_club_id UUID;
BEGIN
  -- Insert the new club
  INSERT INTO clubs (name, owner_id, country_name, country_flag, image_url, color)
  VALUES (p_club_name, p_user_id, p_country_name, p_country_flag, p_image_url, p_color)
  RETURNING id INTO new_club_id;

  -- Add creator as owner member
  INSERT INTO club_members (club_id, user_id, role)
  VALUES (new_club_id, p_user_id, 'owner');

  RETURN jsonb_build_object(
    'success', true,
    'club_id', new_club_id,
    'message', 'Club created successfully'
  );
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'A club with this name already exists'
  );
END;
$$;

-- 4. UPDATE USER STATS TRIGGER
-- Updates user_stats whenever a run is recorded
CREATE OR REPLACE FUNCTION update_user_run_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_distance, total_runs, last_active)
  VALUES (NEW.user_id, NEW.distance, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_distance = user_stats.total_distance + EXCLUDED.total_distance,
    total_runs = user_stats.total_runs + 1,
    last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_run_stats ON runs;
CREATE TRIGGER trg_update_run_stats
AFTER INSERT ON runs
FOR EACH ROW EXECUTE FUNCTION update_user_run_stats();

-- 5. UPDATE CLUB TERRITORY CACHE (Optional Materialized View Refresh)
-- This can be called periodically to update cached scores
CREATE OR REPLACE FUNCTION refresh_club_scores()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE clubs c SET
    total_territory_sqm = COALESCE(sub.total_area, 0),
    member_count = COALESCE(sub.members, 0)
  FROM (
    SELECT 
      cm.club_id,
      SUM(ST_Area(t.geog)) as total_area,
      COUNT(DISTINCT cm.user_id) as members
    FROM club_members cm
    LEFT JOIN territories t ON cm.user_id = t.user_id
    GROUP BY cm.club_id
  ) sub
  WHERE c.id = sub.club_id;
END;
$$;

-- 6. GET MY CLUB STATS
-- Returns detailed stats for a user's club
CREATE OR REPLACE FUNCTION get_my_club_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  club_record RECORD;
  user_territory_sqm FLOAT;
  club_territory_sqm FLOAT;
  club_rank BIGINT;
BEGIN
  -- Find user's club
  SELECT c.* INTO club_record
  FROM clubs c
  JOIN club_members cm ON c.id = cm.club_id
  WHERE cm.user_id = p_user_id
  LIMIT 1;

  IF club_record IS NULL THEN
    RETURN jsonb_build_object('in_club', false);
  END IF;

  -- Get user's personal territory
  SELECT COALESCE(ST_Area(geog), 0) INTO user_territory_sqm
  FROM territories
  WHERE user_id = p_user_id;

  -- Get club's total territory
  SELECT COALESCE(SUM(ST_Area(t.geog)), 0) INTO club_territory_sqm
  FROM club_members cm
  JOIN territories t ON cm.user_id = t.user_id
  WHERE cm.club_id = club_record.id;

  -- Get club's rank
  SELECT rank INTO club_rank
  FROM get_club_leaderboard()
  WHERE club_id = club_record.id;

  RETURN jsonb_build_object(
    'in_club', true,
    'club_id', club_record.id,
    'club_name', club_record.name,
    'country_name', club_record.country_name,
    'country_flag', club_record.country_flag,
    'image_url', club_record.image_url,
    'my_contribution_sqm', user_territory_sqm,
    'club_total_sqm', club_territory_sqm,
    'worldwide_rank', club_rank
  );
END;
$$;

-- 7. GET CLUB MEMBERS MAP (Real-time individual territories)
CREATE OR REPLACE FUNCTION get_club_members_map(p_club_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'type', 'FeatureCollection',
      'features', COALESCE(json_agg(
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(t.geog)::json,
          'properties', json_build_object(
            'user_id', t.user_id,
            'username', u.username,
            'color', c.color
          )
        )
      ), '[]'::json)
    )
    FROM club_members cm
    JOIN territories t ON cm.user_id = t.user_id
    JOIN users u ON cm.user_id = u.id
    JOIN clubs c ON cm.club_id = c.id
    WHERE cm.club_id = p_club_id
  );
END;
$$;

-- 8. GET CLUB RECENT RUNS (Territories Tab)
CREATE OR REPLACE FUNCTION get_club_recent_runs(p_club_id UUID)
RETURNS TABLE (
  run_id UUID,
  username TEXT,
  avatar_url TEXT,
  location TEXT,
  distance_m FLOAT,
  duration_s INTEGER,
  area_sqm FLOAT,
  polyline JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    u.username::TEXT,
    u.avatar_url::TEXT,
    'India'::TEXT as location, 
    r.distance as distance_m,
    r.duration as duration_s,
    r.area_sqm,
    r.polyline,
    r.created_at
  FROM runs r
  JOIN users u ON r.user_id = u.id
  JOIN club_members cm ON u.id = cm.user_id
  WHERE cm.club_id = p_club_id
  ORDER BY r.created_at DESC
  LIMIT 20;
END;
$$;

-- 9. SEED SAMPLE CLUBS (For Demo)
INSERT INTO clubs (name, country_name, country_flag, image_url, color) VALUES
  ('Indian Runners', 'India', '🇮🇳', 'https://images.unsplash.com/photo-1552674605-46d536d2f6d6?q=80&w=200', '#FF9933'),
  ('Team Germany', 'Germany', '🇩🇪', 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=200', '#FFCC00'),
  ('Team France', 'France', '🇫🇷', 'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?q=80&w=200', '#0055A4'),
  ('The Jogfathers', 'India', '🇮🇳', 'https://images.unsplash.com/photo-1510931073020-4834e0916024?q=80&w=200', '#138808'),
  ('Coimbatore Runners', 'India', '🇮🇳', 'https://images.unsplash.com/photo-1514336021200-e26715f38aed?q=80&w=200', '#FF5722')
ON CONFLICT (name) DO NOTHING;
