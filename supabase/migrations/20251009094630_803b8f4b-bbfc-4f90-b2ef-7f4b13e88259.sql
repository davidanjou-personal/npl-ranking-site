
-- Fix duplicate imports: Remove duplicate matches and recalculate rankings

-- Step 1: Delete match_results for duplicate matches (keep the earliest match per tournament/date/category)
DELETE FROM public.match_results
WHERE match_id IN (
  SELECT m2.id
  FROM public.matches m1
  JOIN public.matches m2 ON 
    m1.tournament_name = m2.tournament_name AND
    m1.match_date = m2.match_date AND
    m1.category = m2.category AND
    m1.tier = m2.tier AND
    m1.created_at < m2.created_at
);

-- Step 2: Delete the duplicate matches themselves
DELETE FROM public.matches
WHERE id IN (
  SELECT m2.id
  FROM public.matches m1
  JOIN public.matches m2 ON 
    m1.tournament_name = m2.tournament_name AND
    m1.match_date = m2.match_date AND
    m1.category = m2.category AND
    m1.tier = m2.tier AND
    m1.created_at < m2.created_at
);

-- Step 3: Recalculate player_rankings from scratch
TRUNCATE TABLE public.player_rankings CASCADE;

INSERT INTO public.player_rankings (player_id, category, total_points, updated_at)
SELECT 
  mr.player_id,
  m.category,
  SUM(mr.points_awarded) as total_points,
  NOW() as updated_at
FROM public.match_results mr
JOIN public.matches m ON m.id = mr.match_id
GROUP BY mr.player_id, m.category;

-- Step 4: Update ranks
WITH ranked_players AS (
  SELECT
    id,
    category,
    RANK() OVER (PARTITION BY category ORDER BY total_points DESC) as new_rank
  FROM public.player_rankings
)
UPDATE public.player_rankings pr
SET rank = rp.new_rank,
    updated_at = NOW()
FROM ranked_players rp
WHERE pr.id = rp.id;
