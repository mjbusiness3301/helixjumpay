
CREATE OR REPLACE FUNCTION public.set_lead_affiliate_from_referrer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if affiliate_id is already set or referrer is null
  IF NEW.affiliate_id IS NOT NULL OR NEW.referrer IS NULL THEN
    RETURN NEW;
  END IF;

  -- Try matching referrer directly as affiliate ID (uuid)
  BEGIN
    SELECT id INTO NEW.affiliate_id
    FROM public.affiliates
    WHERE id = NEW.referrer::uuid
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- referrer is not a valid uuid, try extracting from URL query param ?ref=<id>
    BEGIN
      SELECT id INTO NEW.affiliate_id
      FROM public.affiliates
      WHERE id = (
        regexp_match(NEW.referrer, '[?&]ref=([0-9a-f\-]{36})')
      )[1]::uuid
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_lead_affiliate
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_affiliate_from_referrer();
