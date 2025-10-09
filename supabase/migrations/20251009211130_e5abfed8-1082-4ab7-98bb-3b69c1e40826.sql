-- Drop the existing view and recreate with gender
DROP VIEW IF EXISTS public.current_rankings;

CREATE VIEW public.current_rankings 
WITH (security_invoker = on)
AS
WITH recent_results AS (
  SELECT 
    mr.player_id,
    mr.points_awarded,
    m.category,
    p.name,
    p.country,
    p.gender
  FROM public.match_results mr
  INNER JOIN public.matches m ON m.id = mr.match_id
  LEFT JOIN public.players p ON p.id = mr.player_id
  WHERE m.match_date >= CURRENT_DATE - INTERVAL '12 months'
),
aggregated AS (
  SELECT 
    player_id,
    category,
    name,
    country,
    gender,
    SUM(points_awarded) as total_points
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
  RANK() OVER (PARTITION BY category ORDER BY total_points DESC) as rank
FROM aggregated
ORDER BY category, rank;

-- Grant permissions
GRANT SELECT ON public.current_rankings TO anon, authenticated;