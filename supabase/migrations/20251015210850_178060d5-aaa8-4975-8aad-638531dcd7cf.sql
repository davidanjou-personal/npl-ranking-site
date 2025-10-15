-- Temporary public read access for remix on core protected tables
-- These policies allow anonymous inspection of schema/data during remix
-- REVERT THESE AFTER REMIX COMPLETES

-- Players table (currently admin-only SELECT)
CREATE POLICY "Public can view players (temporary remix)"
ON public.players
FOR SELECT
TO public
USING (true);

-- Profiles table (currently owner-only SELECT)
CREATE POLICY "Public can view profiles (temporary remix)"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Player accounts table (currently admin/owner-only SELECT)
CREATE POLICY "Public can view player accounts (temporary remix)"
ON public.player_accounts
FOR SELECT
TO public
USING (true);

-- Player claims table (currently admin/owner-only SELECT)
CREATE POLICY "Public can view player claims (temporary remix)"
ON public.player_claims
FOR SELECT
TO public
USING (true);