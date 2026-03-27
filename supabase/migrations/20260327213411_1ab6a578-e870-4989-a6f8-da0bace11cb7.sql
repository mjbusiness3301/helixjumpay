-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- 1. SESSION_TOKENS: Add missing RLS policies
ALTER TABLE public.session_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert session_tokens"
  ON public.session_tokens FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "Admins can read session_tokens"
  ON public.session_tokens FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Only admins can delete session_tokens"
  ON public.session_tokens FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

-- 2. LEADS: Restrict visibility — affiliates see only their own leads
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;

CREATE POLICY "Admins can read all leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Affiliates can read own leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE affiliates.user_id = auth.uid()
    )
  );

-- 3. DEPOSITS: Restrict visibility — affiliates see only deposits from their leads
DROP POLICY IF EXISTS "Authenticated users can read deposits" ON public.deposits;

CREATE POLICY "Admins can read all deposits"
  ON public.deposits FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Affiliates can read deposits from own leads"
  ON public.deposits FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE leads.affiliate_id IN (
        SELECT aff.id FROM affiliates aff WHERE aff.user_id = auth.uid()
      )
    )
  );

-- 4. AFFILIATES: Prevent self-modification of sensitive fields (commission, balance, status)
CREATE OR REPLACE FUNCTION public.protect_affiliate_sensitive_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.status = 'active'
  ) INTO is_admin;

  IF NOT is_admin THEN
    NEW.commission := OLD.commission;
    NEW.balance := OLD.balance;
    NEW.status := OLD.status;
    NEW.total_registrations := OLD.total_registrations;
    NEW.total_deposits := OLD.total_deposits;
    NEW.deposit_value := OLD.deposit_value;
    NEW.display_id := OLD.display_id;
    NEW.ref_code := OLD.ref_code;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_affiliate_fields
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_affiliate_sensitive_fields();

-- 5. WITHDRAWALS: Validate withdrawal amount
CREATE OR REPLACE FUNCTION public.validate_withdrawal_amount()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT balance INTO v_balance
  FROM affiliates
  WHERE id = NEW.affiliate_id;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Afiliado não encontrado';
  END IF;

  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'O valor do saque deve ser maior que zero';
  END IF;

  IF NEW.amount > v_balance THEN
    RAISE EXCEPTION 'Saldo insuficiente para este saque';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_withdrawal
  BEFORE INSERT ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_withdrawal_amount();

-- 6. ACTIVITY_LOGS: Restrict visibility
DROP POLICY IF EXISTS "Authenticated users can read activity_logs" ON public.activity_logs;

CREATE POLICY "Admins can read all activity_logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Affiliates can read own activity_logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE affiliates.user_id = auth.uid()
    )
  );

-- 7. AFFILIATES: Restrict visibility — affiliates see only their own record
DROP POLICY IF EXISTS "Authenticated users can read affiliates" ON public.affiliates;

CREATE POLICY "Admins can read all affiliates"
  ON public.affiliates FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Affiliates can read own record"
  ON public.affiliates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 8. Constraints
ALTER TABLE public.affiliates ADD CONSTRAINT affiliates_balance_non_negative
  CHECK (balance >= 0);

ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_amount_positive
  CHECK (amount > 0);