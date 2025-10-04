-- Add new optional fields to players table for better identification
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS dupr_id TEXT;

-- Add indexes for better duplicate detection performance
CREATE INDEX IF NOT EXISTS idx_players_name ON public.players(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_players_email ON public.players(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_dupr_id ON public.players(dupr_id) WHERE dupr_id IS NOT NULL;

-- Add unique constraint on dupr_id when provided
ALTER TABLE public.players 
ADD CONSTRAINT unique_dupr_id UNIQUE (dupr_id) DEFERRABLE INITIALLY DEFERRED;