export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin, TABLES } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/gumroad-webhook
 *
 * Gumroad Ping endpoint. Gumroad sends an HTTP POST (x-www-form-urlencoded)
 * whenever a product is purchased. This is the source of truth for payments.
 *
 * Product mapping:
 *   kqzwc / $4.99 (499 cents) — Identity Report → 1 report unlock   (naming)
 *   uawodz / $9.99 (999 cents) — Premium → 20 report unlocks          (naming)
 *   pyzrg  / $1.99 (199 cents) — Bazi Reading → 1 chart unlock        (bazi)
 *
 * Since Gumroad allows only ONE Ping URL per account, this single webhook
 * handles purchases for BOTH chinese-name-website and bazi-ziwei-web.
 * Bazi purchases are detected by product permalink and routed to bazi_* tables.
 */
export async function POST(request: NextRequest) {
  try {
    const db = requireSupabaseAdmin();
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        body[key] = value;
      });
    }

    const saleId = body.sale_id;
    const email = body.email;
    const price = parseInt(body.price || "0", 10);
    const permalink = body.product_permalink || "";
    const productName = body.product_name || "";

    // Extract claim_token from url_params
    let claimToken = "";
    try {
      if (body.url_params) {
        const parsed = typeof body.url_params === "string"
          ? JSON.parse(body.url_params.replace(/'/g, '"'))
          : body.url_params;
        claimToken = parsed.claim_token || "";
      }
    } catch {}
    if (!claimToken) {
      claimToken = body["url_params[claim_token]"] || "";
    }

    if (!saleId || !email) {
      console.error("Gumroad Ping: missing sale_id or email", { saleId, email });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Detect bazi product (shared Gumroad account) ──
    // Gumroad sends product_permalink as full URL (https://zhanqiuhui.gumroad.com/l/pyzrg)
    // so use includes instead of exact match.
    const isBazi = (permalink || "").toLowerCase().includes("pyzrg");
    if (isBazi) {
      return handleBaziPurchase(db, saleId, normalizedEmail, price, permalink, productName, claimToken);
    }

    // ── Naming products (chinese-name-website) ──

    // Idempotency check (shared table)
    const { data: existing } = await db
      .from("processed_sales")
      .select("id")
      .eq("sale_id", saleId)
      .single();

    if (existing) {
      console.log(`Gumroad Ping: sale ${saleId} already processed`);
      return NextResponse.json({ ok: true, deduplicated: true });
    }

    // Determine what to grant
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

    // Grant the purchase (naming tables: "users", NOT bazi_users)
    if (reportUnlocks > 0) {
      await addNamingReportUnlocks(db, normalizedEmail, reportUnlocks);
      console.log(
        `Gumroad Ping: ${reportUnlocks} report unlocks for ${normalizedEmail} (${productName})`
      );
    }

    if (credits > 0) {
      await addCredits(db, normalizedEmail, credits);
      console.log(
        `Gumroad Ping: ${credits} credits for ${normalizedEmail} (${productName})`
      );
    }

    // Record processed sale (shared table)
    await db.from("processed_sales").insert({
      sale_id: saleId,
      email: normalizedEmail,
      product_permalink: permalink,
      price,
      created_at: new Date().toISOString(),
    });

    // Link claim_token
    if (claimToken) {
      const { error: tokenErr } = await db
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

// ─── Naming product helpers (write to chinese-name "users" table) ───

async function addNamingReportUnlocks(db: SupabaseClient, email: string, count: number) {
  const { data: existing } = await db
    .from("users")
    .select("id, report_unlocks_remaining")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    await db
      .from("users")
      .update({
        report_unlocks_remaining: (existing.report_unlocks_remaining || 0) + count,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await db.from("users").insert({
      anonymous_id: `gumroad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      free_uses_remaining: 0,
      credits_remaining: 0,
      report_unlocks_remaining: count,
      subscription_status: "none",
    });
  }
}

async function addCredits(db: SupabaseClient, email: string, count: number) {
  const { data: existing } = await db
    .from("users")
    .select("id, credits_remaining")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    await db
      .from("users")
      .update({
        credits_remaining: (existing.credits_remaining || 0) + count,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await db.from("users").insert({
      anonymous_id: `gumroad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      free_uses_remaining: 0,
      credits_remaining: count,
      report_unlocks_remaining: 0,
      subscription_status: "none",
    });
  }
}

// ─── Bazi-ziwei-web product handler ───────────────────────
// Writes to bazi_processed_sales (dedup) + bazi_users (credits).

async function handleBaziPurchase(
  db: SupabaseClient,
  saleId: string,
  email: string,
  price: number,
  permalink: string,
  productName: string,
  claimToken: string,
): Promise<NextResponse> {
  // Idempotency: check bazi_processed_sales
  const { data: existingShared } = await db
    .from("bazi_processed_sales")
    .select("id")
    .eq("sale_id", saleId)
    .single();

  if (existingShared) {
    console.log(`Gumroad Ping (bazi): sale ${saleId} already processed`);
    return NextResponse.json({ ok: true, deduplicated: true, product: "bazi" });
  }

  // pyzrg = Bazi Reading ($1.99 → 1 unlock)
  const reportUnlocks = 1;

  // Add unlocks to bazi_users
  const { data: baziUser } = await db
    .from(TABLES.users)
    .select("id, report_unlocks_remaining")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (baziUser) {
    await db
      .from(TABLES.users)
      .update({
        report_unlocks_remaining: (baziUser.report_unlocks_remaining || 0) + reportUnlocks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", baziUser.id);
  } else {
    await db.from(TABLES.users).insert({
      anonymous_id: `gumroad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      free_uses_remaining: 0,
      report_unlocks_remaining: reportUnlocks,
      subscription_status: "none",
    });
  }

  // Record sale in bazi_processed_sales only (naming products use processed_sales)
  await db.from("bazi_processed_sales").insert({
    sale_id: saleId,
    email,
    product_permalink: permalink,
    price,
    created_at: new Date().toISOString(),
  });

  // Link claim_token (bazi table)
  if (claimToken) {
    const { error: tokenErr } = await db
      .from(TABLES.claimTokens)
      .update({ email, status: "verified" })
      .eq("token", claimToken)
      .eq("status", "pending");

    if (tokenErr) {
      console.error("Failed to link bazi claim_token:", tokenErr);
    } else {
      console.log(`Gumroad Ping (bazi): linked claim_token to ${email}`);
    }
  }

  console.log(`Gumroad Ping (bazi): ${reportUnlocks} unlocks for ${email} (${productName})`);
  return NextResponse.json({ ok: true, product: "bazi" });
}
