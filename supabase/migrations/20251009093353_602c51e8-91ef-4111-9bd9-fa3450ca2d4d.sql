-- Data wipe for clean testing - preserves auth, profile, and admin role
-- Deletes all players, matches, results, rankings, audit logs, and import history

-- Delete child records first (those with foreign keys)
TRUNCATE TABLE public.match_results CASCADE;
TRUNCATE TABLE public.player_rankings CASCADE;
TRUNCATE TABLE public.matches CASCADE;
TRUNCATE TABLE public.players CASCADE;

-- Delete audit and history tables
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.import_history CASCADE;