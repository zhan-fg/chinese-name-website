import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/my-reports?email=xxx
 * Returns all unlocked name reports for the given email.
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data, error } = await supabaseAdmin
      .from("name_reports")
      .select("name_id, name_data, created_at")
      .eq("email", normalizedEmail)
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
    console.error("my-reports error:", error);
    return NextResponse.json({ reports: [] });
  }
}
