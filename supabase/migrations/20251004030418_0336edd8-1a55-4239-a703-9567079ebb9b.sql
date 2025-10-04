-- Drop existing player_rankings table if it exists
DROP TABLE IF EXISTS public.player_rankings CASCADE;

-- Create player_rankings table to track points per category
CREATE TABLE public.player_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  category public.player_category NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_id, category)
);

-- Enable RLS on player_rankings
ALTER TABLE public.player_rankings ENABLE ROW LEVEL SECURITY;

-- Create policies for player_rankings
CREATE POLICY "Player rankings are viewable by everyone"
ON public.player_rankings FOR SELECT
USING (true);

CREATE POLICY "Only admins can update player rankings"
ON public.player_rankings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can insert player rankings"
ON public.player_rankings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add gender column to players table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='gender') THEN
    ALTER TABLE public.players ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));
  END IF;
END $$;

-- Migrate existing players: infer gender from category (if category still exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='category') THEN
    UPDATE public.players
    SET gender = CASE
      WHEN category IN ('mens_singles', 'mens_doubles') THEN 'male'
      WHEN category IN ('womens_singles', 'womens_doubles') THEN 'female'
      ELSE 'male'
    END
    WHERE gender IS NULL;
  END IF;
END $$;

-- Make gender NOT NULL after migration
ALTER TABLE public.players ALTER COLUMN gender SET NOT NULL;

-- Migrate existing player points to player_rankings (if columns still exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='category')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='total_points') THEN
    INSERT INTO public.player_rankings (player_id, category, total_points, rank)
    SELECT id, category, COALESCE(total_points, 0), rank
    FROM public.players
    ON CONFLICT (player_id, category) DO NOTHING;
  END IF;
END $$;

-- Remove old columns from players table if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='category') THEN
    ALTER TABLE public.players DROP COLUMN category;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='total_points') THEN
    ALTER TABLE public.players DROP COLUMN total_points;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='rank') THEN
    ALTER TABLE public.players DROP COLUMN rank;
  END IF;
END $$;

-- Update the calculate_match_points function
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
  match_category public.player_category;
BEGIN
  -- Get the match category
  SELECT category INTO match_category FROM public.matches WHERE id = NEW.match_id;

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
  
  -- Insert or update player_rankings for this category
  INSERT INTO public.player_rankings (player_id, category, total_points, updated_at)
  VALUES (NEW.player_id, match_category, calculated_points, now())
  ON CONFLICT (player_id, category)
  DO UPDATE SET
    total_points = player_rankings.total_points + calculated_points,
    updated_at = now();
  
  RETURN NEW;
END;
$function$;

-- Update the update_player_rankings function
CREATE OR REPLACE FUNCTION public.update_player_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update rankings for each category
  WITH ranked_players AS (
    SELECT
      id,
      category,
      ROW_NUMBER() OVER (PARTITION BY category ORDER BY total_points DESC) as new_rank
    FROM public.player_rankings
  )
  UPDATE public.player_rankings pr
  SET rank = rp.new_rank,
      updated_at = now()
  FROM ranked_players rp
  WHERE pr.id = rp.id;
END;
$function$;

-- Add trigger for player_rankings updated_at
DROP TRIGGER IF EXISTS update_player_rankings_updated_at ON public.player_rankings;
CREATE TRIGGER update_player_rankings_updated_at
BEFORE UPDATE ON public.player_rankings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_player_rankings_player_category ON public.player_rankings(player_id, category);
CREATE INDEX IF NOT EXISTS idx_player_rankings_category_rank ON public.player_rankings(category, rank);