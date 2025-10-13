-- Migration: Rename event_win to points_awarded in finishing_position enum
-- Must handle dependent views

-- Step 1: Drop the match_results view that depends on this column
DROP VIEW IF EXISTS match_results;

-- Step 2: Create new enum with points_awarded (no event_win)
CREATE TYPE finishing_position_new AS ENUM (
  'winner',
  'second',
  'third',
  'fourth',
  'quarterfinalist',
  'round_of_16',
  'points_awarded'
);

-- Step 3: Alter the column to use new enum, converting event_win to points_awarded
ALTER TABLE event_results 
  ALTER COLUMN finishing_position TYPE finishing_position_new 
  USING (
    CASE 
      WHEN finishing_position::text = 'event_win' THEN 'points_awarded'::finishing_position_new
      ELSE finishing_position::text::finishing_position_new
    END
  );

-- Step 4: Drop old enum and rename new one
DROP TYPE finishing_position;
ALTER TYPE finishing_position_new RENAME TO finishing_position;

-- Step 5: Recreate the match_results view (if it was used - this is a backward compatibility view)
-- Note: This view is deprecated as we now use 'events' and 'event_results' tables directly
CREATE OR REPLACE VIEW match_results AS
SELECT 
  er.id,
  er.event_id as match_id,
  er.player_id,
  er.finishing_position,
  er.points_awarded,
  er.created_at
FROM event_results er;