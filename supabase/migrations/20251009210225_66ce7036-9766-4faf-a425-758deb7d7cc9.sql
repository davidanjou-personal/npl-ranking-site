-- Create a view for current (12-month rolling) rankings
CREATE OR REPLACE VIEW public.current_rankings AS
WITH recent_results AS (
  SELECT 
    mr.player_id,
    mr.points_awarded,
    m.category,
    p.name,
    p.country
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
    SUM(points_awarded) as total_points
  FROM recent_results
  GROUP BY player_id, category, name, country
)
SELECT 
  player_id,
  category,
  name,
  country,
  total_points,
  RANK() OVER (PARTITION BY category ORDER BY total_points DESC) as rank
FROM aggregated
ORDER BY category, rank;

-- Create index on match_date for faster filtering
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON public.matches(match_date);

-- Create composite index for better join performance
CREATE INDEX IF NOT EXISTS idx_match_results_match_player ON public.match_results(match_id, player_id);

-- Grant select permissions on the view
GRANT SELECT ON public.current_rankings TO anon, authenticated;