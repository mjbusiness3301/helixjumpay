CREATE POLICY "Admins can insert admins"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.status = 'active'
  )
);