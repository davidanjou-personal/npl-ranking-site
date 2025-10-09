-- Step 1: Recreate the trigger to auto-update player_rankings
CREATE OR REPLACE FUNCTION public.update_player_rankings_on_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  match_category player_category;
BEGIN
  -- Get the match category
  SELECT category INTO match_category FROM public.matches WHERE id = NEW.match_id;

  IF (TG_OP = 'INSERT') THEN
    -- Add points to player's ranking
    INSERT INTO public.player_rankings (player_id, category, total_points, updated_at)
    VALUES (NEW.player_id, match_category, NEW.points_awarded, now())
    ON CONFLICT (player_id, category)
    DO UPDATE SET
      total_points = player_rankings.total_points + NEW.points_awarded,
      updated_at = now();
    
    RETURN NEW;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Adjust points if match result is modified
    DECLARE
      points_difference INTEGER;
    BEGIN
      points_difference := NEW.points_awarded - OLD.points_awarded;
      
      IF points_difference != 0 THEN
        UPDATE public.player_rankings
        SET total_points = total_points + points_difference,
            updated_at = now()
        WHERE player_id = NEW.player_id AND category = match_category;
      END IF;
      
      RETURN NEW;
    END;
    
  ELSIF (TG_OP = 'DELETE') THEN
    -- Subtract points when match result is deleted
    UPDATE public.player_rankings
    SET total_points = total_points - OLD.points_awarded,
        updated_at = now()
    WHERE player_id = OLD.player_id AND category = match_category;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create the trigger on match_results
DROP TRIGGER IF EXISTS trigger_update_rankings ON public.match_results;
CREATE TRIGGER trigger_update_rankings
  AFTER INSERT OR UPDATE OR DELETE ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_player_rankings_on_match();

-- Step 2: Create function to recalculate all rankings from scratch
CREATE OR REPLACE FUNCTION public.rebuild_player_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Clear existing rankings
  TRUNCATE public.player_rankings;
  
  -- Rebuild from match_results
  INSERT INTO public.player_rankings (player_id, category, total_points, rank, created_at, updated_at)
  SELECT 
    mr.player_id,
    m.category,
    SUM(mr.points_awarded) as total_points,
    0 as rank, -- will be updated next
    now(),
    now()
  FROM public.match_results mr
  INNER JOIN public.matches m ON m.id = mr.match_id
  GROUP BY mr.player_id, m.category;
  
  -- Update ranks using RANK() window function
  WITH ranked AS (
    SELECT 
      id,
      RANK() OVER (PARTITION BY category ORDER BY total_points DESC) as new_rank
    FROM public.player_rankings
  )
  UPDATE public.player_rankings pr
  SET rank = ranked.new_rank,
      updated_at = now()
  FROM ranked
  WHERE pr.id = ranked.id;
END;
$$;

-- Step 3: Rebuild rankings now to sync data
SELECT public.rebuild_player_rankings();

-- Step 4: Create view for expiring points (11-12 months old)
CREATE OR REPLACE VIEW public.expiring_points AS
SELECT 
  mr.player_id,
  m.category,
  p.name,
  p.country,
  SUM(mr.points_awarded) as expiring_points,
  MIN(m.match_date + INTERVAL '12 months') as next_expiry_date
FROM public.match_results mr
INNER JOIN public.matches m ON m.id = mr.match_id
LEFT JOIN public.players p ON p.id = mr.player_id
WHERE m.match_date >= CURRENT_DATE - INTERVAL '12 months'
  AND m.match_date < CURRENT_DATE - INTERVAL '11 months'
GROUP BY mr.player_id, m.category, p.name, p.country
ORDER BY m.category, expiring_points DESC;

-- Enable SECURITY INVOKER on the new view
ALTER VIEW public.expiring_points SET (security_invoker = on);

-- Grant permissions
GRANT SELECT ON public.expiring_points TO anon, authenticated;