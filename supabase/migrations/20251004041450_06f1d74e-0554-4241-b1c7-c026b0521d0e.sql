-- Fix security issue: Enable SECURITY INVOKER for active_player_rankings view
DROP VIEW IF EXISTS public.active_player_rankings;

CREATE VIEW public.active_player_rankings 
WITH (security_invoker=on) AS
SELECT 
  pr.id,
  pr.player_id,
  pr.category,
  COALESCE(SUM(mr.points_awarded), 0) as total_points,
  pr.rank,
  pr.created_at,
  pr.updated_at
FROM public.player_rankings pr
LEFT JOIN public.match_results mr ON mr.player_id = pr.player_id
LEFT JOIN public.matches m ON m.id = mr.match_id AND m.category = pr.category
WHERE m.match_date >= CURRENT_DATE - INTERVAL '12 months' OR m.match_date IS NULL
GROUP BY pr.id, pr.player_id, pr.category, pr.rank, pr.created_at, pr.updated_at;