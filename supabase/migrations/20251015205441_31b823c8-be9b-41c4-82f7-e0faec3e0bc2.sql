-- Loosen security for remix: clear roles and allow public read on selected tables

-- 1) Clear all user roles
DELETE FROM public.user_roles;

-- 2) Add temporary public read-only access where admin-only SELECT might block app loads
-- Note: These are read-only and intended to be reverted after remix

-- Import history (admin-only by default)
CREATE POLICY "Public can view import history (temporary remix)"
ON public.import_history
FOR SELECT
TO public
USING (true);

-- Player merges history
CREATE POLICY "Public can view player merges (temporary remix)"
ON public.player_merges
FOR SELECT
TO public
USING (true);

-- Player profile updates
CREATE POLICY "Public can view player profile updates (temporary remix)"
ON public.player_profile_updates
FOR SELECT
TO public
USING (true);

-- User roles table (will be empty after deletion above)
CREATE POLICY "Public can view user roles (temporary remix)"
ON public.user_roles
FOR SELECT
TO public
USING (true);

-- Audit logs (read-only visibility)
CREATE POLICY "Public can view audit logs (temporary remix)"
ON public.audit_logs
FOR SELECT
TO public
USING (true);
