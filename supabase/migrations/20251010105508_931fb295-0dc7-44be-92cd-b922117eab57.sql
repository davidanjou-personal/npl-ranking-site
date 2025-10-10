
-- REVERT: Remove the public SELECT policy - this exposes emails again!
DROP POLICY IF EXISTS "Public can view non-sensitive player info" ON public.players;

-- Make players_public view use SECURITY DEFINER (default)
-- This is the CORRECT approach for a view that needs to expose safe data from a restricted table
CREATE OR REPLACE VIEW public.players_public
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

ALTER VIEW public.players_public OWNER TO postgres;
GRANT SELECT ON public.players_public TO anon, authenticated;

COMMENT ON VIEW public.players_public IS 'SECURITY DEFINER view that exposes only non-PII player data while underlying players table restricts SELECT to admins (protecting email and date_of_birth)';
