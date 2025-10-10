-- Fix import failure: remove ranking update trigger that writes to the player_rankings VIEW
-- Rankings are computed via the player_rankings VIEW, so no trigger-based updates are needed.

-- Drop ONLY the problematic trigger on match_results that attempted to update rankings
DROP TRIGGER IF EXISTS update_rankings_after_result ON public.match_results;

-- Keep other auditing and calculation triggers intact.
