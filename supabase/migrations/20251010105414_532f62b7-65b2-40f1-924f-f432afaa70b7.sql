
-- Update players_public view to use security_invoker
-- This is safe because the view only exposes non-PII data
CREATE OR REPLACE VIEW public.players_public
WITH (security_invoker=on)
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

-- Ensure grants are in place for the view
GRANT SELECT ON public.players_public TO anon, authenticated;

-- Add RLS policy to players_public view to allow public access
-- Note: Views with security_invoker respect the RLS of underlying tables,
-- but we need to ensure the view itself is accessible
ALTER VIEW public.players_public OWNER TO postgres;

COMMENT ON VIEW public.players_public IS 'Public view of players excluding sensitive PII (email, date_of_birth). Uses security_invoker to respect RLS while exposing safe player data.';
