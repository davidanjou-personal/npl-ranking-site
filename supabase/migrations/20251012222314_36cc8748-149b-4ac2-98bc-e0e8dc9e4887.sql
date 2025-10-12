-- Create player merge history table
CREATE TABLE IF NOT EXISTS public.player_merges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_player_id uuid REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  merged_player_id uuid NOT NULL,
  merged_player_name text NOT NULL,
  merged_player_code text NOT NULL,
  merged_player_data jsonb NOT NULL,
  events_transferred integer NOT NULL DEFAULT 0,
  points_transferred integer NOT NULL DEFAULT 0,
  merged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  merged_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.player_merges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view merge history"
ON public.player_merges
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert merge history"
ON public.player_merges
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create merge players function
CREATE OR REPLACE FUNCTION public.merge_players(
  primary_player_id uuid,
  duplicate_player_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  primary_player players%ROWTYPE;
  duplicate_player players%ROWTYPE;
  events_count integer;
  points_total integer;
  result jsonb;
BEGIN
  -- Validation checks
  IF primary_player_id = duplicate_player_id THEN
    RAISE EXCEPTION 'Cannot merge a player with itself';
  END IF;

  -- Get both players
  SELECT * INTO primary_player FROM players WHERE id = primary_player_id;
  SELECT * INTO duplicate_player FROM players WHERE id = duplicate_player_id;

  IF primary_player.id IS NULL THEN
    RAISE EXCEPTION 'Primary player not found';
  END IF;

  IF duplicate_player.id IS NULL THEN
    RAISE EXCEPTION 'Duplicate player not found';
  END IF;

  -- Check for conflicting player accounts
  IF EXISTS (
    SELECT 1 FROM player_accounts WHERE player_id = primary_player_id
  ) AND EXISTS (
    SELECT 1 FROM player_accounts WHERE player_id = duplicate_player_id
  ) THEN
    RAISE EXCEPTION 'Both players have linked accounts. Please resolve manually.';
  END IF;

  -- Get count of events and points being transferred
  SELECT COUNT(*), COALESCE(SUM(points_awarded), 0)
  INTO events_count, points_total
  FROM event_results
  WHERE player_id = duplicate_player_id;

  -- 1. Move all event_results to primary player
  UPDATE event_results
  SET player_id = primary_player_id
  WHERE player_id = duplicate_player_id;

  -- 2. Transfer player_accounts if duplicate has one and primary doesn't
  IF NOT EXISTS (SELECT 1 FROM player_accounts WHERE player_id = primary_player_id)
  AND EXISTS (SELECT 1 FROM player_accounts WHERE player_id = duplicate_player_id) THEN
    UPDATE player_accounts
    SET player_id = primary_player_id
    WHERE player_id = duplicate_player_id;
  END IF;

  -- 3. Transfer player_claims
  UPDATE player_claims
  SET player_id = primary_player_id
  WHERE player_id = duplicate_player_id;

  -- 4. Update audit_logs references
  UPDATE audit_logs
  SET record_id = primary_player_id
  WHERE table_name = 'players' AND record_id = duplicate_player_id;

  -- 5. Merge profile data - fill in missing fields from duplicate
  UPDATE players
  SET
    email = COALESCE(primary_player.email, duplicate_player.email),
    date_of_birth = COALESCE(primary_player.date_of_birth, duplicate_player.date_of_birth),
    dupr_id = COALESCE(primary_player.dupr_id, duplicate_player.dupr_id),
    avatar_url = COALESCE(primary_player.avatar_url, duplicate_player.avatar_url),
    alternate_names = COALESCE(primary_player.alternate_names, ARRAY[]::text[]) || 
                     COALESCE(duplicate_player.alternate_names, ARRAY[]::text[]) ||
                     ARRAY[duplicate_player.name]
  WHERE id = primary_player_id;

  -- 6. Record the merge in history
  INSERT INTO player_merges (
    primary_player_id,
    merged_player_id,
    merged_player_name,
    merged_player_code,
    merged_player_data,
    events_transferred,
    points_transferred,
    merged_by
  ) VALUES (
    primary_player_id,
    duplicate_player_id,
    duplicate_player.name,
    duplicate_player.player_code,
    to_jsonb(duplicate_player),
    events_count,
    points_total,
    auth.uid()
  );

  -- 7. Delete the duplicate player
  DELETE FROM players WHERE id = duplicate_player_id;

  -- Return summary
  result := jsonb_build_object(
    'success', true,
    'primary_player_id', primary_player_id,
    'merged_player_id', duplicate_player_id,
    'events_transferred', events_count,
    'points_transferred', points_total
  );

  RETURN result;
END;
$$;