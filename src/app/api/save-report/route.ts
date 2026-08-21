import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isUnauthorized, requireAuthenticatedUser } from "@/lib/auth";
import { validateName } from "@/lib/validate";

/**
 * POST /api/save-report
 * Saves a full name report after successful claim.
 * Body: { email: string, nameId: string, nameData: NameEntry }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nameId, nameData, claimToken } = body;

    if (!nameId || typeof nameId !== "string" || nameId.length > 128 || !validateName(nameData)) {
      return NextResponse.json(
        { error: "Valid nameId and nameData are required" },
        { status: 400 }
      );
    }

    let saved = false;
    let error: unknown = null;
    try {
      const user = await requireAuthenticatedUser(request);
      const result = await supabaseAdmin.rpc("save_name_report", {
        p_auth_user_id: user.id,
        p_email: user.email,
        p_name_id: nameId,
        p_name_data: nameData,
      });
      saved = result.data === true;
      error = result.error;
    } catch (authError) {
      if (!isUnauthorized(authError)) throw authError;
      if (!claimToken || typeof claimToken !== "string") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { data: claim } = await supabaseAdmin
        .from("bazi_claim_tokens")
        .select("email, chart_id")
        .eq("token", claimToken)
        .eq("status", "claimed")
        .eq("chart_id", nameId)
        .maybeSingle();
      if (!claim?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const result = await supabaseAdmin.from("name_reports").upsert({
        email: claim.email,
        name_id: nameId,
        name_data: nameData,
        updated_at: new Date().toISOString(),
      }, { onConflict: "email,name_id" });
      saved = !result.error;
      error = result.error;
    }

    if (error || !saved) {
      console.error("save-report error:", error);
      return NextResponse.json({ error: "No report entitlement" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("save-report error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
