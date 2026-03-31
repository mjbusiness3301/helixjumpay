INSERT INTO public.settings (key, value)
VALUES ('gateway_fee_percent', '0'), ('gateway_fee_fixed', '0')
ON CONFLICT (key) DO NOTHING;