export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin, TABLES } from "@/lib/supabase";

/**
 * GET /api/claim-status?token=xxx&email=yyy
 *
 * Polled by the frontend after Gumroad payment.
 * Primary: checks if Gumroad Ping has verified the claim token.
 * Checks the claim token created immediately before checkout.
 */
export async function GET(request: NextRequest) {
  try {
    const db = requireSupabaseAdmin();
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }

    if (token) {
      const { data: baziData } = await db
        .from(TABLES.claimTokens)
        .select("status, email, chart_id")
        .eq("token", token)
        .maybeSingle();

      if (baziData) {
        return NextResponse.json({
          status: baziData.status,
          email: baziData.email || undefined,
          chartId: baziData.chart_id,
        });
      }

      const { data: sharedData } = await db
        .from("claim_tokens")
        .select("status, email, name_id")
        .eq("token", token)
        .maybeSingle();

      if (sharedData) {
        return NextResponse.json({
          status: sharedData.status,
          email: sharedData.email || undefined,
          nameId: sharedData.name_id,
        });
      }

      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ status: "not_found" }, { status: 404 });
  } catch (error) {
    console.error("claim-status error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
