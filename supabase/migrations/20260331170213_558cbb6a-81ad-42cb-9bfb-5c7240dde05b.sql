-- Add pending_balance to affiliates
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS pending_balance numeric NOT NULL DEFAULT 0;

-- Create affiliate_commissions table
CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  deposit_id uuid REFERENCES public.deposits(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  status text NOT NULL DEFAULT 'pending',
  released_at timestamptz
);

-- RLS
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all commissions"
ON public.affiliate_commissions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Affiliates can read own commissions"
ON public.affiliate_commissions FOR SELECT TO authenticated
USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- Trigger: when deposit is confirmed, create commission and add to pending_balance
CREATE OR REPLACE FUNCTION public.create_affiliate_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affiliate_id uuid;
  v_commission_rate numeric;
  v_commission_amount numeric;
BEGIN
  -- Only on confirmation
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status <> 'confirmed') AND NEW.lead_id IS NOT NULL THEN
    -- Find affiliate via lead
    SELECT l.affiliate_id INTO v_affiliate_id
    FROM public.leads l
    WHERE l.id = NEW.lead_id;

    IF v_affiliate_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get commission rate
    SELECT commission INTO v_commission_rate
    FROM public.affiliates
    WHERE id = v_affiliate_id;

    IF v_commission_rate IS NULL OR v_commission_rate <= 0 THEN
      RETURN NEW;
    END IF;

    -- Calculate commission (commission is stored as percentage, amount_cents in cents)
    v_commission_amount := (NEW.amount_cents * v_commission_rate / 100.0);

    -- Create commission record
    INSERT INTO public.affiliate_commissions (affiliate_id, deposit_id, amount, available_at)
    VALUES (v_affiliate_id, NEW.id, v_commission_amount, now() + interval '24 hours');

    -- Add to pending_balance
    UPDATE public.affiliates
    SET pending_balance = pending_balance + v_commission_amount
    WHERE id = v_affiliate_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_affiliate_commission
AFTER UPDATE ON public.deposits
FOR EACH ROW
EXECUTE FUNCTION public.create_affiliate_commission();