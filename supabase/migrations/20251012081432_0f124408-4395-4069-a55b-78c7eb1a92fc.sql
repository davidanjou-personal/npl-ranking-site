-- Add alternate_names column to players table
ALTER TABLE public.players 
ADD COLUMN alternate_names text[];

-- Add check constraint to ensure no empty strings in array
ALTER TABLE public.players
ADD CONSTRAINT alternate_names_no_empty CHECK (
  alternate_names IS NULL OR 
  NOT ('' = ANY(alternate_names))
);

-- Add check constraint to limit array size (max 10 alternates)
ALTER TABLE public.players
ADD CONSTRAINT alternate_names_max_length CHECK (
  alternate_names IS NULL OR 
  array_length(alternate_names, 1) <= 10
);

-- Create GIN index for efficient alternate name lookups
CREATE INDEX idx_players_alternate_names ON public.players USING GIN (alternate_names);

-- Add comment for documentation
COMMENT ON COLUMN public.players.alternate_names IS 'Array of alternate names/spellings for the player (e.g., Joey Wild for Joseph Wild). Used for matching during bulk imports but does not trigger auto-merge.';