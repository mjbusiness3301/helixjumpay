-- Settings table for admin-configurable key-value pairs
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings
CREATE POLICY "Anyone authenticated can read settings"
  ON public.settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert settings
CREATE POLICY "Only admins can insert settings"
  ON public.settings FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.status = 'active'));

-- Only admins can update settings
CREATE POLICY "Only admins can update settings"
  ON public.settings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid() AND admins.status = 'active'));

-- Seed default WhatsApp link entry
INSERT INTO public.settings (key, value) VALUES ('whatsapp_group_link', '');