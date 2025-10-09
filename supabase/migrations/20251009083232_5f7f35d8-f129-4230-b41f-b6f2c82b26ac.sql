-- Add DELETE policies for admin users

-- Allow admins to delete matches
CREATE POLICY "Admins can delete matches"
ON public.matches
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete match results
CREATE POLICY "Admins can delete match results"
ON public.match_results
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete players
CREATE POLICY "Admins can delete players"
ON public.players
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update matches (for future edits)
CREATE POLICY "Admins can update matches"
ON public.matches
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update match results
CREATE POLICY "Admins can update match results"
ON public.match_results
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));