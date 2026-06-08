import { NextRequest, NextResponse } from "next/server";
import { PRICING_PLANS } from "@/lib/paypal";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/claim-gumroad
 * Called from /thank-you page after Gumroad purchase.
 * Links credits/subscription to the user's email.
 *
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Default: 5 credits (most common purchase)
    // In production, you'd verify the sale against Gumroad API here
    let credits = 5;
    let isSubscription = false;

    // Try to detect what they bought from Gumroad redirect params
    // This is best-effort; webhook is the proper way for exact matching
    const url = new URL(request.url);
    const price = url.searchParams.get("price");

    if (price === "499") {
      isSubscription = true;
      credits = 0;
    } else if (price === "1299") {
      credits = 15;
    } else if (price === "599") {
      credits = 5;
    }

    if (isSubscription) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        await supabaseAdmin
          .from("users")
          .update({
            subscription_status: "active",
            subscription_end: endDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("users").insert({
          anonymous_id: `gumroad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          email: normalizedEmail,
          free_uses_remaining: 0,
          credits_remaining: 0,
          subscription_status: "active",
          subscription_end: endDate.toISOString(),
          daily_uses: 0,
          daily_date: new Date().toISOString().slice(0, 10),
        });
      }
    } else {
      // Add credits
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id, credits_remaining")
        .eq("email", normalizedEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        await supabaseAdmin
          .from("users")
          .update({
            credits_remaining: (existing.credits_remaining || 0) + credits,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("users").insert({
          anonymous_id: `gumroad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          email: normalizedEmail,
          free_uses_remaining: 0,
          credits_remaining: credits,
          subscription_status: "none",
        });
      }
    }

    return NextResponse.json({
      success: true,
      credits,
      isSubscription,
    });
  } catch (error) {
    console.error("claim-gumroad error:", error);
    return NextResponse.json(
      { error: "Failed to claim credits" },
      { status: 500 }
    );
  }
}
