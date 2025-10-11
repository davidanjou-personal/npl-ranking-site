-- Add 'historic' value to the tournament_tier enum
ALTER TYPE tournament_tier ADD VALUE IF NOT EXISTS 'historic';

-- Update calculate_match_points function to handle historic tier
CREATE OR REPLACE FUNCTION public.calculate_match_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      WHEN (SELECT tier FROM public.matches WHERE id = NEW.match_id) = 'historic' THEN 0
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
$function$;