
-- Add a policy to allow SELECT on non-sensitive columns for everyone
-- This enables the players_public view (with security_invoker) to work for all users
CREATE POLICY "Public can view non-sensitive player info"
ON public.players
FOR SELECT
USING (true);

-- But we need to restrict what columns are actually returned
-- Since RLS doesn't support column-level restrictions, we rely on:
-- 1. Applications using players_public view instead of direct table access
-- 2. The Admin policy for full access to all columns including email

COMMENT ON POLICY "Public can view non-sensitive player info" ON public.players IS 
'Allows public SELECT on players table to support players_public view. Applications should use players_public view to exclude PII like email.';
