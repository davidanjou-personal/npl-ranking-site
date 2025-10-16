-- Fix user_roles foreign key to reference profiles instead of auth.users
-- This prevents foreign key constraint violations when users are created

-- Drop the existing foreign key constraint
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Add new foreign key constraint referencing profiles table
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;