import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/paypal";

/**
 * POST /api/create-checkout
 * Creates a PayPal order and returns the approval URL.
 * Auto-detects domain from request headers (works with any custom domain).
 */
export async function POST(request: NextRequest) {
  try {
    const { planId, anonymousId, email } = await request.json();

    if (!planId || !anonymousId) {
      return NextResponse.json(
        { error: "planId and anonymousId required" },
        { status: 400 }
      );
    }

    const validPlans = ["credit_5", "credit_15", "subscription"];
    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { error: `Invalid planId. Must be one of: ${validPlans.join(", ")}` },
        { status: 400 }
      );
    }

    // Auto-detect domain from request
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `${protocol}://${host}` ||
      "https://chinese-name-website.vercel.app";

    const url = await createCheckoutSession({
      planId,
      anonymousId,
      email,
      successUrl: `${siteUrl}?checkout=success`,
      cancelUrl: `${siteUrl}?checkout=cancelled`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("create-checkout error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
