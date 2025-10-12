-- Allow users to view their own linked player record
CREATE POLICY "Users can view their own player profile"
ON public.players
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT player_id 
    FROM public.player_accounts 
    WHERE user_id = auth.uid()
  )
);