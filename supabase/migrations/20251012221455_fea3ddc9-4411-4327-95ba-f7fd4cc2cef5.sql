-- Allow users to update avatar_url for their own linked player profile
CREATE POLICY "Users can update their own player avatar"
ON public.players
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT player_id 
    FROM public.player_accounts 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT player_id 
    FROM public.player_accounts 
    WHERE user_id = auth.uid()
  )
);