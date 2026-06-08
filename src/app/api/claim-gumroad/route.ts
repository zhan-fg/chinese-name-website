import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/claim-gumroad
 * Called after Gumroad purchase to unlock content.
 * Requires a valid claim token from /api/init-claim.
 *
 * Body: { email: string, token: string, nameId?: string, productType?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, token, productType, nameId } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Handle Report purchase (single name unlock) — requires token
    if (productType === "report" && nameId) {
      if (!token) {
        return NextResponse.json(
          { error: "Claim token is required" },
          { status: 400 }
        );
      }

      // Verify the token
      const { data: tokenRecord, error: tokenError } = await supabaseAdmin
        .from("claim_tokens")
        .select("id, name_id, status, expires_at, claimed_at")
        .eq("token", token)
        .eq("name_id", nameId)
        .eq("status", "pending")
        .single();

      if (tokenError || !tokenRecord) {
        return NextResponse.json(
          { error: "Invalid or expired claim token. Please go back and try again." },
          { status: 400 }
        );
      }

      // Check expiry
      if (new Date(tokenRecord.expires_at) < new Date()) {
        await supabaseAdmin
          .from("claim_tokens")
          .update({ status: "expired" })
          .eq("id", tokenRecord.id);
        return NextResponse.json(
          { error: "Claim token has expired. Please go back and try again." },
          { status: 400 }
        );
      }

      // Mark token as claimed
      const { error: updateError } = await supabaseAdmin
        .from("claim_tokens")
        .update({
          status: "claimed",
          claimed_at: new Date().toISOString(),
          email: normalizedEmail,
        })
        .eq("id", tokenRecord.id);

      if (updateError) {
        console.error("Failed to mark token as claimed:", updateError);
      }

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

    // Handle credits/subscription — also require token for report purchases
    // For credits: allow without token (purchased from pricing page)
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
