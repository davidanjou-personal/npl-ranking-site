-- Drop and recreate the calculate_match_points trigger to preserve imported points
DROP TRIGGER IF EXISTS calculate_match_points_trigger ON match_results;

-- Modify the function to only calculate points if not already set
CREATE OR REPLACE FUNCTION public.calculate_match_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_points INTEGER;
  position_multiplier DECIMAL;
  calculated_points INTEGER;
  match_category public.player_category;
BEGIN
  -- Get the match category
  SELECT category INTO match_category FROM public.matches WHERE id = NEW.match_id;

  -- Only calculate points if not already set (for bulk imports)
  IF NEW.points_awarded IS NULL OR NEW.points_awarded = 0 THEN
    -- Determine base points from tier
    base_points := CASE 
      WHEN (SELECT tier FROM public.matches WHERE id = NEW.match_id) = 'tier1' THEN 1000
      WHEN (SELECT tier FROM public.matches WHERE id = NEW.match_id) = 'tier2' THEN 500
      WHEN (SELECT tier FROM public.matches WHERE id = NEW.match_id) = 'tier3' THEN 250
      WHEN (SELECT tier FROM public.matches WHERE id = NEW.match_id) = 'tier4' THEN 100
      ELSE 100
    END;

    -- Determine position multiplier
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

    -- Calculate final points
    calculated_points := FLOOR(base_points * position_multiplier);
    NEW.points_awarded := calculated_points;
  END IF;
  
  -- Insert or update player_rankings for this category
  INSERT INTO public.player_rankings (player_id, category, total_points, updated_at)
  VALUES (NEW.player_id, match_category, NEW.points_awarded, now())
  ON CONFLICT (player_id, category)
  DO UPDATE SET
    total_points = player_rankings.total_points + NEW.points_awarded,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER calculate_match_points_trigger
  BEFORE INSERT ON match_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_match_points();