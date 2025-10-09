-- Full data wipe before fresh import
TRUNCATE TABLE public.match_results CASCADE;
TRUNCATE TABLE public.player_rankings CASCADE;
TRUNCATE TABLE public.matches CASCADE;
TRUNCATE TABLE public.players CASCADE;
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.import_history CASCADE;