BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique
  ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;

ALTER TABLE bazi_users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS bazi_users_auth_user_id_unique
  ON bazi_users(auth_user_id) WHERE auth_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS processed_sales_sale_id_unique
  ON processed_sales(sale_id);
CREATE UNIQUE INDEX IF NOT EXISTS bazi_processed_sales_sale_id_unique
  ON bazi_processed_sales(sale_id);

ALTER TABLE name_reports ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS name_reports_user_name_unique
  ON name_reports(user_id, name_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('free', 'credit', 'subscriber')),
  status TEXT NOT NULL CHECK (status IN ('reserved', 'completed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION reserve_name_generation(
  p_anonymous_id TEXT,
  p_request_id TEXT
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user users%ROWTYPE;
  v_source TEXT;
BEGIN
  IF length(p_anonymous_id) < 8 OR length(p_anonymous_id) > 128 OR
     length(p_request_id) < 16 OR length(p_request_id) > 128 THEN
    RAISE EXCEPTION 'invalid_request';
  END IF;

  IF EXISTS (SELECT 1 FROM usage_ledger WHERE request_id = p_request_id) THEN
    RETURN 'already_reserved';
  END IF;

  SELECT * INTO v_user FROM users
    WHERE anonymous_id = p_anonymous_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'user_not_found'; END IF;

  IF v_user.subscription_status = 'active' AND
     (v_user.subscription_end IS NULL OR v_user.subscription_end > now()) THEN
    v_source := 'subscriber';
  ELSIF v_user.free_uses_remaining > 0 THEN
    UPDATE users SET free_uses_remaining = free_uses_remaining - 1,
      updated_at = now() WHERE id = v_user.id;
    v_source := 'free';
  ELSIF v_user.credits_remaining > 0 THEN
    UPDATE users SET credits_remaining = credits_remaining - 1,
      updated_at = now() WHERE id = v_user.id;
    v_source := 'credit';
  ELSE
    RETURN 'insufficient_balance';
  END IF;

  INSERT INTO usage_ledger(request_id, user_id, source, status)
    VALUES (p_request_id, v_user.id, v_source, 'reserved');
  RETURN 'reserved';
END;
$$;

CREATE OR REPLACE FUNCTION complete_name_generation(p_request_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE usage_ledger SET status = 'completed', updated_at = now()
    WHERE request_id = p_request_id AND status = 'reserved';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION refund_name_generation(p_request_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v usage_ledger%ROWTYPE;
BEGIN
  SELECT * INTO v FROM usage_ledger
    WHERE request_id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v.status <> 'reserved' THEN RETURN FALSE; END IF;

  IF v.source = 'free' THEN
    UPDATE users SET free_uses_remaining = free_uses_remaining + 1,
      updated_at = now() WHERE id = v.user_id;
  ELSIF v.source = 'credit' THEN
    UPDATE users SET credits_remaining = credits_remaining + 1,
      updated_at = now() WHERE id = v.user_id;
  END IF;

  UPDATE usage_ledger SET status = 'refunded', updated_at = now() WHERE id = v.id;
  RETURN TRUE;
END;
$$;

CREATE TABLE IF NOT EXISTS report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES name_reports(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION save_name_report(
  p_auth_user_id UUID,
  p_email TEXT,
  p_name_id TEXT,
  p_name_data JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user users%ROWTYPE;
BEGIN
  IF EXISTS (SELECT 1 FROM name_reports WHERE user_id = p_auth_user_id AND name_id = p_name_id) THEN
    UPDATE name_reports SET name_data = p_name_data, updated_at = now()
      WHERE user_id = p_auth_user_id AND name_id = p_name_id;
    RETURN TRUE;
  END IF;

  SELECT * INTO v_user FROM users
    WHERE auth_user_id = p_auth_user_id AND lower(email) = lower(p_email) FOR UPDATE;
  IF NOT FOUND OR coalesce(v_user.report_unlocks_remaining, 0) <= 0 THEN RETURN FALSE; END IF;

  UPDATE users SET report_unlocks_remaining = report_unlocks_remaining - 1,
    updated_at = now() WHERE id = v_user.id;
  INSERT INTO name_reports(user_id, email, name_id, name_data, created_at, updated_at)
    VALUES (p_auth_user_id, lower(p_email), p_name_id, p_name_data, now(), now());
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION get_shared_name_report(p_token TEXT)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT nr.name_data
  FROM report_shares rs
  JOIN name_reports nr ON nr.id = rs.report_id
  WHERE rs.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    AND rs.revoked_at IS NULL AND rs.expires_at > now()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION reserve_name_generation(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION complete_name_generation(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION refund_name_generation(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION save_name_report(UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_shared_name_report(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_name_generation(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION complete_name_generation(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION refund_name_generation(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION save_name_report(UUID, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_shared_name_report(TEXT) TO service_role;

COMMIT;
