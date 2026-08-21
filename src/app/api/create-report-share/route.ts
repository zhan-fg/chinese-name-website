import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isUnauthorized, requireAuthenticatedUser } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { nameId } = await request.json();
    if (!nameId || typeof nameId !== "string" || nameId.length > 128) {
      return NextResponse.json({ error: "A valid nameId is required" }, { status: 400 });
    }

    const db = requireSupabaseAdmin();
    const { data: report } = await db
      .from("name_reports")
      .select("id")
      .eq("user_id", user.id)
      .eq("name_id", nameId)
      .maybeSingle();
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { error } = await db.from("report_shares").insert({
      report_id: report.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) throw error;

    return NextResponse.json({ token });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("create-report-share error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
