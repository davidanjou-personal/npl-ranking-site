-- Phase 1.3: Add Critical Database Indexes for Performance
-- These indexes will dramatically improve query performance as data grows

-- Events table indexes (most critical - frequently queried)
CREATE INDEX IF NOT EXISTS idx_events_match_date ON public.events(match_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_date_category ON public.events(match_date, category);
CREATE INDEX IF NOT EXISTS idx_events_import_id ON public.events(import_id);

-- Event results table indexes (second most critical)
CREATE INDEX IF NOT EXISTS idx_event_results_player_id ON public.event_results(player_id);
CREATE INDEX IF NOT EXISTS idx_event_results_event_id ON public.event_results(event_id);
CREATE INDEX IF NOT EXISTS idx_event_results_player_event ON public.event_results(player_id, event_id);

-- Players table indexes
CREATE INDEX IF NOT EXISTS idx_players_country ON public.players(country);
CREATE INDEX IF NOT EXISTS idx_players_gender ON public.players(gender);
CREATE INDEX IF NOT EXISTS idx_players_email ON public.players(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_dupr_id ON public.players(dupr_id) WHERE dupr_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_player_code ON public.players(player_code);

-- Player accounts indexes
CREATE INDEX IF NOT EXISTS idx_player_accounts_user_id ON public.player_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_player_accounts_player_id ON public.player_accounts(player_id);

-- Player claims indexes
CREATE INDEX IF NOT EXISTS idx_player_claims_status ON public.player_claims(status);
CREATE INDEX IF NOT EXISTS idx_player_claims_user_id ON public.player_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_player_claims_player_id ON public.player_claims(player_id);

-- Import history indexes
CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON public.import_history(created_at);
CREATE INDEX IF NOT EXISTS idx_import_history_imported_by ON public.import_history(imported_by);

-- Phase 2.3: Add Missing Data Validation Constraints

-- Ensure email uniqueness where provided
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email_unique ON public.players(email) WHERE email IS NOT NULL;

-- Ensure DUPR ID uniqueness where provided
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_dupr_unique ON public.players(dupr_id) WHERE dupr_id IS NOT NULL;

-- Add constraint to ensure player_code is unique (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_players_player_code'
  ) THEN
    ALTER TABLE public.players ADD CONSTRAINT uq_players_player_code UNIQUE (player_code);
  END IF;
END $$;