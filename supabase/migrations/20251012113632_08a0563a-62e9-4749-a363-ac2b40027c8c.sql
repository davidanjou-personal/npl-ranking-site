-- Create upcoming_tournaments table
CREATE TABLE public.upcoming_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_name TEXT NOT NULL,
  tournament_date DATE NOT NULL,
  registration_url TEXT NOT NULL,
  location TEXT,
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.upcoming_tournaments ENABLE ROW LEVEL SECURITY;

-- Public can view all upcoming tournaments
CREATE POLICY "Anyone can view upcoming tournaments"
  ON public.upcoming_tournaments
  FOR SELECT
  USING (true);

-- Only admins can insert upcoming tournaments
CREATE POLICY "Admins can insert upcoming tournaments"
  ON public.upcoming_tournaments
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update upcoming tournaments
CREATE POLICY "Admins can update upcoming tournaments"
  ON public.upcoming_tournaments
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete upcoming tournaments
CREATE POLICY "Admins can delete upcoming tournaments"
  ON public.upcoming_tournaments
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_upcoming_tournaments_updated_at
  BEFORE UPDATE ON public.upcoming_tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();