export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin, TABLES } from "@/lib/supabase";
import crypto from "crypto";

/**
 * POST /api/init-claim
 * Generates a one-time claim token bound to exactly one report or chart.
 *
 * Body: { chartId: string } or { nameId: string }
 * Returns: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const db = requireSupabaseAdmin();
    const { chartId, nameId } = await request.json();
    const isChart = typeof chartId === "string" && chartId.length > 0;
    const isReport = typeof nameId === "string" && nameId.length > 0;
    const contentId = isChart ? chartId : nameId;

    if (isChart === isReport || !contentId || contentId.length > 128) {
      return NextResponse.json({ error: "chartId or nameId is required" }, { status: 400 });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const table = isChart ? TABLES.claimTokens : "claim_tokens";
    const contentColumn = isChart ? "chart_id" : "name_id";
    const { error } = await db.from(table).insert({
      token,
      [contentColumn]: contentId,
      status: "pending",
      expires_at: expiresAt,
    });

    if (error) {
      console.error(`Failed to store ${isChart ? "chart" : "report"} claim token:`, error);
      return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
    }

    return NextResponse.json({ token, productType: isChart ? "chart" : "report" });
  } catch (error) {
    console.error("init-claim error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
