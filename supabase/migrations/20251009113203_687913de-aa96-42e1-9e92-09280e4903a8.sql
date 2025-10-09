-- Create storage bucket for player avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-avatars',
  'player-avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Allow public viewing of avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-avatars');

-- Allow admins to upload avatars
CREATE POLICY "Admins can upload player avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'player-avatars' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update avatars
CREATE POLICY "Admins can update player avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'player-avatars'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete avatars
CREATE POLICY "Admins can delete player avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'player-avatars'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add avatar_url column to players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;