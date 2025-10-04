-- Drop the overly permissive policy on profiles table
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that only allows users to view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Drop the overly permissive policy on user_roles table
DROP POLICY IF EXISTS "User roles are viewable by authenticated users" ON public.user_roles;

-- Create a new policy that only allows users to view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);