-- Normalize function security: keep has_role as DEFINER, set others to INVOKER (temporary)
-- Revert after remix success if needed

ALTER FUNCTION public.audit_events_changes() SECURITY INVOKER;
ALTER FUNCTION public.audit_event_results_changes() SECURITY INVOKER;
ALTER FUNCTION public.merge_players(primary_player_id uuid, duplicate_player_id uuid) SECURITY INVOKER;
ALTER FUNCTION public.generate_player_code() SECURITY INVOKER;
ALTER FUNCTION public.ensure_player_code() SECURITY INVOKER;
ALTER FUNCTION public.calculate_match_points() SECURITY INVOKER;
ALTER FUNCTION public.handle_new_user() SECURITY INVOKER;
ALTER FUNCTION public.trigger_ranking_update() SECURITY INVOKER;
ALTER FUNCTION public.audit_players_changes() SECURITY INVOKER;
ALTER FUNCTION public.create_audit_log(_action text, _table_name text, _record_id uuid, _old_data jsonb, _new_data jsonb) SECURITY INVOKER;
ALTER FUNCTION public.update_player_rankings() SECURITY INVOKER;
ALTER FUNCTION public.audit_match_results_changes() SECURITY INVOKER;
ALTER FUNCTION public.audit_matches_changes() SECURITY INVOKER;
ALTER FUNCTION public.get_player_ranking_summary(p_player_id uuid, p_category player_category) SECURITY INVOKER;
ALTER FUNCTION public.get_current_user_id() SECURITY INVOKER;
ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER;
-- keep role checker as definer
ALTER FUNCTION public.has_role(_user_id uuid, _role app_role) SECURITY DEFINER;