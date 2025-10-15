-- Phase 1: Multi-Organization Database Architecture

-- Create organization enum for type safety
CREATE TYPE public.organization_type AS ENUM ('national', 'international', 'regional');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  organization_type organization_type NOT NULL DEFAULT 'national',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  country TEXT,
  description TEXT,
  website_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Public can view organizations
CREATE POLICY "Organizations are viewable by everyone"
ON public.organizations
FOR SELECT
USING (true);

-- Admins can manage organizations
CREATE POLICY "Admins can insert organizations"
ON public.organizations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update organizations"
ON public.organizations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete organizations"
ON public.organizations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add organization_id to events table
ALTER TABLE public.events
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id to upcoming_tournaments table
ALTER TABLE public.upcoming_tournaments
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create player_organization_memberships table
CREATE TABLE public.player_organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id, organization_id)
);

-- Enable RLS on player_organization_memberships
ALTER TABLE public.player_organization_memberships ENABLE ROW LEVEL SECURITY;

-- Public can view memberships
CREATE POLICY "Memberships are viewable by everyone"
ON public.player_organization_memberships
FOR SELECT
USING (true);

-- Admins can manage memberships
CREATE POLICY "Admins can insert memberships"
ON public.player_organization_memberships
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update memberships"
ON public.player_organization_memberships
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete memberships"
ON public.player_organization_memberships
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert NPL Australia as the first organization
INSERT INTO public.organizations (name, slug, organization_type, country, description, primary_color, settings)
VALUES (
  'NPL Australia',
  'npl',
  'national',
  'Australia',
  'National Pickleball League - Australia''s premier pickleball ranking system',
  '#3B82F6',
  '{"point_system": {"tier1": 1000, "tier2": 500, "tier3": 250, "tier4": 100}}'::jsonb
);

-- Insert Global Pickleball Alliance as second organization
INSERT INTO public.organizations (name, slug, organization_type, country, description, primary_color, settings)
VALUES (
  'Global Pickleball Alliance',
  'gpa',
  'international',
  NULL,
  'Uniting pickleball federations worldwide with standardized international rankings',
  '#10B981',
  '{"point_system": {"tier1": 1000, "tier2": 500, "tier3": 250, "tier4": 100}}'::jsonb
);

-- Migrate existing events to NPL
UPDATE public.events
SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'npl')
WHERE organization_id IS NULL;

-- Migrate existing upcoming tournaments to NPL
UPDATE public.upcoming_tournaments
SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'npl')
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after migration
ALTER TABLE public.events
ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.upcoming_tournaments
ALTER COLUMN organization_id SET NOT NULL;

-- Create memberships for all existing players to NPL
INSERT INTO public.player_organization_memberships (player_id, organization_id, membership_status)
SELECT 
  p.id,
  (SELECT id FROM public.organizations WHERE slug = 'npl'),
  'active'
FROM public.players p;

-- Update triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_organization_memberships_updated_at
BEFORE UPDATE ON public.player_organization_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate current_rankings view to include organization filtering
DROP VIEW IF EXISTS public.current_rankings;

CREATE VIEW public.current_rankings AS
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

-- Recreate expiring_points view to include organization filtering
DROP VIEW IF EXISTS public.expiring_points;

CREATE VIEW public.expiring_points AS
SELECT 
  p.id as player_id,
  p.name,
  p.country,
  e.category,
  e.organization_id,
  SUM(er.points_awarded) as expiring_points,
  MIN(e.match_date + INTERVAL '12 months')::timestamp as next_expiry_date
FROM public.events e
JOIN public.event_results er ON e.id = er.event_id
JOIN public.players p ON er.player_id = p.id
WHERE e.match_date < CURRENT_DATE - INTERVAL '11 months'
  AND e.match_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY p.id, p.name, p.country, e.category, e.organization_id
HAVING SUM(er.points_awarded) > 0;

-- Update get_current_rankings function to include organization
DROP FUNCTION IF EXISTS public.get_current_rankings();

CREATE OR REPLACE FUNCTION public.get_current_rankings()
RETURNS TABLE(
  player_id uuid,
  name text,
  country text,
  gender text,
  category player_category,
  organization_id uuid,
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
    e.organization_id,
    RANK() OVER (PARTITION BY e.category, e.organization_id ORDER BY SUM(er.points_awarded) DESC) as rank,
    SUM(er.points_awarded) as total_points
  FROM public.events e
  JOIN public.event_results er ON e.id = er.event_id
  JOIN public.players p ON er.player_id = p.id
  WHERE e.match_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY p.id, p.name, p.country, p.gender, e.category, e.organization_id;
$$;