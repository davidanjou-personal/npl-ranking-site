-- Merge duplicate events and consolidate their results
-- Disable only user-defined triggers to avoid ranking recalculation during merge

-- Step 1: Create a function to merge duplicates
CREATE OR REPLACE FUNCTION merge_duplicate_events()
RETURNS void AS $$
DECLARE
  dup_record RECORD;
  keeper_id UUID;
  merge_count INTEGER := 0;
BEGIN
  -- Disable only user-defined triggers on event_results
  ALTER TABLE event_results DISABLE TRIGGER USER;
  
  -- For each group of duplicates
  FOR dup_record IN (
    SELECT 
      tournament_name,
      match_date,
      category,
      tier,
      COUNT(*) as dup_count
    FROM events
    GROUP BY tournament_name, match_date, category, tier
    HAVING COUNT(*) > 1
  ) LOOP
    -- Find the keeper (first created event in this group)
    SELECT id INTO keeper_id
    FROM events
    WHERE tournament_name = dup_record.tournament_name
      AND match_date = dup_record.match_date
      AND category = dup_record.category
      AND tier = dup_record.tier
    ORDER BY created_at
    LIMIT 1;
    
    -- Move all event_results from duplicates to the keeper
    UPDATE event_results
    SET event_id = keeper_id
    WHERE event_id IN (
      SELECT id
      FROM events
      WHERE tournament_name = dup_record.tournament_name
        AND match_date = dup_record.match_date
        AND category = dup_record.category
        AND tier = dup_record.tier
        AND id != keeper_id
    );
    
    -- Delete the duplicate events
    DELETE FROM events
    WHERE tournament_name = dup_record.tournament_name
      AND match_date = dup_record.match_date
      AND category = dup_record.category
      AND tier = dup_record.tier
      AND id != keeper_id;
    
    merge_count := merge_count + 1;
      
    RAISE NOTICE 'Merged % duplicates for % - % - % - %', 
      dup_record.dup_count - 1, 
      dup_record.tournament_name, 
      dup_record.match_date, 
      dup_record.category,
      dup_record.tier;
  END LOOP;
  
  -- Re-enable user-defined triggers
  ALTER TABLE event_results ENABLE TRIGGER USER;
  
  RAISE NOTICE 'Total tournament groups merged: %', merge_count;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Execute the merge function
SELECT merge_duplicate_events();

-- Step 3: Drop the temporary function
DROP FUNCTION merge_duplicate_events();

-- Step 4: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_unique_tournament
ON events(tournament_name, match_date, category, tier);