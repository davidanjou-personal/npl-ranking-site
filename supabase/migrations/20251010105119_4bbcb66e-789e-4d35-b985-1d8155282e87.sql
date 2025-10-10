
-- Create a public view that excludes sensitive PII (email, date_of_birth)
CREATE OR REPLACE VIEW public.players_public AS
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

-- Grant SELECT on the public view to everyone
GRANT SELECT ON public.players_public TO anon, authenticated;

-- Update the players table RLS policy to restrict SELECT to admins only
-- This protects email and date_of_birth from public access
DROP POLICY IF EXISTS "Players are viewable by everyone" ON public.players;

CREATE POLICY "Only admins can view full player details"
ON public.players
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Current rankings view already doesn't expose email, but let's ensure it uses safe fields
-- No changes needed to current_rankings as it already selects specific safe columns

COMMENT ON VIEW public.players_public IS 'Public view of players excluding sensitive PII like email and date_of_birth';
