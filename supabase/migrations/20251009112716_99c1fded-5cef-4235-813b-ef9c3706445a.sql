BEGIN;
-- Remove stale rows in player_rankings not backed by match_results
DELETE FROM public.player_rankings pr
WHERE NOT EXISTS (
  SELECT 1
  FROM public.match_results mr
  JOIN public.matches m ON m.id = mr.match_id
  WHERE mr.player_id = pr.player_id
    AND m.category = pr.category
);

-- Upsert exact totals from match_results
INSERT INTO public.player_rankings (player_id, category, total_points, updated_at)
SELECT
  mr.player_id,
  m.category,
  SUM(mr.points_awarded)::integer AS total_points,
  now()
FROM public.match_results mr
JOIN public.matches m ON m.id = mr.match_id
GROUP BY mr.player_id, m.category
ON CONFLICT (player_id, category)
DO UPDATE SET
  total_points = EXCLUDED.total_points,
  updated_at = now();

-- Recompute ranks
SELECT public.update_player_rankings();
COMMIT;