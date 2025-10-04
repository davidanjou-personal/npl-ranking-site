-- Update the update_player_rankings function to use RANK() for equal points
CREATE OR REPLACE FUNCTION public.update_player_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update rankings for each category using RANK() to handle ties
  WITH ranked_players AS (
    SELECT
      id,
      category,
      RANK() OVER (PARTITION BY category ORDER BY total_points DESC) as new_rank
    FROM public.player_rankings
  )
  UPDATE public.player_rankings pr
  SET rank = rp.new_rank,
      updated_at = now()
  FROM ranked_players rp
  WHERE pr.id = rp.id;
END;
$function$;