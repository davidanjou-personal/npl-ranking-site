-- Add import tracking to matches table
ALTER TABLE public.matches 
ADD COLUMN import_id uuid REFERENCES public.import_history(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_matches_import_id ON public.matches(import_id);

-- Add comment for clarity
COMMENT ON COLUMN public.matches.import_id IS 'Tracks which import created this match for rollback capability';

-- Update the bulk import to track import_id (handled in edge function code)