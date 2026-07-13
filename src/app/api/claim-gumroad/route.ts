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

    const contentId = productType === "report" ? nameId : chartId;

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!token) return NextResponse.json({ error: "Claim token is required" }, { status: 400 });
    if (!contentId) {
      return NextResponse.json(
        { error: `${productType === "report" ? "nameId" : "chartId"} is required` },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify token — for naming reports, chart_id may be null
    let tokenQuery = db
      .from(TABLES.claimTokens)
      .select("id, chart_id, status, expires_at, email")
      .eq("token", token)
      .in("status", ["pending", "verified"]);

    if (productType === "chart") {
      tokenQuery = tokenQuery.eq("chart_id", chartId);
    } else {
      // For naming: token may have null chart_id, or match nameId
      tokenQuery = tokenQuery.or(`chart_id.is.null,chart_id.eq.${nameId}`);
    }

    const { data: pendingRecord } = await tokenQuery.maybeSingle();

    if (!pendingRecord) {
      return NextResponse.json({ error: "Invalid or expired claim token." }, { status: 400 });
    }

    if (new Date(pendingRecord.expires_at) < new Date()) {
      await db.from(TABLES.claimTokens)
        .update({ status: "expired" }).eq("id", pendingRecord.id);
      return NextResponse.json({ error: "Claim token has expired." }, { status: 400 });
    }

    // Mark token as claimed
    await db.from(TABLES.claimTokens).update({
      status: "claimed",
      claimed_at: new Date().toISOString(),
      email: normalizedEmail,
    }).eq("id", pendingRecord.id);

    // Verify user has unlocks
    let { data: userRecord } = await db
      .from(TABLES.users)
      .select("id, report_unlocks_remaining")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fallback: check processed_sales tables
    if (!userRecord || (userRecord.report_unlocks_remaining || 0) <= 0) {
      const [{ data: sharedSale }, { data: baziSale }] = await Promise.all([
        db.from("processed_sales")
          .select("id, product_permalink")
          .eq("email", normalizedEmail)
          .ilike("product_permalink", "%pyzrg%")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        db.from(TABLES.processedSales)
          .select("id")
          .eq("email", normalizedEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const saleRecord = sharedSale || baziSale;

      if (saleRecord) {
        if (userRecord) {
          await db.from(TABLES.users)
            .update({
              report_unlocks_remaining: (userRecord.report_unlocks_remaining || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userRecord.id);
        } else {
          const { data: newUser } = await db.from(TABLES.users)
            .insert({
              anonymous_id: `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              email: normalizedEmail,
              free_uses_remaining: 0,
              report_unlocks_remaining: 1,
              subscription_status: "none",
            })
            .select("id, report_unlocks_remaining")
            .single();
          userRecord = newUser;
        }
      }
    }

    // Final fallback: Gumroad API
    if (!userRecord || (userRecord.report_unlocks_remaining || 0) <= 0) {
      const { verifyPurchase } = await import("@/lib/gumroad");
      const gumroadVerified = await verifyPurchase(normalizedEmail);
      if (gumroadVerified) {
        const { data: newUser } = await db.from(TABLES.users)
          .insert({
            anonymous_id: `gumroad-api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            email: normalizedEmail,
            free_uses_remaining: 0,
            report_unlocks_remaining: 1,
            subscription_status: "none",
          })
          .select("id, report_unlocks_remaining")
          .single();
        userRecord = newUser;
      }
    }

    const reportUnlocks = userRecord?.report_unlocks_remaining || 0;

    if (!userRecord || reportUnlocks <= 0) {
      return NextResponse.json(
        { error: "No verified purchase found. Use the same email as Gumroad." },
        { status: 400 }
      );
    }

    // Decrement unlocks
    await db.from(TABLES.users)
      .update({
        report_unlocks_remaining: reportUnlocks - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userRecord.id);

    // For bazi charts: add to unlocked_charts
    if (productType === "chart" && chartId) {
      const { data: existingUser } = await db
        .from(TABLES.users)
        .select("id, unlocked_charts")
        .eq("id", userRecord.id)
        .maybeSingle();

      const unlockedCharts: string[] = existingUser?.unlocked_charts || [];
      if (!unlockedCharts.includes(chartId)) {
        unlockedCharts.push(chartId);
        await db.from(TABLES.users)
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
