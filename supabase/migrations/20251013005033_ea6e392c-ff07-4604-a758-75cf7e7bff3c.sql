-- Step 1: Add new category values to player_category enum
-- These must be committed before they can be used in queries
ALTER TYPE player_category ADD VALUE IF NOT EXISTS 'mens_mixed_doubles';
ALTER TYPE player_category ADD VALUE IF NOT EXISTS 'womens_mixed_doubles';