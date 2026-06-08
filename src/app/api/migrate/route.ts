import { NextResponse } from "next/server";

// One-time migration: add daily tracking columns
export async function GET() {
  // Dynamic import to avoid build-time Supabase connection
  const { supabaseAdmin } = await import("@/lib/supabase");
  const results: Record<string, string> = {};

  try {
    await supabaseAdmin.from("users").update({ daily_uses: 0 }).eq("id", "00000000-0000-0000-0000-000000000000");
    results.daily_uses = "exists";
  } catch {
    results.daily_uses = "missing — run: ALTER TABLE users ADD COLUMN daily_uses INT DEFAULT 0";
  }

  try {
    await supabaseAdmin.from("users").update({ daily_date: "2025-01-01" }).eq("id", "00000000-0000-0000-0000-000000000000");
    results.daily_date = "exists";
  } catch {
    results.daily_date = "missing — run: ALTER TABLE users ADD COLUMN daily_date DATE";
  }

  return NextResponse.json(results);
}
