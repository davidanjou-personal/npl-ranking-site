-- Clear all match data and reset rankings (using TRUNCATE to bypass triggers)

-- Step 1: Truncate match_results (CASCADE will handle foreign keys)
TRUNCATE TABLE match_results CASCADE;

-- Step 2: Truncate matches
TRUNCATE TABLE matches CASCADE;

-- Step 3: Reset player rankings to zero
UPDATE player_rankings 
SET total_points = 0, 
    rank = NULL,
    updated_at = now();

-- Step 4: Clear import history
TRUNCATE TABLE import_history;