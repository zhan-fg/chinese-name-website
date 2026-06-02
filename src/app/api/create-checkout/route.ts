import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://chinese-name-website.vercel.app";

/**
 * POST /api/create-checkout
 * Creates a Stripe Checkout session and returns the URL.
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

    const url = await createCheckoutSession({
      planId,
      anonymousId,
      email,
      successUrl: `${SITE_URL}?checkout=success`,
      cancelUrl: `${SITE_URL}?checkout=cancelled`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("create-checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
