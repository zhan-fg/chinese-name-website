import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/debug
 * Health check: Supabase connection, DeepSeek API key status, env vars.
 * Only returns safe info (no secret values).
 */
export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. Supabase
  try {
    const start = Date.now();
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .limit(1);
    const latency = Date.now() - start;

    checks.supabase = error
      ? { ok: false, error: error.message, latency }
      : { ok: true, latency };
  } catch (e) {
    checks.supabase = { ok: false, error: String(e) };
  }

  // 2. DeepSeek API key
  const apiKey = process.env.DEEPSEEK_API_KEY || "";
  checks.deepseek = {
    configured: !!(apiKey && apiKey !== "your_deepseek_api_key_here"),
    keyPreview: apiKey
      ? apiKey.slice(0, 5) + "..." + apiKey.slice(-4)
      : "NOT SET",
  };

  // 3. PayPal
  const paypalId = process.env.PAYPAL_CLIENT_ID || "";
  checks.paypal = {
    configured: !!paypalId,
    mode: process.env.PAYPAL_MODE || "not set",
  };

  // 4. Env var names
  checks.env = {
    supabase_url: process.env.SUPABASE_URL ? "set" : "missing",
    supabase_anon_key: process.env.SUPABASE_ANON_KEY ? "set" : "missing",
    supabase_service_role: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "set"
      : "missing",
    next_public_supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? "set"
      : "missing",
    next_public_supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "set"
      : "missing",
    site_url: process.env.NEXT_PUBLIC_SITE_URL || "fallback",
  };

  return NextResponse.json(checks);
}
