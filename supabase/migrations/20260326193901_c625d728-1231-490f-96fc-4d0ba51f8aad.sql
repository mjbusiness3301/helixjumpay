
-- =============================================
-- COMPREHENSIVE SECURITY FIX
-- =============================================

-- 1. FIX DEPOSITS TABLE: restrict SELECT/UPDATE to authenticated only
DROP POLICY IF EXISTS "Anyone can read deposits" ON public.deposits;
DROP POLICY IF EXISTS "Anyone can update deposits" ON public.deposits;

CREATE POLICY "Authenticated users can read deposits"
ON public.deposits FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Only admins can update deposits"
ON public.deposits FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid() AND admins.status = 'active')
);

-- 2. FIX WITHDRAWALS TABLE: restrict INSERT to own affiliate, UPDATE to admins only
DROP POLICY IF EXISTS "Authenticated users can insert withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Authenticated users can update withdrawals" ON public.withdrawals;

CREATE POLICY "Affiliates can insert own withdrawals"
ON public.withdrawals FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE affiliates.id = affiliate_id
    AND affiliates.user_id = auth.uid()
  )
);

CREATE POLICY "Only admins can update withdrawals"
ON public.withdrawals FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid() AND admins.status = 'active')
);

-- 3. FIX AFFILIATES UPDATE: allow admins too
DROP POLICY IF EXISTS "Affiliates can update own record" ON public.affiliates;

CREATE POLICY "Affiliates or admins can update affiliates"
ON public.affiliates FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid() AND admins.status = 'active')
);

-- 4. FIX SECURITY DEFINER VIEWS: recreate without security_invoker = false
DROP VIEW IF EXISTS public.leads_with_deposits;
DROP VIEW IF EXISTS public.recent_deposits;

CREATE VIEW public.leads_with_deposits
WITH (security_invoker = true)
AS
SELECT l.id,
    l.name,
    l.phone,
    l.created_at AS registered_at,
    count(d.id) AS total_deposits,
    count(d.id) FILTER (WHERE d.status = 'pending') AS pending_deposits,
    count(d.id) FILTER (WHERE d.status = 'confirmed') AS confirmed_deposits,
    COALESCE(sum(d.amount_cents) FILTER (WHERE d.status = 'confirmed'), 0::numeric) AS total_deposited_cents,
    COALESCE(sum(d.amount_cents) FILTER (WHERE d.status = 'pending'), 0::numeric) AS total_pending_cents
FROM leads l
LEFT JOIN deposits d ON d.lead_id = l.id
GROUP BY l.id, l.name, l.phone, l.created_at
ORDER BY l.created_at DESC;

CREATE VIEW public.recent_deposits
WITH (security_invoker = true)
AS
SELECT id, lead_name, lead_phone, amount_cents, status, created_at, confirmed_at
FROM deposits d
ORDER BY created_at DESC
LIMIT 50;

-- 5. FIX ACTIVITY_LOGS INSERT: restrict to admins/affiliates only (not any authenticated user)
DROP POLICY IF EXISTS "Authenticated users can insert activity_logs" ON public.activity_logs;

CREATE POLICY "Only admins can insert activity_logs"
ON public.activity_logs FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.user_id = auth.uid())
);

-- 6. FIX GAME_SESSIONS UPDATE: restrict to admins only
DROP POLICY IF EXISTS "Authenticated users can update game_sessions" ON public.game_sessions;

CREATE POLICY "Only admins can update game_sessions"
ON public.game_sessions FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid() AND admins.status = 'active')
);

-- 7. FIX generate_affiliate_ref_code function search_path
CREATE OR REPLACE FUNCTION public.generate_affiliate_ref_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
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
$function$;
