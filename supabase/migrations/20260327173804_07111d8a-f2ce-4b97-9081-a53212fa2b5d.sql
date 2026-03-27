CREATE OR REPLACE FUNCTION public.increment_balance(p_lead_id uuid, p_amount bigint)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.leads
  SET balance_cents = balance_cents + p_amount
  WHERE id = p_lead_id
  RETURNING balance_cents;
$$;

CREATE OR REPLACE FUNCTION public.deduct_balance(p_lead_id uuid, p_amount bigint)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.leads
  SET balance_cents = balance_cents - p_amount
  WHERE id = p_lead_id AND balance_cents >= p_amount
  RETURNING balance_cents;
$$;