export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin, TABLES } from "@/lib/supabase";
import { isUnauthorized, requireAuthenticatedUser } from "@/lib/auth";

/**
 * POST /api/verify-purchase
 *
 * Credit model: each pyzrg purchase grants +1 report_unlocks_remaining.
 * Only grants credits for purchases made AFTER the user's last_credited_at
 * timestamp. This prevents old purchases from granting unlimited unlocks.
 *
 * Body: { email: string, chartId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthenticatedUser(request);
    const { chartId } = await request.json();

    const db = requireSupabaseAdmin();
    const normalizedEmail = authUser.email;

    // 1. Get or create user
    const { data: user, error: userError } = await db
      .from(TABLES.users)
      .select("id, auth_user_id, report_unlocks_remaining, unlocked_charts")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (userError) throw new Error(`Failed to find purchase account: ${userError.message}`);

    // Gumroad Ping creates or credits the user before an account session
    // exists. A verified email login safely links that anonymous purchase row
    // to the Supabase account so future authenticated reads can find it.
    if (user && user.auth_user_id !== authUser.id) {
      const { error: linkError } = await db
        .from(TABLES.users)
        .update({ auth_user_id: authUser.id, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (linkError) throw new Error(`Failed to link purchase account: ${linkError.message}`);
    }

    // Webhook processing already grants credits. Do not recount sales for an
    // existing user here or the same purchase would be credited twice.
    let reportUnlocks = user?.report_unlocks_remaining || 0;
    if (!user) {
      // Recovery for historical sales created before bazi_users was populated.
      const { data: sharedSales, error: salesError } = await db
        .from(TABLES.processedSales)
        .select("sale_id, product_permalink")
        .eq("email", normalizedEmail);
      if (salesError) throw new Error(`Failed to find purchases: ${salesError.message}`);

      const totalNew = (sharedSales || [])
        .filter((s: any) => (s.product_permalink || "").toLowerCase().includes("pyzrg"))
        .length;
      reportUnlocks = totalNew;
      if (totalNew > 0) {
        const { error: createError } = await db.from(TABLES.users)
        .insert({
          anonymous_id: `gsale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          auth_user_id: authUser.id,
          email: normalizedEmail,
          free_uses_remaining: 0,
          report_unlocks_remaining: totalNew,
          unlocked_charts: [],
          last_credited_at: new Date().toISOString(),
          subscription_status: "none",
        });
        if (createError) throw new Error(`Failed to recover purchase account: ${createError.message}`);
      }
    }

    // Check access: user needs either remaining unlocks or chart already unlocked
    const unlockedCharts: string[] = user?.unlocked_charts || [];
    if (reportUnlocks <= 0 && !unlockedCharts.includes(chartId)) {
      return NextResponse.json({
        verified: false,
        error: "No purchase found. Please complete a purchase on Gumroad first.",
      });
    }

    return NextResponse.json({ verified: true, credits: reportUnlocks });
  } catch (error: any) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[verify-purchase] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
