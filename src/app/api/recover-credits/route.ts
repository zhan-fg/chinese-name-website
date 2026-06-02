import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/recover-credits
 * Recovers credits by email. Transfers credits from the email-linked
 * user to the current anonymous session.
 *
 * Body: { email: string, anonymousId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, anonymousId } = await request.json();

    if (!email || !anonymousId) {
      return NextResponse.json(
        { error: "email and anonymousId required" },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: existingUser, error } = await supabaseAdmin
      .from("users")
      .select("id, anonymous_id, free_uses_remaining, credits_remaining, subscription_status, subscription_end")
      .eq("email", email.toLowerCase().trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !existingUser) {
      return NextResponse.json(
        { error: "No credits found for this email" },
        { status: 404 }
      );
    }

    // If the email is already linked to the current session, just return balance
    if (existingUser.anonymous_id === anonymousId) {
      return NextResponse.json({
        success: true,
        freeRemaining: existingUser.free_uses_remaining,
        creditsRemaining: existingUser.credits_remaining,
        isSubscriber: existingUser.subscription_status === "active",
      });
    }

    // Get or create the current session's user
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("id, credits_remaining, free_uses_remaining, subscription_status, subscription_end")
      .eq("anonymous_id", anonymousId)
      .single();

    if (currentUser) {
      // Merge credits: add existing user's credits to current user
      const mergedCredits =
        (currentUser.credits_remaining || 0) +
        (existingUser.credits_remaining || 0);
      const mergedFree =
        Math.max(
          currentUser.free_uses_remaining || 0,
          existingUser.free_uses_remaining || 0
        );

      // Check if existing user has an active subscription
      const hasSubscription =
        existingUser.subscription_status === "active" &&
        existingUser.subscription_end &&
        new Date(existingUser.subscription_end) > new Date();

      await supabaseAdmin
        .from("users")
        .update({
          credits_remaining: mergedCredits,
          free_uses_remaining: mergedFree,
          email: email.toLowerCase().trim(),
          subscription_status: hasSubscription
            ? "active"
            : currentUser.subscription_status,
          subscription_end: hasSubscription
            ? existingUser.subscription_end
            : currentUser.subscription_end || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      // Clear the old user's credits
      await supabaseAdmin
        .from("users")
        .update({
          credits_remaining: 0,
          free_uses_remaining: 0,
          subscription_status: "none",
          subscription_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id);

      return NextResponse.json({
        success: true,
        freeRemaining: mergedFree,
        creditsRemaining: hasSubscription ? 999 : mergedCredits,
        isSubscriber: hasSubscription,
      });
    } else {
      // No current user yet — just link the email to current session
      await supabaseAdmin
        .from("users")
        .update({
          anonymous_id: anonymousId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id);

      return NextResponse.json({
        success: true,
        freeRemaining: existingUser.free_uses_remaining,
        creditsRemaining: existingUser.credits_remaining,
        isSubscriber: existingUser.subscription_status === "active",
      });
    }
  } catch (error) {
    console.error("recover-credits error:", error);
    return NextResponse.json(
      { error: "Failed to recover credits" },
      { status: 500 }
    );
  }
}
