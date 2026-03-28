
-- Audit logs table for sensitive admin actions
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL, -- auth.uid() of who performed the action
  actor_email TEXT,
  action TEXT NOT NULL, -- e.g. 'withdraw_approved', 'balance_changed', 'status_changed'
  target_table TEXT NOT NULL, -- e.g. 'affiliates', 'withdrawals', 'leads'
  target_id TEXT, -- ID of the affected record
  details JSONB DEFAULT '{}', -- old/new values, amounts, etc.
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Only admins can read audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.status = 'active'));

-- Insert via triggers (SECURITY DEFINER), no direct insert needed from client
-- But allow admins to insert manually if needed
CREATE POLICY "Only admins can insert audit_logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.status = 'active'));

CREATE INDEX idx_audit_logs_created ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_target ON public.audit_logs (target_table, target_id);

-- =====================================================
-- TRIGGER: Log withdrawal status changes
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_withdrawal_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, details)
    VALUES (
      auth.uid(),
      CASE NEW.status
        WHEN 'approved' THEN 'withdraw_approved'
        WHEN 'rejected' THEN 'withdraw_rejected'
        ELSE 'withdraw_status_changed'
      END,
      'withdrawals',
      NEW.id::text,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'amount', NEW.amount,
        'affiliate_id', NEW.affiliate_id,
        'affiliate_name', NEW.affiliate_name
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_withdrawal_update
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_withdrawal_update();

-- =====================================================
-- TRIGGER: Log affiliate sensitive field changes
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_affiliate_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  changes JSONB := '{}';
BEGIN
  IF OLD.balance IS DISTINCT FROM NEW.balance THEN
    changes := changes || jsonb_build_object('balance', jsonb_build_object('old', OLD.balance, 'new', NEW.balance));
  END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    changes := changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
  END IF;
  IF OLD.commission IS DISTINCT FROM NEW.commission THEN
    changes := changes || jsonb_build_object('commission', jsonb_build_object('old', OLD.commission, 'new', NEW.commission));
  END IF;

  IF changes != '{}' THEN
    INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, details)
    VALUES (
      auth.uid(),
      CASE
        WHEN OLD.balance IS DISTINCT FROM NEW.balance THEN 'balance_changed'
        WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed'
        WHEN OLD.commission IS DISTINCT FROM NEW.commission THEN 'commission_changed'
        ELSE 'affiliate_updated'
      END,
      'affiliates',
      NEW.id::text,
      jsonb_build_object('affiliate_name', NEW.name, 'changes', changes)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_affiliate_update
  AFTER UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_affiliate_update();

-- =====================================================
-- TRIGGER: Log lead balance changes
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_lead_balance_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.balance_cents IS DISTINCT FROM NEW.balance_cents THEN
    INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, details)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'lead_balance_changed',
      'leads',
      NEW.id::text,
      jsonb_build_object(
        'lead_name', NEW.name,
        'old_balance', OLD.balance_cents,
        'new_balance', NEW.balance_cents,
        'diff', NEW.balance_cents - OLD.balance_cents
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_lead_balance
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_lead_balance_update();

-- =====================================================
-- TRIGGER: Log admin status changes
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_admin_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, details)
    VALUES (
      auth.uid(),
      'admin_status_changed',
      'admins',
      NEW.id::text,
      jsonb_build_object('name', NEW.name, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_admin_update
  AFTER UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_update();
