-- Phase 1: Drop player_rankings TABLE and create as VIEW
DROP TABLE IF EXISTS player_rankings CASCADE;

-- Create player_rankings as a VIEW (all-time aggregation)
CREATE OR REPLACE VIEW player_rankings AS
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

-- Phase 2: Remove unused opponent_id column
ALTER TABLE match_results DROP COLUMN IF EXISTS opponent_id;

-- Phase 3: Add player_code auto-generation
CREATE OR REPLACE FUNCTION generate_player_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ensure_player_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.player_code IS NULL OR NEW.player_code = '' THEN
    NEW.player_code := generate_player_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_player_code ON players;
CREATE TRIGGER trigger_ensure_player_code
  BEFORE INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION ensure_player_code();

-- Phase 4: Backfill missing player_code values using CTE
WITH numbered_players AS (
  SELECT 
    id,
    'NPL' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 9, '0') as new_code
  FROM players
  WHERE player_code IS NULL
)
UPDATE players
SET player_code = numbered_players.new_code
FROM numbered_players
WHERE players.id = numbered_players.id;

-- Phase 5: Add constraints
ALTER TABLE players ALTER COLUMN player_code SET NOT NULL;
ALTER TABLE players ADD CONSTRAINT players_player_code_unique UNIQUE (player_code);