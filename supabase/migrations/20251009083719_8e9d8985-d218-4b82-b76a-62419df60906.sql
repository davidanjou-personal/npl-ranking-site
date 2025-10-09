-- Create helper to safely get current user id, even when no JWT context
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  uid uuid;
  claims json;
BEGIN
  -- Try standard auth.uid()
  BEGIN
    uid := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    uid := NULL;
  END;
  IF uid IS NOT NULL THEN
    RETURN uid;
  END IF;

  -- Fallback to JWT claims if available
  BEGIN
    claims := current_setting('request.jwt.claims', true)::json;
    IF claims ? 'sub' THEN
      uid := (claims->>'sub')::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    uid := NULL;
  END;
  
  -- Final fallback: system user sentinel UUID
  RETURN COALESCE(uid, '00000000-0000-0000-0000-000000000000'::uuid);
END;
$$;

-- Update audit logger to use safe user id
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
SET search_path = 'public'
AS $$
DECLARE
  actor uuid;
BEGIN
  actor := public.get_current_user_id();
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (actor, _action, _table_name, _record_id, _old_data, _new_data);
END;
$$;