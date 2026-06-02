import { createClient } from "@supabase/supabase-js";

// Vercel Supabase integration sets SUPABASE_URL / SUPABASE_ANON_KEY
// Also support manual NEXT_PUBLIC_* vars for flexibility
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Public client — for client-side reads (anonymous users)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — for server-side writes (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// ============================================================
// Database schema (run this in Supabase SQL Editor):
// ============================================================
/*
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT UNIQUE NOT NULL,
  email TEXT,
  free_uses_remaining INT DEFAULT 3,
  credits_remaining INT DEFAULT 0,
  subscription_status TEXT DEFAULT 'none',  -- 'none' | 'active' | 'cancelled'
  subscription_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Name generation history
CREATE TABLE name_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name_data JSONB NOT NULL,
  source_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_anonymous_id ON users(anonymous_id);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_name_history_user ON name_history(user_id, created_at DESC);

-- RLS policies (public client can only read own data)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE name_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (anonymous_id = current_setting('request.jwt.claims')::json->>'sub'
    OR anonymous_id = current_setting('request.headers')::json->>'x-anonymous-id');

-- Note: For anonymous access, we use the admin client server-side
-- so RLS is bypassed for write operations. Client reads use the
-- anonymous_id passed as a header.
*/
