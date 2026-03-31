-- Function to atomically move pending to available balance
CREATE OR REPLACE FUNCTION public.release_commission(p_affiliate_id uuid, p_amount numeric)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.affiliates
  SET balance = balance + p_amount,
      pending_balance = pending_balance - p_amount
  WHERE id = p_affiliate_id;
$$;

-- Enable extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;