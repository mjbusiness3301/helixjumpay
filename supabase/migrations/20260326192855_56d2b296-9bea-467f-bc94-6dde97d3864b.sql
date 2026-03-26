
-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Service role can read leads" ON public.leads;

-- Only authenticated users can read leads
CREATE POLICY "Authenticated users can read leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);
