import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { addCreditsByAnonymousId, ensureUser } from "@/lib/credits";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/capture-paypal-order
 * Captures a PayPal order after user approval, then credits the user.
 * Also stores the payer's PayPal email for account recovery.
 *
 * Body: { orderId: string, anonymousId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, anonymousId } = await request.json();

    if (!orderId || !anonymousId) {
      return NextResponse.json(
        { error: "orderId and anonymousId required" },
        { status: 400 }
      );
    }

    // Capture the PayPal order
    const { planId, status, payerEmail } = await capturePayPalOrder(orderId);

    if (status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${status}` },
        { status: 400 }
      );
    }

    // Ensure user exists
    await ensureUser(anonymousId);

    // Store the payer email (PayPal always returns the payer's email)
    if (payerEmail) {
      await supabaseAdmin
        .from("users")
        .update({ email: payerEmail, updated_at: new Date().toISOString() })
        .eq("anonymous_id", anonymousId);
    }

    // Credit the user based on plan
    const PLAN_CREDITS: Record<string, number> = {
      credit_5: 5,
      credit_15: 15,
      subscription: -1,
    };

    const credits = PLAN_CREDITS[planId];
    if (credits === undefined) {
      console.error("Unknown plan in capture:", planId);
      return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    }

    if (planId === "subscription") {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      await supabaseAdmin
        .from("users")
        .update({
          subscription_status: "active",
          subscription_end: endDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("anonymous_id", anonymousId);
    } else {
      await addCreditsByAnonymousId(anonymousId, credits);
    }

    return NextResponse.json({
      success: true,
      planId,
      credits,
      email: payerEmail,
    });
  } catch (error) {
    console.error("capture-paypal-order error:", error);
    return NextResponse.json(
      { error: "Failed to capture order" },
      { status: 500 }
    );
  }
}
