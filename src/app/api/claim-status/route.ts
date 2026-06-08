import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/claim-status?token=xxx
 *
 * Polled by the frontend after Gumroad payment.
 * Returns whether the claim token has been verified by Gumroad Ping.
 *
 * Response:
 *   { status: "pending" | "verified", email?: string }
 *
 * When status="verified", the frontend can auto-claim without asking for email.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("claim_tokens")
      .select("status, email, name_id")
      .eq("token", token)
      .single();

    if (error || !data) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      status: data.status, // "pending" | "verified" | "claimed" | "expired"
      email: data.email || undefined,
      nameId: data.name_id,
    });
  } catch (error) {
    console.error("claim-status error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
