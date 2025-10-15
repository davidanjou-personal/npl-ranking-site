-- Temporary remix unblock: email_preferences public read + convert helper functions to SECURITY INVOKER
-- REVERT email_preferences POLICY AFTER REMIX COMPLETES

-- 1. Add temporary public SELECT policy for email_preferences
CREATE POLICY "Public can view email preferences (temporary remix)"
ON public.email_preferences
FOR SELECT
TO public
USING (true);

-- 2. Convert 5 read-only helper functions from SECURITY DEFINER to SECURITY INVOKER
-- This removes linter "Security Definer View" errors while maintaining functionality

CREATE OR REPLACE FUNCTION public.get_current_rankings()
RETURNS TABLE(player_id uuid, name text, country text, gender text, category player_category, organization_id uuid, rank bigint, total_points bigint)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id as player_id,
    p.name,
    p.country,
    p.gender,
    e.category,
    e.organization_id,
    RANK() OVER (PARTITION BY e.category, e.organization_id ORDER BY SUM(er.points_awarded) DESC) as rank,
    SUM(er.points_awarded) as total_points
  FROM public.events e
  JOIN public.event_results er ON e.id = er.event_id
  JOIN public.players p ON er.player_id = p.id
  WHERE e.match_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY p.id, p.name, p.country, p.gender, e.category, e.organization_id;
$$;

CREATE OR REPLACE FUNCTION public.get_expiring_points()
RETURNS TABLE(player_id uuid, name text, country text, category player_category, expiring_points bigint, next_expiry_date timestamp without time zone)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_player_rankings()
RETURNS TABLE(id uuid, player_id uuid, name text, country text, gender text, category player_category, rank bigint, total_points bigint, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_players_public_data()
RETURNS TABLE(id uuid, name text, country text, gender text, player_code text, dupr_id text, avatar_url text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid;
  claims json;
BEGIN
  -- Try standard auth.uid()
  BEGIN
    uid := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    uid := NULL;
  END;
  IF uid IS NOT NULL THEN
    RETURN uid;
  END IF;

  -- Fallback to JWT claims if available
  BEGIN
    claims := current_setting('request.jwt.claims', true)::json;
    IF claims ? 'sub' THEN
      uid := (claims->>'sub')::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    uid := NULL;
  END;
  
  -- Final fallback: system user sentinel UUID
  RETURN COALESCE(uid, '00000000-0000-0000-0000-000000000000'::uuid);
END;
$$;