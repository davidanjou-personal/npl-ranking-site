-- Allow admins to delete player rankings
CREATE POLICY "Admins can delete player rankings"
ON public.player_rankings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));