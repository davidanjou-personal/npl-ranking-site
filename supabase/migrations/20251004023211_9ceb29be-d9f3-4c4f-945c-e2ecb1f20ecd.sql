-- Create enum for player categories
CREATE TYPE player_category AS ENUM ('mens_singles', 'womens_singles', 'mens_doubles', 'womens_doubles', 'mixed_doubles');

-- Create enum for match results
CREATE TYPE match_result AS ENUM ('win', 'loss');

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('admin', 'user');

-- Create players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  category player_category NOT NULL,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_name TEXT NOT NULL,
  match_date DATE NOT NULL,
  category player_category NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create match results table
CREATE TABLE public.match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  result match_result NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players (public read, admin write)
CREATE POLICY "Players are viewable by everyone"
  ON public.players FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert players"
  ON public.players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update players"
  ON public.players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for matches (public read, admin write)
CREATE POLICY "Matches are viewable by everyone"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create matches"
  ON public.matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for match results (public read, admin write)
CREATE POLICY "Match results are viewable by everyone"
  ON public.match_results FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create match results"
  ON public.match_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user roles
CREATE POLICY "User roles are viewable by authenticated users"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

-- Trigger to call handle_new_user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update player rankings based on total points
CREATE OR REPLACE FUNCTION public.update_player_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update rankings for each category
  WITH ranked_players AS (
    SELECT
      id,
      category,
      ROW_NUMBER() OVER (PARTITION BY category ORDER BY total_points DESC, name ASC) as new_rank
    FROM public.players
  )
  UPDATE public.players p
  SET rank = rp.new_rank,
      updated_at = now()
  FROM ranked_players rp
  WHERE p.id = rp.id;
END;
$$;

-- Function to calculate and award points after match result
CREATE OR REPLACE FUNCTION public.calculate_match_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award points: 100 for win, 0 for loss
  NEW.points_awarded := CASE
    WHEN NEW.result = 'win' THEN 100
    ELSE 0
  END;
  
  -- Update player total points
  UPDATE public.players
  SET total_points = total_points + NEW.points_awarded,
      updated_at = now()
  WHERE id = NEW.player_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to calculate points on match result insert
CREATE TRIGGER calculate_points_on_result
  BEFORE INSERT ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.calculate_match_points();

-- Trigger to update rankings after match result insert
CREATE OR REPLACE FUNCTION public.trigger_ranking_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_player_rankings();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_rankings_after_result
  AFTER INSERT ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.trigger_ranking_update();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers for players and profiles
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();