
DROP POLICY IF EXISTS "Authenticated users can read withdrawals" ON public.withdrawals;

CREATE POLICY "Affiliates can read own withdrawals"
ON public.withdrawals FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE affiliates.id = withdrawals.affiliate_id
    AND affiliates.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can read all withdrawals"
ON public.withdrawals FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = auth.uid() AND admins.status = 'active'
  )
);
