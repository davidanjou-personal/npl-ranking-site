-- Fix SECURITY DEFINER views by recreating them with SECURITY INVOKER

-- Drop existing views
DROP VIEW IF EXISTS public.current_rankings CASCADE;
DROP VIEW IF EXISTS public.player_rankings CASCADE;
DROP VIEW IF EXISTS public.expiring_points CASCADE;
DROP VIEW IF EXISTS public.matches CASCADE;
DROP VIEW IF EXISTS public.match_results CASCADE;
DROP VIEW IF EXISTS public.players_public CASCADE;

-- Recreate current_rankings view with SECURITY INVOKER
CREATE VIEW public.current_rankings
WITH (security_invoker = on)
AS
SELECT 
  pr.player_id,
  pr.category,
  p.name,
  p.country,
  p.gender,
  pr.rank,
  pr.total_points
FROM (
  SELECT 
    er.player_id,
    e.category,
    RANK() OVER (PARTITION BY e.category ORDER BY SUM(er.points_awarded) DESC) as rank,
    SUM(er.points_awarded) as total_points
  FROM public.event_results er
  JOIN public.events e ON e.id = er.event_id
  WHERE e.match_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY er.player_id, e.category
) pr
JOIN public.players p ON p.id = pr.player_id
ORDER BY pr.category, pr.rank;

-- Recreate player_rankings view with SECURITY INVOKER
CREATE VIEW public.player_rankings
WITH (security_invoker = on)
AS
SELECT 
  gen_random_uuid() as id,
  er.player_id,
  e.category,
  p.name,
  p.country,
  p.gender,
  RANK() OVER (PARTITION BY e.category ORDER BY SUM(er.points_awarded) DESC) as rank,
  SUM(er.points_awarded) as total_points,
  now() as created_at,
  now() as updated_at
FROM public.event_results er
JOIN public.events e ON e.id = er.event_id
JOIN public.players p ON p.id = er.player_id
GROUP BY er.player_id, e.category, p.name, p.country, p.gender;

-- Recreate expiring_points view with SECURITY INVOKER
CREATE VIEW public.expiring_points
WITH (security_invoker = on)
AS
SELECT 
  er.player_id,
  e.category,
  p.name,
  p.country,
  SUM(er.points_awarded) as expiring_points,
  MIN(e.match_date + INTERVAL '12 months') as next_expiry_date
FROM public.event_results er
JOIN public.events e ON e.id = er.event_id
JOIN public.players p ON p.id = er.player_id
WHERE e.match_date < CURRENT_DATE - INTERVAL '11 months'
  AND e.match_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY er.player_id, e.category, p.name, p.country
HAVING SUM(er.points_awarded) > 0
ORDER BY next_expiry_date;

-- Recreate backward compatibility view: matches with SECURITY INVOKER
CREATE VIEW public.matches
WITH (security_invoker = on)
AS
SELECT 
  id,
  tournament_name,
  match_date,
  tier,
  category,
  created_at,
  created_by,
  import_id
FROM public.events;

-- Recreate backward compatibility view: match_results with SECURITY INVOKER
CREATE VIEW public.match_results
WITH (security_invoker = on)
AS
SELECT 
  id,
  event_id as match_id,
  player_id,
  finishing_position,
  points_awarded,
  created_at
FROM public.event_results;

-- Recreate players_public view with SECURITY INVOKER
CREATE VIEW public.players_public
WITH (security_invoker = on)
AS
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