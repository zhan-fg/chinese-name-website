import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/claim-gumroad
 * Called from /thank-you page after Gumroad purchase.
 * Links credits/subscription to the user's email.
 * Optionally unlocks a specific name for Report purchases.
 *
 * Body: { email: string, productType?: string, nameId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, productType, nameId } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Handle Report purchase (single name unlock)
    if (productType === "report" && nameId) {
      // Check if user exists
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id, unlocked_names")
        .eq("email", normalizedEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Parse existing unlocked names
      let unlockedNames: string[] = [];
      try {
        unlockedNames = existing?.unlocked_names
          ? (typeof existing.unlocked_names === "string"
              ? JSON.parse(existing.unlocked_names)
              : existing.unlocked_names)
          : [];
      } catch {
        unlockedNames = [];
      }

      if (!unlockedNames.includes(nameId)) {
        unlockedNames.push(nameId);
      }

      if (existing) {
        await supabaseAdmin
          .from("users")
          .update({
            unlocked_names: JSON.stringify(unlockedNames),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("users").insert({
          anonymous_id: `gumroad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          email: normalizedEmail,
          free_uses_remaining: 0,
          credits_remaining: 0,
          subscription_status: "none",
          unlocked_names: JSON.stringify(unlockedNames),
        });
      }

      return NextResponse.json({
        success: true,
        isUnlock: true,
        nameId,
      });
    }

    // Handle subscription
    const url = new URL(request.url);
    const price = url.searchParams.get("price");

    let credits = 5;
    let isSubscription = false;

    if (price === "499") {
      isSubscription = true;
      credits = 0;
    } else if (price === "1299") {
      credits = 15;
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
