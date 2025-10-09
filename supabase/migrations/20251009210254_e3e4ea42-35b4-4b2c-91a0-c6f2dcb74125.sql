-- Fix security definer issue on current_rankings view
ALTER VIEW public.current_rankings SET (security_invoker = on);

-- Fix security definer issue on active_player_rankings view (if it exists)
ALTER VIEW public.active_player_rankings SET (security_invoker = on);