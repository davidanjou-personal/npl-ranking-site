-- One-time cleanup: Link orphaned matches to their import_history records
-- This finds the import_history record created closest in time to each orphaned match
UPDATE matches m
SET import_id = (
  SELECT ih.id
  FROM import_history ih
  WHERE ih.created_at >= m.created_at - interval '1 hour'
    AND ih.created_at <= m.created_at + interval '1 hour'
  ORDER BY ABS(EXTRACT(EPOCH FROM (ih.created_at - m.created_at)))
  LIMIT 1
)
WHERE m.import_id IS NULL;