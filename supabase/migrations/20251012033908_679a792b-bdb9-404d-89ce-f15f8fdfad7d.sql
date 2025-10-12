-- Phase 3.2: Rename tables from "matches" to "events"
-- This is a breaking change that requires updating all references

-- Step 1: Rename the main tables
ALTER TABLE matches RENAME TO events;
ALTER TABLE match_results RENAME TO event_results;

-- Step 2: Rename foreign key column in event_results
ALTER TABLE event_results RENAME COLUMN match_id TO event_id;

-- Step 3: Update the calculate_match_points function to reference new table/column names
CREATE OR REPLACE FUNCTION public.calculate_match_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_points INTEGER;
  position_multiplier DECIMAL;
  calculated_points INTEGER;
BEGIN
  IF NEW.points_awarded IS NULL THEN
    base_points := CASE 
      WHEN (SELECT tier FROM public.events WHERE id = NEW.event_id) = 'tier1' THEN 1000
      WHEN (SELECT tier FROM public.events WHERE id = NEW.event_id) = 'tier2' THEN 500
      WHEN (SELECT tier FROM public.events WHERE id = NEW.event_id) = 'tier3' THEN 250
      WHEN (SELECT tier FROM public.events WHERE id = NEW.event_id) = 'tier4' THEN 100
      WHEN (SELECT tier FROM public.events WHERE id = NEW.event_id) = 'historic' THEN 0
      ELSE 100
    END;

    position_multiplier := CASE NEW.finishing_position
      WHEN 'winner' THEN 1.0
      WHEN 'second' THEN 0.8
      WHEN 'third' THEN 0.6
      WHEN 'fourth' THEN 0.4
      WHEN 'quarterfinalist' THEN 0.25
      WHEN 'round_of_16' THEN 0.15
      WHEN 'event_win' THEN 0.05
      ELSE 0
    END;

    NEW.points_awarded := FLOOR(base_points * position_multiplier);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 4: Update audit function for events table
CREATE OR REPLACE FUNCTION public.audit_events_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.create_audit_log(
      'INSERT',
      'events',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM public.create_audit_log(
      'UPDATE',
      'events',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.create_audit_log(
      'DELETE',
      'events',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
END;
$$;

-- Step 5: Update audit function for event_results table
CREATE OR REPLACE FUNCTION public.audit_event_results_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.create_audit_log(
      'INSERT',
      'event_results',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM public.create_audit_log(
      'UPDATE',
      'event_results',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.create_audit_log(
      'DELETE',
      'event_results',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
END;
$$;

-- Step 6: Drop old triggers and create new ones
DROP TRIGGER IF EXISTS audit_matches_trigger ON public.events;
DROP TRIGGER IF EXISTS audit_match_results_trigger ON public.event_results;
DROP TRIGGER IF EXISTS calculate_match_points_trigger ON public.event_results;
DROP TRIGGER IF EXISTS trigger_ranking_update_trigger ON public.event_results;

-- Create new triggers with updated function names
CREATE TRIGGER audit_events_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.audit_events_changes();

CREATE TRIGGER audit_event_results_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.event_results
  FOR EACH ROW EXECUTE FUNCTION public.audit_event_results_changes();

CREATE TRIGGER calculate_event_points_trigger
  BEFORE INSERT OR UPDATE ON public.event_results
  FOR EACH ROW EXECUTE FUNCTION public.calculate_match_points();

CREATE TRIGGER trigger_ranking_update_on_event_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.event_results
  FOR EACH ROW EXECUTE FUNCTION public.trigger_ranking_update();

-- Step 7: Update get_player_ranking_summary function to use new table names
CREATE OR REPLACE FUNCTION public.get_player_ranking_summary(p_player_id uuid, p_category player_category)
RETURNS TABLE(lifetime_points integer, lifetime_rank integer, active_points integer, active_rank integer, expiring_points integer, next_expiry_date date)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH lifetime AS (
    SELECT total_points, rank 
    FROM player_rankings 
    WHERE player_id = p_player_id AND category = p_category
  ),
  active AS (
    SELECT 
      COALESCE(SUM(er.points_awarded), 0)::INTEGER as pts,
      (
        SELECT COUNT(*) + 1 
        FROM player_rankings pr2
        WHERE pr2.category = p_category 
        AND pr2.total_points > COALESCE(SUM(er.points_awarded), 0)
      )::INTEGER as rnk
    FROM event_results er
    JOIN events e ON e.id = er.event_id
    WHERE er.player_id = p_player_id 
    AND e.category = p_category
    AND e.match_date >= CURRENT_DATE - INTERVAL '12 months'
  ),
  expiring AS (
    SELECT 
      COALESCE(SUM(er.points_awarded), 0)::INTEGER as pts,
      MIN(e.match_date + INTERVAL '12 months')::DATE as next_exp
    FROM event_results er
    JOIN events e ON e.id = er.event_id
    WHERE er.player_id = p_player_id 
    AND e.category = p_category
    AND e.match_date < CURRENT_DATE - INTERVAL '11 months'
    AND e.match_date >= CURRENT_DATE - INTERVAL '12 months'
  )
  SELECT 
    COALESCE(l.total_points, 0)::INTEGER,
    COALESCE(l.rank, 999)::INTEGER,
    COALESCE(a.pts, 0)::INTEGER,
    COALESCE(a.rnk, 999)::INTEGER,
    COALESCE(e.pts, 0)::INTEGER,
    e.next_exp
  FROM lifetime l
  CROSS JOIN active a
  LEFT JOIN expiring e ON true;
END;
$$;

-- Step 8: Create backward compatibility views (temporary - for gradual migration)
CREATE OR REPLACE VIEW matches AS 
  SELECT 
    id,
    tournament_name,
    match_date,
    tier,
    category,
    created_at,
    created_by,
    import_id
  FROM events;

CREATE OR REPLACE VIEW match_results AS 
  SELECT 
    id,
    event_id as match_id,
    player_id,
    finishing_position,
    points_awarded,
    created_at
  FROM event_results;

-- Step 9: Grant permissions on new tables (same as old tables)
GRANT ALL ON events TO postgres;
GRANT ALL ON event_results TO postgres;
GRANT SELECT ON matches TO anon, authenticated;
GRANT SELECT ON match_results TO anon, authenticated;