export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin, TABLES } from "@/lib/supabase";

/**
 * POST /api/claim-gumroad
 * Called after Gumroad purchase to unlock content.
 * Supports both naming reports (productType="report") and bazi charts (productType="chart").
 *
 * Body: { email: string, token: string, productType?: "report" | "chart", nameId?: string, chartId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const db = requireSupabaseAdmin();
    const { email, token, productType, nameId, chartId } = await request.json();

    if (productType !== "report" && productType !== "chart") {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
    }

    const isReport = productType === "report";
    const contentId = isReport ? nameId : chartId;
    const claimTable = isReport ? "claim_tokens" : TABLES.claimTokens;
    const contentColumn = isReport ? "name_id" : "chart_id";
    const userTable = isReport ? "users" : TABLES.users;

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!token) return NextResponse.json({ error: "Claim token is required" }, { status: 400 });
    if (!contentId) {
      return NextResponse.json(
        { error: `${isReport ? "nameId" : "chartId"} is required` },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: pendingRecord } = await db
      .from(claimTable)
      .select(`id, ${contentColumn}, status, expires_at, email`)
      .eq("token", token)
      .eq("status", "verified")
      .eq("email", normalizedEmail)
      .eq(contentColumn, contentId)
      .maybeSingle();

    if (!pendingRecord) {
      return NextResponse.json({ error: "Invalid or expired claim token." }, { status: 400 });
    }

    if (new Date(pendingRecord.expires_at) < new Date()) {
      await db.from(claimTable)
        .update({ status: "expired" }).eq("id", pendingRecord.id);
      return NextResponse.json({ error: "Claim token has expired." }, { status: 400 });
    }

    // Verify user has unlocks
    const { data: userRecord } = await db
      .from(userTable)
      .select("id, report_unlocks_remaining")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const reportUnlocks = userRecord?.report_unlocks_remaining || 0;

    if (!userRecord || reportUnlocks <= 0) {
      return NextResponse.json(
        { error: "No verified purchase found. Use the same email as Gumroad." },
        { status: 400 }
      );
    }

    const { data: claimedToken } = await db.from(claimTable).update({
      status: "claimed",
      claimed_at: new Date().toISOString(),
    })
      .eq("id", pendingRecord.id)
      .eq("status", "verified")
      .select("id")
      .maybeSingle();

    if (!claimedToken) {
      return NextResponse.json({ error: "Claim token was already used" }, { status: 409 });
    }

    await db.from(userTable)
      .update({
        report_unlocks_remaining: reportUnlocks - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userRecord.id);

    // For bazi charts: add to unlocked_charts
    if (!isReport && chartId) {
      const { data: existingUser } = await db
        .from(userTable)
        .select("id, unlocked_charts")
        .eq("id", userRecord.id)
        .maybeSingle();

      const unlockedCharts: string[] = existingUser?.unlocked_charts || [];
      if (!unlockedCharts.includes(chartId)) {
        unlockedCharts.push(chartId);
        await db.from(userTable)
          .update({
            unlocked_charts: unlockedCharts,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userRecord.id);
      }
    }

    return NextResponse.json({ success: true, isUnlock: true, contentId });
  } catch (error) {
    console.error("claim-gumroad error:", error);
    return NextResponse.json({ error: "Failed to claim" }, { status: 500 });
  }
}
