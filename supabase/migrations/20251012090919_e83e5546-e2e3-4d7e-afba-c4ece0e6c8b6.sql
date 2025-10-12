-- Fix public data access issue
-- The problem: functions need SECURITY DEFINER to access players table which has admin-only RLS
-- Solution: Add SECURITY DEFINER back to public-facing functions, but keep them read-only

-- These functions expose only safe, public player data
-- They need SECURITY DEFINER to bypass the admin-only RLS on players table

CREATE OR REPLACE FUNCTION public.get_current_rankings()
RETURNS TABLE(player_id uuid, name text, country text, gender text, category player_category, rank bigint, total_points bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
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
SECURITY DEFINER
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
SECURITY DEFINER
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
SECURITY DEFINER
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

-- Recreate views to ensure they use the updated functions
CREATE OR REPLACE VIEW public.current_rankings AS
SELECT * FROM public.get_current_rankings();

CREATE OR REPLACE VIEW public.player_rankings AS
SELECT * FROM public.get_player_rankings();

CREATE OR REPLACE VIEW public.expiring_points AS
SELECT * FROM public.get_expiring_points();

CREATE OR REPLACE VIEW public.players_public AS
SELECT * FROM public.get_players_public_data();

-- IMPORTANT: These functions use SECURITY DEFINER to access players table
-- BUT they only expose safe, public columns (name, country, etc.)
-- Sensitive fields (email, date_of_birth) are NOT included
-- This is safe because the functions are read-only SQL functions