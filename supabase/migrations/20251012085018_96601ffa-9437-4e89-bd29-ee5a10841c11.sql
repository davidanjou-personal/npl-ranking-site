-- Phase 1.1: Fix SECURITY DEFINER Views by Removing SECURITY DEFINER and Adding Proper RLS

-- First, add RLS policies to allow public read access to necessary data
-- Note: Players table already has RLS enabled with specific policies

-- Allow public read access to events table (tournament data is public)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
CREATE POLICY "Allow public read access to events"
ON public.events FOR SELECT
TO public
USING (true);

-- Allow public read access to event_results (match results are public)
ALTER TABLE public.event_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to event_results" ON public.event_results;
CREATE POLICY "Allow public read access to event_results"
ON public.event_results FOR SELECT
TO public
USING (true);

-- Now recreate the functions without SECURITY DEFINER
-- These will now respect RLS policies

CREATE OR REPLACE FUNCTION public.get_current_rankings()
RETURNS TABLE(player_id uuid, name text, country text, gender text, category player_category, rank bigint, total_points bigint)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id as player_id,
    p.name,
    p.country,
    p.gender,
    e.category,
    RANK() OVER (PARTITION BY e.category ORDER BY SUM(er.points_awarded) DESC) as rank,
    SUM(er.points_awarded) as total_points
  FROM public.events e
  JOIN public.event_results er ON e.id = er.event_id
  JOIN public.players p ON er.player_id = p.id
  WHERE e.match_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY p.id, p.name, p.country, p.gender, e.category;
$function$;

CREATE OR REPLACE FUNCTION public.get_expiring_points()
RETURNS TABLE(player_id uuid, name text, country text, category player_category, expiring_points bigint, next_expiry_date timestamp without time zone)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id as player_id,
    p.name,
    p.country,
    e.category,
    SUM(er.points_awarded) as expiring_points,
    MIN(e.match_date + INTERVAL '12 months')::timestamp as next_expiry_date
  FROM public.events e
  JOIN public.event_results er ON e.id = er.event_id
  JOIN public.players p ON er.player_id = p.id
  WHERE e.match_date < CURRENT_DATE - INTERVAL '11 months'
    AND e.match_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY p.id, p.name, p.country, e.category
  HAVING SUM(er.points_awarded) > 0;
$function$;

CREATE OR REPLACE FUNCTION public.get_player_rankings()
RETURNS TABLE(id uuid, player_id uuid, name text, country text, gender text, category player_category, rank bigint, total_points bigint, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT 
    gen_random_uuid() as id,
    p.id as player_id,
    p.name,
    p.country,
    p.gender,
    e.category,
    RANK() OVER (PARTITION BY e.category ORDER BY SUM(er.points_awarded) DESC) as rank,
    SUM(er.points_awarded) as total_points,
    MIN(e.created_at) as created_at,
    MAX(e.created_at) as updated_at
  FROM public.events e
  JOIN public.event_results er ON e.id = er.event_id
  JOIN public.players p ON er.player_id = p.id
  GROUP BY p.id, p.name, p.country, p.gender, e.category;
$function$;

CREATE OR REPLACE FUNCTION public.get_players_public_data()
RETURNS TABLE(id uuid, name text, country text, gender text, player_code text, dupr_id text, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
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
$function$;

-- Phase 2.2: Drop redundant get_players_public function (keeping get_players_public_data for views)
-- The view players_public uses get_players_public_data which is fine
DROP FUNCTION IF EXISTS public.get_players_public();