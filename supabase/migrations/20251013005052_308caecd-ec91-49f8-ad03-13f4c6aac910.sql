-- Step 2: Migrate existing mixed_doubles data to gender-specific categories

-- Create temporary tracking table for migration
CREATE TEMP TABLE mixed_doubles_migration (
  old_event_id UUID,
  new_mens_event_id UUID,
  new_womens_event_id UUID,
  has_male_results BOOLEAN,
  has_female_results BOOLEAN
);

-- Analyze each mixed_doubles event to determine gender distribution
INSERT INTO mixed_doubles_migration
SELECT 
  e.id as old_event_id,
  NULL as new_mens_event_id,
  NULL as new_womens_event_id,
  EXISTS (
    SELECT 1 FROM event_results er
    JOIN players p ON er.player_id = p.id
    WHERE er.event_id = e.id AND p.gender = 'male'
  ) as has_male_results,
  EXISTS (
    SELECT 1 FROM event_results er
    JOIN players p ON er.player_id = p.id
    WHERE er.event_id = e.id AND p.gender = 'female'
  ) as has_female_results
FROM events e
WHERE e.category = 'mixed_doubles';

-- Create new mens_mixed_doubles events
WITH new_mens_events AS (
  INSERT INTO events (
    tournament_name,
    match_date,
    tier,
    category,
    is_public,
    created_by,
    import_id,
    created_at
  )
  SELECT 
    e.tournament_name,
    e.match_date,
    e.tier,
    'mens_mixed_doubles'::player_category,
    e.is_public,
    e.created_by,
    e.import_id,
    e.created_at
  FROM events e
  JOIN mixed_doubles_migration m ON e.id = m.old_event_id
  WHERE m.has_male_results = TRUE
  RETURNING id, tournament_name, match_date, tier, import_id, created_at
)
UPDATE mixed_doubles_migration m
SET new_mens_event_id = ne.id
FROM new_mens_events ne, events e
WHERE m.old_event_id = e.id
  AND e.tournament_name = ne.tournament_name
  AND e.match_date = ne.match_date
  AND e.tier = ne.tier
  AND COALESCE(e.import_id::text, '') = COALESCE(ne.import_id::text, '')
  AND e.created_at = ne.created_at;

-- Create new womens_mixed_doubles events
WITH new_womens_events AS (
  INSERT INTO events (
    tournament_name,
    match_date,
    tier,
    category,
    is_public,
    created_by,
    import_id,
    created_at
  )
  SELECT 
    e.tournament_name,
    e.match_date,
    e.tier,
    'womens_mixed_doubles'::player_category,
    e.is_public,
    e.created_by,
    e.import_id,
    e.created_at
  FROM events e
  JOIN mixed_doubles_migration m ON e.id = m.old_event_id
  WHERE m.has_female_results = TRUE
  RETURNING id, tournament_name, match_date, tier, import_id, created_at
)
UPDATE mixed_doubles_migration m
SET new_womens_event_id = we.id
FROM new_womens_events we, events e
WHERE m.old_event_id = e.id
  AND e.tournament_name = we.tournament_name
  AND e.match_date = we.match_date
  AND e.tier = we.tier
  AND COALESCE(e.import_id::text, '') = COALESCE(we.import_id::text, '')
  AND e.created_at = we.created_at;

-- Migrate male event_results to new mens_mixed_doubles events
UPDATE event_results er
SET event_id = m.new_mens_event_id
FROM mixed_doubles_migration m, players p
WHERE er.event_id = m.old_event_id
  AND er.player_id = p.id
  AND p.gender = 'male'
  AND m.new_mens_event_id IS NOT NULL;

-- Migrate female event_results to new womens_mixed_doubles events
UPDATE event_results er
SET event_id = m.new_womens_event_id
FROM mixed_doubles_migration m, players p
WHERE er.event_id = m.old_event_id
  AND er.player_id = p.id
  AND p.gender = 'female'
  AND m.new_womens_event_id IS NOT NULL;

-- Delete old mixed_doubles events (now have no results)
DELETE FROM events e
WHERE e.category = 'mixed_doubles'
  AND NOT EXISTS (
    SELECT 1 FROM event_results er
    WHERE er.event_id = e.id
  );

-- Clean up temporary table
DROP TABLE mixed_doubles_migration;