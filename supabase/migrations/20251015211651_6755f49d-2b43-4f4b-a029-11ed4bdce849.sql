-- AGGRESSIVE TEMPORARY UNBLOCK FOR REMIX (FIXED: only real tables)
-- Disable RLS on all public tables (excluding views) and grant anon/auth full access
-- REVERT AFTER REMIX COMPLETES

-- 1) Ensure roles can access the schema and relations
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 2) Disable RLS on actual tables only (exclude views)
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_merges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_organization_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_profile_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.upcoming_tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Note: Views like match_results, matches, player_rankings, current_rankings, expiring_points are intentionally excluded.

-- 3) Keep note to revert later