-- Drop the nationality column since it's redundant with country
-- Both columns represent the same data (country/nationality)
ALTER TABLE players DROP COLUMN IF EXISTS nationality;