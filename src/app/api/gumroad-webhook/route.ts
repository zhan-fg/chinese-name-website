export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin, TABLES } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

const PRODUCTS = {
  bazi: { permalink: "pyzrg", price: 199 },
  report: { permalink: "kqzwc", price: 499 },
  premium: { permalink: "uawodz", price: 999 },
} as const;

function isTrue(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

function permalinkSlug(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\/+$/, "");
  return normalized.split("/").pop() || "";
}

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
    const configuredSecret = process.env.GUMROAD_PING_SECRET;
    const providedSecret = request.nextUrl.searchParams.get("secret") || "";
    if (!configuredSecret || !providedSecret || configuredSecret.length !== providedSecret.length ||
        !crypto.timingSafeEqual(Buffer.from(configuredSecret), Buffer.from(providedSecret))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const saleId = body.sale_id?.trim();
    const email = body.email?.toLowerCase().trim();
    const price = Number.parseInt(body.price || "", 10);
    const currency = (body.currency || "").toLowerCase().trim();
    const permalink = body.product_permalink || body.permalink || "";
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

    if (!saleId || !email || !Number.isSafeInteger(price) || price <= 0 || currency !== "usd") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (
      isTrue(body.refunded) ||
      isTrue(body.disputed) ||
      isTrue(body.chargebacked) ||
      isTrue(body.test)
    ) {
      return NextResponse.json({ error: "Ineligible sale" }, { status: 400 });
    }

    const product = Object.entries(PRODUCTS).find(
      ([, config]) => config.permalink === permalinkSlug(permalink) && config.price === price,
    )?.[0] as keyof typeof PRODUCTS | undefined;
    if (!product) {
      return NextResponse.json({ error: "Unknown product or price mismatch" }, { status: 400 });
    }

    console.log(`[webhook] accepted sale=${saleId} product=${product} claim_token=${claimToken ? claimToken.slice(0,8)+"..." : "(none)"}`);

    // Route the allowlisted product to the correct set of tables.
    if (product === "bazi") {
      return handleBaziPurchase(db, saleId, email, price, permalink, productName, claimToken);
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

    // kqzwc = Identity Report ($4.99), uawodz = Premium ($9.99)
    if (product === "report") {
      reportUnlocks = 1;
    } else if (product === "premium") {
      reportUnlocks = 20;
    }

    // Grant the purchase (naming tables: "users", NOT bazi_users)
    if (reportUnlocks > 0) {
      await addNamingReportUnlocks(db, email, reportUnlocks);
      console.log(
        `Gumroad Ping: ${reportUnlocks} report unlocks for ${email} (${productName})`
      );
    }

    // Record processed sale (shared table)
    await db.from("processed_sales").insert({
      sale_id: saleId,
      email,
      product_permalink: permalink,
      price,
      created_at: new Date().toISOString(),
    });

    // Link the naming claim token to this verified Ping.
    if (claimToken) {
      console.log(`[webhook naming] attempting to link: ${claimToken.slice(0,8)}...`);
      await linkTokenByValue(db, "claim_tokens", claimToken, email);
    } else {
      console.log(`[webhook naming] no claim_token in ping`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("gumroad-webhook error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
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
    console.log(`[webhook bazi] attempting to link claim_token: ${claimToken.slice(0,8)}...`);
    await linkTokenByValue(db, TABLES.claimTokens, claimToken, email);
  } else {
    console.log(`[webhook bazi] no claim_token in ping, checking for pending tokens by email`);
  }

  console.log(`Gumroad Ping (bazi): ${reportUnlocks} unlocks for ${email} (${productName})`);
  return NextResponse.json({ ok: true, product: "bazi" });
}

async function linkTokenByValue(
  db: SupabaseClient,
  table: string,
  token: string,
  email: string,
) {
  const { data: preCheck } = await db
    .from(table)
    .select("id, status")
    .eq("token", token)
    .maybeSingle();

  console.log(`[webhook] linkToken pre-check: exists=${!!preCheck} status=${preCheck?.status || "N/A"}`);

  if (!preCheck) {
    console.warn(`[webhook] token not in ${table}: ${token.slice(0,8)}...`);
    return;
  }

  if (preCheck.status !== "pending") {
    console.log(`[webhook] token status is '${preCheck.status}', not pending — skipping`);
    return;
  }

  const { error, count } = await db
    .from(table)
    .update({ email, status: "verified" })
    .eq("token", token)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error(`[webhook] UPDATE ${table} FAILED: ${error.message}`);
  } else if (count) {
    console.log(`[webhook] VERIFIED ${table}: ${token.slice(0,8)}... → ${email} (${count} row)`);
  }
}
