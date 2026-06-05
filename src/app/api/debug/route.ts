import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/debug
 * Health check: Supabase, DeepSeek, PayPal, and table schema.
 */
export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. Supabase connection
  try {
    const start = Date.now();
    const { error } = await supabaseAdmin
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

  // 2. Table structure — try a test insert/delete
  try {
    const testId = "debug_test_" + Date.now();
    const { error: insertErr } = await supabaseAdmin
      .from("users")
      .insert({
        anonymous_id: testId,
        free_uses_remaining: 999,
        credits_remaining: 0,
        subscription_status: "none",
      })
      .select("id");

    if (insertErr) {
      checks.table = { ok: false, error: insertErr.message, hint: insertErr.hint || null };
    } else {
      // Clean up test row
      await supabaseAdmin.from("users").delete().eq("anonymous_id", testId);
      checks.table = { ok: true };
    }
  } catch (e) {
    checks.table = { ok: false, error: String(e) };
  }

  // 3. DeepSeek
  const apiKey = process.env.DEEPSEEK_API_KEY || "";
  checks.deepseek = {
    configured: !!(apiKey && apiKey !== "your_deepseek_api_key_here"),
    keyPreview: apiKey
      ? apiKey.slice(0, 5) + "..." + apiKey.slice(-4)
      : "NOT SET",
  };

  // 4. PayPal — test actual auth
  const ppClientId = process.env.PAYPAL_CLIENT_ID || "";
  const ppSecret = process.env.PAYPAL_CLIENT_SECRET || "";
  const ppMode = process.env.PAYPAL_MODE || "not set";

  checks.paypal = {
    configured: !!(ppClientId && ppSecret),
    mode: ppMode,
    clientIdPreview: ppClientId ? ppClientId.slice(0, 5) + "..." + ppClientId.slice(-4) : "NOT SET",
  } as Record<string, unknown>;

  if (ppClientId && ppSecret) {
    try {
      const ppApi = ppMode === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";
      const authRes = await fetch(`${ppApi}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${ppClientId}:${ppSecret}`).toString("base64"),
        },
        body: "grant_type=client_credentials",
      });
      if (authRes.ok) {
        checks.paypal.auth = "ok";
      } else {
        const errText = await authRes.text();
        checks.paypal.auth = { failed: true, status: authRes.status, body: errText.slice(0, 300) };
      }
    } catch (e) {
      checks.paypal.auth = { failed: true, error: String(e) };
    }
  }

  return NextResponse.json(checks);
}
