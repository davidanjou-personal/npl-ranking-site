-- Insert admin role for current user (david@nplpickleball.com.au)
INSERT INTO public.user_roles (user_id, role)
VALUES ('957533de-fbec-417b-9e8a-dc15f0031825', 'admin');

-- Add RLS policy for admins to insert user roles (enables future admin management)
CREATE POLICY "Admins can insert user roles" 
ON public.user_roles
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));