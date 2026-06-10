import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/public-report?nameId=xxx
 * Public endpoint — anyone can fetch a name report by its ID.
 * Used by the /share QR code landing page.
 */
export async function GET(request: NextRequest) {
  try {
    const nameId = request.nextUrl.searchParams.get("nameId");

    if (!nameId) {
      return NextResponse.json({ error: "nameId is required" }, { status: 400 });
    }

    // Get the most recent report for this nameId (any email)
    const { data, error } = await supabaseAdmin
      .from("name_reports")
      .select("name_data")
      .eq("name_id", nameId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report: data.name_data });
  } catch (error) {
    console.error("public-report error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
