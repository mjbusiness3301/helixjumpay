
-- Table to track login attempts for rate limiting
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- phone or IP
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No public access - only edge function (service role) manages this
-- RLS denies all by default since no policies are added

-- Index for fast lookups
CREATE INDEX idx_login_attempts_identifier_time 
  ON public.login_attempts (identifier, attempted_at DESC);

-- Auto-cleanup old attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE attempted_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_login_attempts
  AFTER INSERT ON public.login_attempts
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_login_attempts();
