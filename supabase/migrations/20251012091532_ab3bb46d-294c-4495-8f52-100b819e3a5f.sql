-- Add visibility control to events table
-- This allows admins to hide certain events from public view (e.g., test data, incomplete tournaments)

ALTER TABLE public.events 
ADD COLUMN is_public boolean NOT NULL DEFAULT true;

-- Add index for better query performance
CREATE INDEX idx_events_is_public ON public.events(is_public);

-- Add comment to document the column
COMMENT ON COLUMN public.events.is_public IS 'Controls whether this event is visible on the public tournaments page. Admins can always see all events.';