-- Create enum for roles if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add DELETE policy for user_roles to allow admins to revoke roles
CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.create_audit_log(
  _action text,
  _table_name text,
  _record_id uuid,
  _old_data jsonb DEFAULT NULL,
  _new_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), _action, _table_name, _record_id, _old_data, _new_data);
END;
$$;

-- Trigger function for players table
CREATE OR REPLACE FUNCTION public.audit_players_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.create_audit_log(
      'INSERT',
      'players',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM public.create_audit_log(
      'UPDATE',
      'players',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.create_audit_log(
      'DELETE',
      'players',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
END;
$$;

-- Trigger function for match_results table
CREATE OR REPLACE FUNCTION public.audit_match_results_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.create_audit_log(
      'INSERT',
      'match_results',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM public.create_audit_log(
      'UPDATE',
      'match_results',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.create_audit_log(
      'DELETE',
      'match_results',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
END;
$$;

-- Trigger function for matches table
CREATE OR REPLACE FUNCTION public.audit_matches_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.create_audit_log(
      'INSERT',
      'matches',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM public.create_audit_log(
      'UPDATE',
      'matches',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.create_audit_log(
      'DELETE',
      'matches',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
END;
$$;

-- Create triggers for players table
CREATE TRIGGER audit_players_insert_trigger
  AFTER INSERT ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_players_changes();

CREATE TRIGGER audit_players_update_trigger
  AFTER UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_players_changes();

CREATE TRIGGER audit_players_delete_trigger
  AFTER DELETE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_players_changes();

-- Create triggers for match_results table
CREATE TRIGGER audit_match_results_insert_trigger
  AFTER INSERT ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_match_results_changes();

CREATE TRIGGER audit_match_results_update_trigger
  AFTER UPDATE ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_match_results_changes();

CREATE TRIGGER audit_match_results_delete_trigger
  AFTER DELETE ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_match_results_changes();

-- Create triggers for matches table
CREATE TRIGGER audit_matches_insert_trigger
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_matches_changes();

CREATE TRIGGER audit_matches_update_trigger
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_matches_changes();

CREATE TRIGGER audit_matches_delete_trigger
  AFTER DELETE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_matches_changes();

-- Create index for efficient audit log queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);