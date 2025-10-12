-- Create SECURITY DEFINER functions to provide public access to ranking data
-- This bypasses RLS while keeping the underlying players table secured

-- Function to get current rankings (last 12 months)
CREATE OR REPLACE FUNCTION public.get_current_rankings()
RETURNS TABLE (
  player_id uuid,
  name text,
  country text,
  gender text,
  category player_category,
  rank bigint,
  total_points bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Function to get all-time player rankings
CREATE OR REPLACE FUNCTION public.get_player_rankings()
RETURNS TABLE (
  id uuid,
  player_id uuid,
  name text,
  country text,
  gender text,
  category player_category,
  rank bigint,
  total_points bigint,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Drop existing views and recreate them using the security definer functions
DROP VIEW IF EXISTS public.current_rankings CASCADE;

CREATE VIEW public.current_rankings AS
SELECT * FROM public.get_current_rankings();

DROP VIEW IF EXISTS public.player_rankings CASCADE;

CREATE VIEW public.player_rankings AS
SELECT * FROM public.get_player_rankings();

-- Recreate players_public view using a security definer function
CREATE OR REPLACE FUNCTION public.get_players_public_data()
RETURNS TABLE (
  id uuid,
  name text,
  country text,
  gender text,
  player_code text,
  dupr_id text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP VIEW IF EXISTS public.players_public CASCADE;

CREATE VIEW public.players_public AS
SELECT * FROM public.get_players_public_data();

-- Recreate expiring_points view with security definer function
CREATE OR REPLACE FUNCTION public.get_expiring_points()
RETURNS TABLE (
  player_id uuid,
  name text,
  country text,
  category player_category,
  expiring_points bigint,
  next_expiry_date timestamp
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP VIEW IF EXISTS public.expiring_points CASCADE;

CREATE VIEW public.expiring_points AS
SELECT * FROM public.get_expiring_points();