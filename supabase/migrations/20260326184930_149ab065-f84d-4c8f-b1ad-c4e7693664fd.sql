
-- Add ref_code column
ALTER TABLE public.affiliates ADD COLUMN ref_code text UNIQUE;

-- Function to generate random 5-char alphanumeric code
CREATE OR REPLACE FUNCTION public.generate_affiliate_ref_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  done bool;
BEGIN
  done := false;
  WHILE NOT done LOOP
    new_code := upper(substr(md5(random()::text), 1, 5));
    BEGIN
      NEW.ref_code := new_code;
      done := true;
    EXCEPTION WHEN unique_violation THEN
      done := false;
    END;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate ref_code on insert
CREATE TRIGGER trg_generate_ref_code
  BEFORE INSERT ON public.affiliates
  FOR EACH ROW
  WHEN (NEW.ref_code IS NULL)
  EXECUTE FUNCTION public.generate_affiliate_ref_code();

-- Backfill existing affiliates
UPDATE public.affiliates SET ref_code = upper(substr(md5(id::text), 1, 5)) WHERE ref_code IS NULL;

-- Update the referrer matching function to also match ref_code
CREATE OR REPLACE FUNCTION public.set_lead_affiliate_from_referrer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.affiliate_id IS NOT NULL OR NEW.referrer IS NULL THEN
    RETURN NEW;
  END IF;

  -- Try matching ref_code first (short code)
  SELECT id INTO NEW.affiliate_id
  FROM public.affiliates
  WHERE ref_code = upper(trim(NEW.referrer))
  LIMIT 1;

  IF NEW.affiliate_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Try matching referrer as UUID
  BEGIN
    SELECT id INTO NEW.affiliate_id
    FROM public.affiliates
    WHERE id = NEW.referrer::uuid
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- Try extracting from URL query param ?ref=<code>
    BEGIN
      SELECT id INTO NEW.affiliate_id
      FROM public.affiliates
      WHERE ref_code = upper((regexp_match(NEW.referrer, '[?&]ref=([A-Za-z0-9]{3,5})'))[1])
      LIMIT 1;

      IF NEW.affiliate_id IS NULL THEN
        SELECT id INTO NEW.affiliate_id
        FROM public.affiliates
        WHERE id = (regexp_match(NEW.referrer, '[?&]ref=([0-9a-f\-]{36})'))[1]::uuid
        LIMIT 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;

  RETURN NEW;
END;
$function$;
