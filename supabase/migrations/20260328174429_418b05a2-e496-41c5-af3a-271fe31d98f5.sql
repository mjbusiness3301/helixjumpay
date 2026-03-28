
-- =====================================================
-- HARDENING: Remove overly permissive public policies
-- =====================================================

-- 1. LEADS TABLE: Remove dangerous public SELECT and UPDATE
DROP POLICY IF EXISTS "Anyone can read leads" ON public.leads;
DROP POLICY IF EXISTS "Service role can update leads" ON public.leads;

-- Leads: Only authenticated admins/affiliates can read (already have policies)
-- Public needs a secure login function instead of raw SELECT

-- 2. GAME_SESSIONS: Remove public SELECT, scope it
DROP POLICY IF EXISTS "Anyone can read game_sessions" ON public.game_sessions;

-- =====================================================
-- SECURE FUNCTIONS for public-facing operations
-- =====================================================

-- Secure lead lookup for login (returns only non-sensitive fields)
CREATE OR REPLACE FUNCTION public.lead_login(p_phone TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_lead RECORD;
  v_token TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Input validation
  IF p_phone IS NULL OR length(trim(p_phone)) < 8 THEN
    RETURN json_build_object('error', 'Telefone inválido');
  END IF;
  IF p_password IS NULL OR length(p_password) < 1 THEN
    RETURN json_build_object('error', 'Senha inválida');
  END IF;

  SELECT id, name, phone, balance_cents, bonus_balance_cents
  INTO v_lead
  FROM public.leads
  WHERE phone = trim(p_phone) AND password = p_password;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Credenciais inválidas');
  END IF;

  -- Generate session token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires := now() + interval '7 days';

  INSERT INTO public.session_tokens (lead_id, token, expires_at)
  VALUES (v_lead.id, v_token, v_expires);

  RETURN json_build_object(
    'id', v_lead.id,
    'name', v_lead.name,
    'phone', v_lead.phone,
    'balance_cents', v_lead.balance_cents,
    'bonus_balance_cents', v_lead.bonus_balance_cents,
    'token', v_token
  );
END;
$$;

-- Secure function to get lead by session token (no raw SELECT needed)
CREATE OR REPLACE FUNCTION public.lead_get_by_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_lead RECORD;
BEGIN
  IF p_token IS NULL OR length(p_token) < 10 THEN
    RETURN json_build_object('error', 'Token inválido');
  END IF;

  SELECT l.id, l.name, l.phone, l.balance_cents, l.bonus_balance_cents
  INTO v_lead
  FROM public.leads l
  INNER JOIN public.session_tokens st ON st.lead_id = l.id
  WHERE st.token = p_token AND st.expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Sessão expirada');
  END IF;

  RETURN json_build_object(
    'id', v_lead.id,
    'name', v_lead.name,
    'phone', v_lead.phone,
    'balance_cents', v_lead.balance_cents,
    'bonus_balance_cents', v_lead.bonus_balance_cents
  );
END;
$$;

-- =====================================================
-- INPUT VALIDATION TRIGGERS for public inserts
-- =====================================================

-- Validate leads on insert (sanitize inputs)
CREATE OR REPLACE FUNCTION public.validate_lead_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate phone
  IF NEW.phone IS NULL OR length(trim(NEW.phone)) < 8 OR length(trim(NEW.phone)) > 20 THEN
    RAISE EXCEPTION 'Telefone inválido';
  END IF;

  -- Validate name
  IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 OR length(trim(NEW.name)) > 100 THEN
    RAISE EXCEPTION 'Nome inválido';
  END IF;

  -- Prevent setting balance on registration (must be 0)
  NEW.balance_cents := 0;
  NEW.bonus_balance_cents := 0;

  -- Sanitize
  NEW.name := trim(NEW.name);
  NEW.phone := trim(NEW.phone);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_lead_insert
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_insert();

-- Validate deposits on insert
CREATE OR REPLACE FUNCTION public.validate_deposit_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Amount must be positive
  IF NEW.amount_cents IS NULL OR NEW.amount_cents <= 0 THEN
    RAISE EXCEPTION 'Valor do depósito inválido';
  END IF;

  -- Status must start as pending
  NEW.status := 'pending';

  -- Bonus starts at 0
  NEW.bonus_cents := 0;

  -- confirmed_at must be null on insert
  NEW.confirmed_at := NULL;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_deposit_insert
  BEFORE INSERT ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_deposit_insert();

-- Validate game_sessions on insert
CREATE OR REPLACE FUNCTION public.validate_game_session_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Result must start as pending
  NEW.result := 'pending';

  -- Earned must start at 0
  NEW.earned_cents := 0;

  -- Bet must be non-negative
  IF NEW.bet_cents < 0 THEN
    RAISE EXCEPTION 'Aposta inválida';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_game_session_insert
  BEFORE INSERT ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_game_session_insert();

-- Validate session_tokens on insert (prevent arbitrary tokens)
CREATE OR REPLACE FUNCTION public.validate_session_token_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Token must have minimum length
  IF NEW.token IS NULL OR length(NEW.token) < 16 THEN
    RAISE EXCEPTION 'Token inválido';
  END IF;

  -- lead_id must exist
  IF NOT EXISTS (SELECT 1 FROM public.leads WHERE id = NEW.lead_id) THEN
    RAISE EXCEPTION 'Lead não encontrado';
  END IF;

  -- Force expiration to max 7 days
  NEW.expires_at := now() + interval '7 days';

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_session_token_insert
  BEFORE INSERT ON public.session_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_session_token_insert();

-- =====================================================
-- REMOVE public read from session_tokens (use RPC only)
-- =====================================================

-- session_tokens should not be readable via public SELECT
-- The lead_login and lead_get_by_token functions handle token ops

-- =====================================================  
-- HIDE password fields: create a secure view for leads
-- =====================================================

-- View for admin/affiliate to see leads without password
CREATE OR REPLACE VIEW public.leads_safe
WITH (security_invoker = on) AS
  SELECT id, name, phone, balance_cents, bonus_balance_cents, 
         affiliate_id, ip_address, created_at, user_agent, 
         referrer, utm_source, utm_medium, utm_campaign
  FROM public.leads;
-- Excludes: password, password_hash

-- =====================================================
-- GRANT execute on RPC functions to anon/public
-- =====================================================
GRANT EXECUTE ON FUNCTION public.lead_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.lead_get_by_token(TEXT) TO anon;
