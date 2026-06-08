import { NextResponse } from "next/server";

// One-time migration: create claim_tokens table for secure claim flow
export async function GET() {
  const { supabaseAdmin } = await import("@/lib/supabase");

  const sql = `
    CREATE TABLE IF NOT EXISTS claim_tokens (
      id BIGSERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      name_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      email TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      claimed_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_claim_tokens_token ON claim_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_claim_tokens_name_status ON claim_tokens(name_id, status);
  `;

  // Execute via RPC since we can't run raw SQL directly
  const { error } = await supabaseAdmin.rpc("exec_sql", { sql_text: sql }).maybeSingle();

  // Fallback: try direct approach if RPC doesn't exist
  if (error) {
    // Try inserting a test row to see if table already exists
    const { error: testErr } = await supabaseAdmin
      .from("claim_tokens")
      .select("id")
      .limit(1);

    if (testErr) {
      return NextResponse.json({
        status: "need_manual",
        error: testErr.message,
        sql,
        hint: "Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql",
      });
    }
    return NextResponse.json({ status: "exists" });
  }

  return NextResponse.json({ status: "created" });
}
