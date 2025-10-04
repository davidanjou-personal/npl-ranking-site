-- Add tournament tier enum
CREATE TYPE tournament_tier AS ENUM ('tier1', 'tier2', 'tier3', 'tier4');

-- Add finishing position enum
CREATE TYPE finishing_position AS ENUM (
  'winner',
  'second',
  'third',
  'fourth',
  'quarterfinalist',
  'round_of_16',
  'event_win'
);

-- Add tier column to matches table
ALTER TABLE public.matches ADD COLUMN tier tournament_tier NOT NULL DEFAULT 'tier4';

-- Add finishing_position column as nullable first
ALTER TABLE public.match_results ADD COLUMN finishing_position finishing_position;

-- Update existing records: if they had result='win', set to 'winner', otherwise 'event_win'
UPDATE public.match_results 
SET finishing_position = CASE 
  WHEN result = 'win' THEN 'winner'::finishing_position
  ELSE 'event_win'::finishing_position
END;

-- Now make it NOT NULL
ALTER TABLE public.match_results ALTER COLUMN finishing_position SET NOT NULL;

-- Drop the old result column
ALTER TABLE public.match_results DROP COLUMN result;

-- Drop the old trigger FIRST, then the function
DROP TRIGGER IF EXISTS calculate_points_on_result ON public.match_results;
DROP TRIGGER IF EXISTS calculate_points_trigger ON public.match_results;
DROP FUNCTION IF EXISTS public.calculate_match_points();

-- Create new point calculation function based on Global Alliance structure
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
  
  -- Update player total points
  UPDATE public.players
  SET total_points = total_points + calculated_points,
      updated_at = now()
  WHERE id = NEW.player_id;
  
  RETURN NEW;
END;
$function$;

-- Recreate trigger
CREATE TRIGGER calculate_points_trigger
BEFORE INSERT ON public.match_results
FOR EACH ROW
EXECUTE FUNCTION public.calculate_match_points();