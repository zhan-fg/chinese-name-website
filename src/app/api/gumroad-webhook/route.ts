import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/gumroad-webhook
 *
 * Gumroad Ping endpoint. Gumroad sends an HTTP POST (x-www-form-urlencoded)
 * whenever a product is purchased. This is the source of truth for payments.
 *
 * Product mapping:
 *   $4.99 (499 cents, permalink: kqzwc) — Identity Report → 1 report unlock
 *   $9.99 (999 cents, permalink: uawodz) — Premium → 20 report unlocks
 */
export async function POST(request: NextRequest) {
  try {
    // Gumroad Ping sends x-www-form-urlencoded, NOT JSON
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      for (const [key, value] of params) {
        body[key] = value;
      }
    }

    const saleId = body.sale_id;
    const email = body.email;
    const price = parseInt(body.price || "0", 10);
    const permalink = body.product_permalink || "";
    const productName = body.product_name || "";

    // Extract claim_token from url_params (Gumroad passes URL query params back)
    // url_params can be a JSON string or individual url_params[key] fields
    let claimToken = "";
    try {
      // Try JSON format first: {"claim_token": "abc123", ...}
      if (body.url_params) {
        const parsed = typeof body.url_params === "string"
          ? JSON.parse(body.url_params.replace(/'/g, '"'))
          : body.url_params;
        claimToken = parsed.claim_token || "";
      }
    } catch {}
    // Fallback: url_params[claim_token] pattern
    if (!claimToken) {
      claimToken = body["url_params[claim_token]"] || "";
    }

    if (!saleId || !email) {
      console.error("Gumroad Ping: missing sale_id or email", { saleId, email });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Idempotency: check if we already processed this sale ──
    const { data: existing } = await supabaseAdmin
      .from("processed_sales")
      .select("id")
      .eq("sale_id", saleId)
      .single();

    if (existing) {
      console.log(`Gumroad Ping: sale ${saleId} already processed`);
      return NextResponse.json({ ok: true, deduplicated: true });
    }

    // Determine what to grant based on product
    let reportUnlocks = 0;
    let credits = 0;

    // kqzwc = Identity Report ($4.99), uawodz = Premium ($9.99)
    if (price === 499 || permalink === "kqzwc") {
      reportUnlocks = 1;
    } else if (price === 999 || permalink === "uawodz") {
      reportUnlocks = 20;
    } else if (price === 599) {
      credits = 5;
    } else if (price === 1299) {
      credits = 15;
    } else {
      console.log(
        `Gumroad Ping: unknown product price=${price} permalink=${permalink} name="${productName}"`
      );
    }

    // ── Grant the purchase ──
    if (reportUnlocks > 0) {
      await addReportUnlocks(normalizedEmail, reportUnlocks);
      console.log(
        `Gumroad Ping: ${reportUnlocks} report unlocks for ${normalizedEmail} (${productName})`
      );
    }

    if (credits > 0) {
      await addCredits(normalizedEmail, credits);
      console.log(
        `Gumroad Ping: ${credits} credits for ${normalizedEmail} (${productName})`
      );
    }

    // ── Record processed sale (idempotency) ──
    await supabaseAdmin.from("processed_sales").insert({
      sale_id: saleId,
      email: normalizedEmail,
      product_permalink: permalink,
      price,
      created_at: new Date().toISOString(),
    });

    // ── Link claim_token to verified email (for auto-claim without email input) ──
    if (claimToken) {
      const { error: tokenErr } = await supabaseAdmin
        .from("claim_tokens")
        .update({ email: normalizedEmail, status: "verified" })
        .eq("token", claimToken)
        .eq("status", "pending");

      if (tokenErr) {
        console.error("Failed to link claim_token:", tokenErr);
      } else {
        console.log(`Gumroad Ping: linked claim_token ${claimToken.slice(0, 8)}... to ${normalizedEmail}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("gumroad-webhook error:", error);
    // Always return 200 so Gumroad doesn't retry
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 200 });
  }
}

async function addReportUnlocks(email: string, count: number) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, report_unlocks_remaining")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("users")
      .update({
        report_unlocks_remaining: (existing.report_unlocks_remaining || 0) + count,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("users").insert({
      anonymous_id: `gumroad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      free_uses_remaining: 0,
      credits_remaining: 0,
      report_unlocks_remaining: count,
      subscription_status: "none",
    });
  }
}

async function addCredits(email: string, count: number) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, credits_remaining")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("users")
      .update({
        credits_remaining: (existing.credits_remaining || 0) + count,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("users").insert({
      anonymous_id: `gumroad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      free_uses_remaining: 0,
      credits_remaining: count,
      report_unlocks_remaining: 0,
      subscription_status: "none",
    });
  }
}
