import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isUnauthorized, requireAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/my-reports?email=xxx
 * Returns all unlocked name reports for the given email.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);

    const { data, error } = await supabaseAdmin
      .from("name_reports")
      .select("name_id, name_data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("my-reports error:", error);
      return NextResponse.json({ reports: [] });
    }

    return NextResponse.json({
      reports: (data || []).map((r) => ({
        nameId: r.name_id,
        nameData: r.name_data,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("my-reports error:", error);
    return NextResponse.json({ reports: [] });
  }
}
