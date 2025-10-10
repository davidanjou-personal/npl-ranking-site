-- Drop the existing players_public view
DROP VIEW IF EXISTS public.players_public CASCADE;

-- Create a security definer function to safely expose public player data
-- This is preferred over a SECURITY DEFINER view as it's more explicit and auditable
CREATE OR REPLACE FUNCTION public.get_players_public()
RETURNS TABLE (
  id uuid,
  name text,
  country text,
  gender text,
  player_code text,
  dupr_id text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    country,
    gender,
    player_code,
    dupr_id,
    avatar_url,
    created_at,
    updated_at
  FROM public.players;
$$;

-- Recreate players_public as a SECURITY INVOKER view that calls the function
-- This way the view itself doesn't have elevated privileges
CREATE VIEW public.players_public 
WITH (security_invoker=on)
AS
SELECT * FROM public.get_players_public();

-- Grant execute permission on the function to public
GRANT EXECUTE ON FUNCTION public.get_players_public() TO anon, authenticated;

-- Recreate dependent views that were dropped with CASCADE
DROP VIEW IF EXISTS public.current_rankings;
CREATE VIEW public.current_rankings
WITH (security_invoker=on)
AS
WITH recent_results AS (
  SELECT 
    mr.player_id,
    mr.points_awarded,
    m.category,
    p.name,
    p.country,
    p.gender
  FROM match_results mr
  JOIN matches m ON m.id = mr.match_id
  LEFT JOIN players_public p ON p.id = mr.player_id
  WHERE m.match_date >= CURRENT_DATE - INTERVAL '12 months'
),
aggregated AS (
  SELECT 
    player_id,
    category,
    name,
    country,
    gender,
    SUM(points_awarded) AS total_points
  FROM recent_results
  GROUP BY player_id, category, name, country, gender
)
SELECT 
  player_id,
  category,
  name,
  country,
  gender,
  total_points,
  RANK() OVER (PARTITION BY category ORDER BY total_points DESC) AS rank
FROM aggregated
ORDER BY category, rank;

DROP VIEW IF EXISTS public.expiring_points;
CREATE VIEW public.expiring_points
WITH (security_invoker=on)
AS
SELECT 
  mr.player_id,
  m.category,
  p.name,
  p.country,
  SUM(mr.points_awarded) AS expiring_points,
  MIN(m.match_date + INTERVAL '12 months') AS next_expiry_date
FROM match_results mr
JOIN matches m ON m.id = mr.match_id
LEFT JOIN players_public p ON p.id = mr.player_id
WHERE m.match_date < CURRENT_DATE - INTERVAL '11 months'
  AND m.match_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY mr.player_id, m.category, p.name, p.country
ORDER BY m.category, expiring_points DESC;