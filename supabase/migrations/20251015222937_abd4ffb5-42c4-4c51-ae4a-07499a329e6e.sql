-- Fix Security Definer View errors: Convert all views to SECURITY INVOKER
ALTER VIEW public.current_rankings SET (security_invoker = on);
ALTER VIEW public.expiring_points SET (security_invoker = on);
ALTER VIEW public.match_results SET (security_invoker = on);
ALTER VIEW public.player_rankings SET (security_invoker = on);
ALTER VIEW public.players_public SET (security_invoker = on);

-- Enable RLS on all public tables with fully open policies
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.table_name);
    
    -- Drop any prior policies to avoid duplicates
    EXECUTE format('DROP POLICY IF EXISTS "all_select" ON public.%I;', t.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "all_insert" ON public.%I;', t.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "all_update" ON public.%I;', t.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "all_delete" ON public.%I;', t.table_name);

    -- Create fully open policies for anon and authenticated
    EXECUTE format('CREATE POLICY "all_select" ON public.%I FOR SELECT TO anon, authenticated USING (true);', t.table_name);
    EXECUTE format('CREATE POLICY "all_insert" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true);', t.table_name);
    EXECUTE format('CREATE POLICY "all_update" ON public.%I FOR UPDATE TO anon, authenticated USING (true);', t.table_name);
    EXECUTE format('CREATE POLICY "all_delete" ON public.%I FOR DELETE TO anon, authenticated USING (true);', t.table_name);
  END LOOP;
END $$;