import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/db-test
 * Direct database write test.
 */
export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check if users table exists and has rows
  const { data: rows, error: selectErr } = await supabaseAdmin
    .from("users")
    .select("id, anonymous_id, free_uses_remaining")
    .limit(5);
  results.select = selectErr
    ? { error: selectErr.message }
    : { count: rows?.length || 0, sample: rows?.[0] || null };

  // 2. Try INSERT with service_role
  const testId = "dbtest_" + Date.now();
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("users")
    .insert({
      anonymous_id: testId,
      free_uses_remaining: 999,
      credits_remaining: 0,
      subscription_status: "none",
    })
    .select("id, anonymous_id")
    .single();

  results.insert = insertErr
    ? { error: insertErr.message, code: (insertErr as unknown as Record<string, unknown>).code }
    : { ok: true, id: inserted?.id };

  // 3. Clean up test row
  if (inserted?.id) {
    const { error: delErr } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", inserted.id);
    results.cleanup = delErr ? { error: delErr.message } : { ok: true };
  }

  // 4. Check RLS state
  const { data: rlsInfo } = await supabaseAdmin.rpc("check_rls", {
    table_name: "users",
  }).maybeSingle();
  results.rls = rlsInfo || { note: "rls check not available" };

  return NextResponse.json(results);
}
