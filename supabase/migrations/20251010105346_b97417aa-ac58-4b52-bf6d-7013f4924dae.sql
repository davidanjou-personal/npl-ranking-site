
-- Update views to use players_public and enable security_invoker for better security

-- Update current_rankings view to use players_public and security_invoker
CREATE OR REPLACE VIEW public.current_rankings
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
  WHERE m.match_date >= CURRENT_DATE - INTERVAL '1 year'
), aggregated AS (
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
ORDER BY category, RANK() OVER (PARTITION BY category ORDER BY total_points DESC);

-- Update expiring_points view to use players_public and security_invoker
-- Keep timestamp type to match existing column
CREATE OR REPLACE VIEW public.expiring_points
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
ORDER BY m.category, SUM(mr.points_awarded) DESC;

-- Update active_player_rankings view to use security_invoker
CREATE OR REPLACE VIEW public.active_player_rankings
WITH (security_invoker=on)
AS
WITH active AS (
  SELECT 
    mr.player_id,
    m.category,
    SUM(mr.points_awarded) AS total_points
  FROM match_results mr
  JOIN matches m ON m.id = mr.match_id
  WHERE m.match_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY mr.player_id, m.category
), ranked AS (
  SELECT 
    player_id,
    category,
    total_points,
    RANK() OVER (PARTITION BY category ORDER BY total_points DESC)::INTEGER AS rank
  FROM active
)
SELECT 
  gen_random_uuid() AS id,
  player_id,
  category,
  total_points,
  rank,
  NOW() AS created_at,
  NOW() AS updated_at
FROM ranked;

COMMENT ON VIEW public.current_rankings IS 'Current rankings based on last 12 months, uses security_invoker to respect RLS';
COMMENT ON VIEW public.expiring_points IS 'Points expiring soon, uses security_invoker to respect RLS';
COMMENT ON VIEW public.active_player_rankings IS 'Active player rankings with security_invoker enabled';
