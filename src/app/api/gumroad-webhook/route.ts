import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

const WEBHOOK_SECRET = process.env.GUMROAD_WEBHOOK_SECRET || "";

/**
 * POST /api/gumroad-webhook
 * Handles Gumroad sale notifications. Verifies HMAC signature,
 * then stores verified purchases for claim verification.
 *
 * Product mapping:
 *   $4.99 (499 cents) — Chinese Identity Report → 1 report unlock
 *   $5.99 (599 cents) — 5 Name Credits → 5 credits
 *   $9.99 (999 cents) — Premium 20 Reports → 20 report unlocks
 *   $12.99 (1299 cents) — 15 Name Credits → 15 credits
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-gumroad-signature") || "";

    // Verify signature
    if (!WEBHOOK_SECRET) {
      console.error("GUMROAD_WEBHOOK_SECRET not set — webhook disabled");
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    if (!verifySignature(rawBody, signature)) {
      console.error("Gumroad webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Only process "sale" events
    const eventType = body.event || "sale";
    if (eventType !== "sale") {
      return NextResponse.json({ ok: true, skipped: eventType });
    }

    const email = body.email;
    const price = body.price; // cents
    const productName = body.product_name || "";
    const permalink = body.permalink || "";

    if (!email) {
      return NextResponse.json(
        { error: "No email in webhook" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Map price to action
    if (price === 499) {
      // $4.99 — Chinese Identity Report: 1 report unlock
      await addReportUnlocks(normalizedEmail, 1);
      console.log(`Gumroad: 1 report unlock added for ${normalizedEmail} (${productName})`);
    } else if (price === 599) {
      // $5.99 — 5 credits
      await addCredits(normalizedEmail, 5);
      console.log(`Gumroad: 5 credits added for ${normalizedEmail}`);
    } else if (price === 999) {
      // $9.99 — Premium: 20 report unlocks
      await addReportUnlocks(normalizedEmail, 20);
      console.log(`Gumroad: 20 report unlocks added for ${normalizedEmail} (${productName})`);
    } else if (price === 1299) {
      // $12.99 — 15 credits
      await addCredits(normalizedEmail, 15);
      console.log(`Gumroad: 15 credits added for ${normalizedEmail}`);
    } else {
      console.log(
        `Gumroad: unknown price ${price} (${productName}) for ${normalizedEmail}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("gumroad-webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Add report unlocks to a user's account.
 * Creates the user if they don't exist yet.
 */
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
        report_unlocks_remaining:
          (existing.report_unlocks_remaining || 0) + count,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("users").insert({
      anonymous_id: `gumroad-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      email,
      free_uses_remaining: 0,
      credits_remaining: 0,
      report_unlocks_remaining: count,
      subscription_status: "none",
    });
  }
}

/**
 * Add credits to a user's account.
 */
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
      anonymous_id: `gumroad-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      email,
      free_uses_remaining: 0,
      credits_remaining: count,
      report_unlocks_remaining: 0,
      subscription_status: "none",
    });
  }
}

function verifySignature(body: string, signature: string): boolean {
  try {
    const hmac = createHmac("sha256", WEBHOOK_SECRET);
    hmac.update(body);
    const digest = hmac.digest("hex");

    const sigBuf = Buffer.from(signature);
    const digestBuf = Buffer.from(digest);
    if (sigBuf.length !== digestBuf.length) return false;
    return timingSafeEqual(sigBuf, digestBuf);
  } catch {
    return false;
  }
}
