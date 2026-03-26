
-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert affiliates" ON public.affiliates;

-- Create a restrictive INSERT policy: only admins can insert affiliates
CREATE POLICY "Only admins can insert affiliates"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = auth.uid()
    AND admins.status = 'active'
  )
);
