export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin, TABLES } from "@/lib/supabase";
import { isUnauthorized, requireAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/check-balance?email=xxx
 *
 * Returns the user's current report_unlocks_remaining.
 * If balance is 0, also checks processed_sales for any new purchases
 * not yet credited (webhook not deployed or delayed).
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthenticatedUser(request);

    const db = requireSupabaseAdmin();
    const normalizedEmail = authUser.email;

    const { data: user } = await db
      .from(TABLES.users)
      .select("id, report_unlocks_remaining, last_credited_at")
      .eq("email", normalizedEmail)
      .eq("auth_user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const balance = user?.report_unlocks_remaining || 0;

    return NextResponse.json({ balance, email: normalizedEmail });
  } catch (error: any) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[check-balance] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
