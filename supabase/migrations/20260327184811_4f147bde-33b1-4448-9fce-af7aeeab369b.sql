
-- Update display_id to be random 5-digit numbers instead of sequential
-- First, update existing rows with random 5-digit values
DO $$
DECLARE
  r RECORD;
  new_id INTEGER;
  done BOOLEAN;
BEGIN
  FOR r IN SELECT id FROM public.affiliates ORDER BY created_at ASC LOOP
    done := FALSE;
    WHILE NOT done LOOP
      new_id := floor(random() * 90000 + 10000)::integer;
      BEGIN
        UPDATE public.affiliates SET display_id = new_id WHERE id = r.id;
        done := TRUE;
      EXCEPTION WHEN unique_violation THEN
        done := FALSE;
      END;
    END LOOP;
  END LOOP;
END $$;

-- Create a trigger to auto-generate random 5-digit display_id for new affiliates
CREATE OR REPLACE FUNCTION public.generate_affiliate_display_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_id INTEGER;
  done BOOLEAN;
BEGIN
  IF NEW.display_id IS NOT NULL AND NEW.display_id >= 10000 THEN
    RETURN NEW;
  END IF;
  done := FALSE;
  WHILE NOT done LOOP
    new_id := floor(random() * 90000 + 10000)::integer;
    BEGIN
      NEW.display_id := new_id;
      done := TRUE;
    EXCEPTION WHEN unique_violation THEN
      done := FALSE;
    END;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_display_id
  BEFORE INSERT ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_affiliate_display_id();
