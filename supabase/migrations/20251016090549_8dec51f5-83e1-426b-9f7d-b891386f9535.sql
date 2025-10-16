-- Drop the foreign key constraint that prevents remixing
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- The table will still work fine without the foreign key constraint
-- User IDs will be validated through authentication in the application layer