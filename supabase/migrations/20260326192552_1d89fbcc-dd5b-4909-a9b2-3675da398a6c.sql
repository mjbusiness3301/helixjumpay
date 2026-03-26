
-- Drop the existing permissive UPDATE policy
DROP POLICY IF EXISTS "Anyone can update game_sessions" ON public.game_sessions;

-- Only authenticated users (admins) can update game sessions
CREATE POLICY "Authenticated users can update game_sessions"
ON public.game_sessions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
