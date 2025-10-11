-- Add UPDATE policy for admins on import_history table
CREATE POLICY "Admins can update import history"
ON public.import_history
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));