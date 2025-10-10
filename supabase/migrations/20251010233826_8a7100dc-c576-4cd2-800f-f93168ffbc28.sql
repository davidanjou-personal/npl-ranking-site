-- Drop obsolete triggers and functions with CASCADE
DROP TRIGGER IF EXISTS trigger_update_rankings ON public.match_results;
DROP TRIGGER IF EXISTS calculate_points_trigger ON public.match_results CASCADE;
DROP TRIGGER IF EXISTS calculate_match_points_trigger ON public.match_results CASCADE;

DROP FUNCTION IF EXISTS public.update_player_rankings_on_match() CASCADE;
DROP FUNCTION IF EXISTS public.rebuild_player_rankings() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_match_points() CASCADE;

-- Recreate calculate_match_points without the player_rankings insert
CREATE OR REPLACE FUNCTION public.calculate_match_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_points INTEGER;
  position_multiplier DECIMAL;
  calculated_points INTEGER;
BEGIN
  IF NEW.points_awarded IS NULL THEN
    base_points := CASE 
      WHEN (SELECT tier FROM public.matches WHERE id = NEW.match_id) = 'tier1' THEN 1000
      WHEN (SELECT tier FROM public.matches WHERE id = NEW.match_id) = 'tier2' THEN 500
      WHEN (SELECT tier FROM public.matches WHERE id = NEW.match_id) = 'tier3' THEN 250
      WHEN (SELECT tier FROM public.matches WHERE id = NEW.match_id) = 'tier4' THEN 100
      ELSE 100
    END;

    position_multiplier := CASE NEW.finishing_position
      WHEN 'winner' THEN 1.0
      WHEN 'second' THEN 0.8
      WHEN 'third' THEN 0.6
      WHEN 'fourth' THEN 0.4
      WHEN 'quarterfinalist' THEN 0.25
      WHEN 'round_of_16' THEN 0.15
      WHEN 'event_win' THEN 0.05
      ELSE 0
    END;

    NEW.points_awarded := FLOOR(base_points * position_multiplier);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER calculate_match_points_trigger
BEFORE INSERT OR UPDATE ON public.match_results
FOR EACH ROW
EXECUTE FUNCTION public.calculate_match_points();