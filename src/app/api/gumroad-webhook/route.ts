import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { addCreditsByEmail, setSubscriptionByEmail } from "@/lib/credits";

const WEBHOOK_SECRET = process.env.GUMROAD_WEBHOOK_SECRET || "";

/**
 * POST /api/gumroad-webhook
 * Handles Gumroad sale notifications. Verifies HMAC signature,
 * then grants credits or subscription based on product price.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-gumroad-signature") || "";

    // Verify signature
    if (!WEBHOOK_SECRET) {
      console.error("GUMROAD_WEBHOOK_SECRET not set");
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

    if (!email) {
      return NextResponse.json({ error: "No email in webhook" }, { status: 400 });
    }

    // Map price to credits
    if (price === 499) {
      // $4.99 — subscription
      await setSubscriptionByEmail(email);
      console.log(`Gumroad: subscription activated for ${email}`);
    } else if (price === 599) {
      // $5.99 — 5 credits
      await addCreditsByEmail(email, 5);
      console.log(`Gumroad: 5 credits added for ${email}`);
    } else if (price === 1299) {
      // $12.99 — 15 credits
      await addCreditsByEmail(email, 15);
      console.log(`Gumroad: 15 credits added for ${email}`);
    } else {
      console.log(`Gumroad: unknown price ${price} for ${productName}, email=${email}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("gumroad-webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function verifySignature(body: string, signature: string): boolean {
  try {
    const hmac = createHmac("sha256", WEBHOOK_SECRET);
    hmac.update(body);
    const digest = hmac.digest("hex");

    // Constant-time comparison
    const sigBuf = Buffer.from(signature);
    const digestBuf = Buffer.from(digest);
    if (sigBuf.length !== digestBuf.length) return false;
    return timingSafeEqual(sigBuf, digestBuf);
  } catch {
    return false;
  }
}
