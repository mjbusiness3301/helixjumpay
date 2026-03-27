-- Trigger: log registration when a new lead is inserted
CREATE OR REPLACE FUNCTION public.log_lead_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (event_type, affiliate_id, created_at)
  VALUES ('registration', NEW.affiliate_id, NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_lead_registration
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_registration();

-- Trigger: log deposit when status changes to confirmed
CREATE OR REPLACE FUNCTION public.log_deposit_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id uuid;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status <> 'confirmed') THEN
    -- Find affiliate via lead
    SELECT affiliate_id INTO v_affiliate_id
    FROM public.leads
    WHERE id = NEW.lead_id;

    INSERT INTO public.activity_logs (event_type, affiliate_id, amount, created_at)
    VALUES ('deposit', v_affiliate_id, NEW.amount_cents, COALESCE(NEW.confirmed_at, now()));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_deposit_confirmed
  AFTER INSERT OR UPDATE ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deposit_confirmed();

-- Backfill: insert activity_logs for existing leads
INSERT INTO public.activity_logs (event_type, affiliate_id, created_at)
SELECT 'registration', affiliate_id, created_at
FROM public.leads;

-- Backfill: insert activity_logs for existing confirmed deposits
INSERT INTO public.activity_logs (event_type, affiliate_id, amount, created_at)
SELECT 'deposit', l.affiliate_id, d.amount_cents, COALESCE(d.confirmed_at, d.created_at)
FROM public.deposits d
LEFT JOIN public.leads l ON l.id = d.lead_id
WHERE d.status = 'confirmed';