-- Grant SELECT access to players_public view for public access
GRANT SELECT ON public.players_public TO anon;
GRANT SELECT ON public.players_public TO authenticated;

-- Also grant SELECT on current_rankings view (used in search when no term provided)
GRANT SELECT ON public.current_rankings TO anon;
GRANT SELECT ON public.current_rankings TO authenticated;