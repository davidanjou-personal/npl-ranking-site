-- Phase 1: Add player unique codes
ALTER TABLE public.players 
ADD COLUMN player_code TEXT UNIQUE;

-- Add index for performance
CREATE INDEX idx_players_player_code ON public.players(player_code);

-- Phase 2: Create active_player_rankings view for 12-month rolling points
CREATE OR REPLACE VIEW public.active_player_rankings AS
SELECT 
  pr.id,
  pr.player_id,
  pr.category,
  COALESCE(SUM(mr.points_awarded), 0) as total_points,
  pr.rank,
  pr.created_at,
  pr.updated_at
FROM public.player_rankings pr
LEFT JOIN public.match_results mr ON mr.player_id = pr.player_id
LEFT JOIN public.matches m ON m.id = mr.match_id AND m.category = pr.category
WHERE m.match_date >= CURRENT_DATE - INTERVAL '12 months' OR m.match_date IS NULL
GROUP BY pr.id, pr.player_id, pr.category, pr.rank, pr.created_at, pr.updated_at;

-- Create function to get player ranking summary
CREATE OR REPLACE FUNCTION public.get_player_ranking_summary(
  p_player_id UUID,
  p_category player_category
)
RETURNS TABLE (
  lifetime_points INTEGER,
  lifetime_rank INTEGER,
  active_points INTEGER,
  active_rank INTEGER,
  expiring_points INTEGER,
  next_expiry_date DATE
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH lifetime AS (
    SELECT total_points, rank 
    FROM player_rankings 
    WHERE player_id = p_player_id AND category = p_category
  ),
  active AS (
    SELECT 
      COALESCE(SUM(mr.points_awarded), 0)::INTEGER as pts,
      (
        SELECT COUNT(*) + 1 
        FROM player_rankings pr2
        WHERE pr2.category = p_category 
        AND pr2.total_points > COALESCE(SUM(mr.points_awarded), 0)
      )::INTEGER as rnk
    FROM match_results mr
    JOIN matches m ON m.id = mr.match_id
    WHERE mr.player_id = p_player_id 
    AND m.category = p_category
    AND m.match_date >= CURRENT_DATE - INTERVAL '12 months'
  ),
  expiring AS (
    SELECT 
      COALESCE(SUM(mr.points_awarded), 0)::INTEGER as pts,
      MIN(m.match_date + INTERVAL '12 months')::DATE as next_exp
    FROM match_results mr
    JOIN matches m ON m.id = mr.match_id
    WHERE mr.player_id = p_player_id 
    AND m.category = p_category
    AND m.match_date < CURRENT_DATE - INTERVAL '11 months'
    AND m.match_date >= CURRENT_DATE - INTERVAL '12 months'
  )
  SELECT 
    COALESCE(l.total_points, 0)::INTEGER,
    COALESCE(l.rank, 999)::INTEGER,
    COALESCE(a.pts, 0)::INTEGER,
    COALESCE(a.rnk, 999)::INTEGER,
    COALESCE(e.pts, 0)::INTEGER,
    e.next_exp
  FROM lifetime l
  CROSS JOIN active a
  LEFT JOIN expiring e ON true;
END;
$$;

-- Phase 4: Create import history table
CREATE TABLE public.import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by UUID REFERENCES auth.users(id) NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL,
  successful_rows INTEGER NOT NULL,
  failed_rows INTEGER NOT NULL,
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on import_history
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view import history
CREATE POLICY "Admins can view import history"
  ON public.import_history
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert import history
CREATE POLICY "Admins can insert import history"
  ON public.import_history
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_import_history_imported_by ON public.import_history(imported_by);
CREATE INDEX idx_import_history_created_at ON public.import_history(created_at DESC);