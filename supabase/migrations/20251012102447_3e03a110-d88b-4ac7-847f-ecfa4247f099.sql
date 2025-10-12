-- Drop the trigger that attempts to update the player_rankings VIEW
-- The VIEW automatically reflects current data from event_results, so no trigger is needed
DROP TRIGGER IF EXISTS trigger_ranking_update_on_event_trigger ON public.event_results;