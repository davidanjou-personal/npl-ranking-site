-- Fix security issues from previous migration

-- Recreate player_rankings VIEW without SECURITY DEFINER (use SECURITY INVOKER instead)
DROP VIEW IF EXISTS player_rankings;
CREATE OR REPLACE VIEW player_rankings 
WITH (security_invoker = true)
AS
WITH ranked_players AS (
  SELECT 
    mr.player_id,
    m.category,
    SUM(mr.points_awarded) as total_points,
    RANK() OVER (PARTITION BY m.category ORDER BY SUM(mr.points_awarded) DESC) as rank
  FROM match_results mr
  INNER JOIN matches m ON m.id = mr.match_id
  GROUP BY mr.player_id, m.category
)
SELECT 
  gen_random_uuid() as id,
  player_id,
  category,
  total_points::INTEGER,
  rank::INTEGER,
  NOW() as created_at,
  NOW() as updated_at
FROM ranked_players;

-- Fix generate_player_code function with search_path
CREATE OR REPLACE FUNCTION generate_player_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  new_code TEXT;
BEGIN
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN player_code ~ '^(NPL|PWR)\d{9}$' 
        THEN SUBSTRING(player_code FROM 4)::INTEGER
        ELSE 0
      END
    ), 
    0
  ) + 1 INTO next_num
  FROM players;
  
  new_code := 'NPL' || LPAD(next_num::TEXT, 9, '0');
  RETURN new_code;
END;
$$;

-- Fix ensure_player_code function with search_path
CREATE OR REPLACE FUNCTION ensure_player_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.player_code IS NULL OR NEW.player_code = '' THEN
    NEW.player_code := generate_player_code();
  END IF;
  RETURN NEW;
END;
$$;