-- Fix active_player_rankings view with correct column types
CREATE OR REPLACE VIEW public.active_player_rankings AS
WITH active AS (
  SELECT
    mr.player_id,
    m.category,
    SUM(mr.points_awarded)::bigint AS total_points
  FROM public.match_results mr
  JOIN public.matches m ON m.id = mr.match_id
  WHERE m.match_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY mr.player_id, m.category
),
ranked AS (
  SELECT
    player_id,
    category,
    total_points,
    (RANK() OVER (PARTITION BY category ORDER BY total_points DESC))::integer AS rank
  FROM active
)
SELECT
  gen_random_uuid() AS id,
  player_id,
  category,
  total_points,
  rank,
  now() AS created_at,
  now() AS updated_at
FROM ranked;