-- Add DELETE policy for admins on import_history table
CREATE POLICY "Admins can delete import history"
ON public.import_history
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));