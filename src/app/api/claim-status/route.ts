export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin, TABLES } from "@/lib/supabase";

/**
 * GET /api/claim-status?token=xxx&email=yyy
 *
 * Polled by the frontend after Gumroad payment.
 * Primary: checks if Gumroad Ping has verified the claim token.
 * Fallback: checks if the email has recent purchases in processed_sales tables.
 */
export async function GET(request: NextRequest) {
  try {
    const db = requireSupabaseAdmin();
    const token = request.nextUrl.searchParams.get("token");
    const email = request.nextUrl.searchParams.get("email");

    if (!token && !email) {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }

    // ── Primary: check claim token ──
    if (token) {
      // Check bazi_claim_tokens first
      const { data: baziData } = await db
        .from(TABLES.claimTokens)
        .select("status, email, chart_id")
        .eq("token", token)
        .maybeSingle();

      if (baziData && (baziData.status === "verified" || baziData.status === "claimed")) {
        return NextResponse.json({
          status: baziData.status,
          email: baziData.email || undefined,
          chartId: baziData.chart_id,
        });
      }

      // Check shared claim_tokens
      const { data: sharedData } = await db
        .from("claim_tokens")
        .select("status, email")
        .eq("token", token)
        .maybeSingle();

      if (sharedData && sharedData.status === "verified" && sharedData.email) {
        // Sync to bazi_claim_tokens
        await db.from(TABLES.claimTokens)
          .update({ status: "verified", email: sharedData.email })
          .eq("token", token)
          .eq("status", "pending");

        return NextResponse.json({
          status: "verified",
          email: sharedData.email,
          chartId: null,
        });
      }

      // Token is still pending — check if email has recent purchases
      if (email && baziData && baziData.status === "pending") {
        const verified = await checkRecentPurchases(db, email);
        if (verified) {
          return NextResponse.json({
            status: "verified",
            email,
            chartId: baziData.chart_id,
          });
        }
      }

      // Still pending or not found
      if (!baziData && !sharedData) {
        return NextResponse.json({ status: "not_found" }, { status: 404 });
      }

      return NextResponse.json({
        status: (baziData || sharedData)?.status || "pending",
        email: baziData?.email || sharedData?.email || undefined,
        chartId: baziData?.chart_id || null,
      });
    }

    // ── Email-only fallback ──
    if (email && !token) {
      const verified = await checkRecentPurchases(db, email);
      if (verified) {
        return NextResponse.json({ status: "verified", email });
      }
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ status: "not_found" }, { status: 404 });
  } catch (error) {
    console.error("claim-status error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function checkRecentPurchases(db: ReturnType<typeof requireSupabaseAdmin>, email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check bazi_processed_sales for recent bazi purchases
  const { data: baziSale } = await db
    .from(TABLES.processedSales)
    .select("id, created_at")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (baziSale) {
    const age = Date.now() - new Date(baziSale.created_at).getTime();
    if (age < 10 * 60 * 1000) return true; // within 10 minutes
  }

  // Check shared processed_sales for naming purchases
  const { data: sharedSale } = await db
    .from("processed_sales")
    .select("id, created_at")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sharedSale) {
    const age = Date.now() - new Date(sharedSale.created_at).getTime();
    if (age < 10 * 60 * 1000) return true; // within 10 minutes
  }

  return false;
}
