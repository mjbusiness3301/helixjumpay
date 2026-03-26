
ALTER TABLE public.leads ADD COLUMN affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL DEFAULT NULL;

CREATE INDEX idx_leads_affiliate_id ON public.leads(affiliate_id);
