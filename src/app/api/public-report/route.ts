import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/public-report?token=xxx
 * Public access requires a high-entropy, revocable share token.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token || !/^[a-zA-Z0-9_-]{32,128}$/.test(token)) {
      return NextResponse.json({ error: "A valid share token is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("get_shared_name_report", {
      p_token: token,
    });

    if (error || !data) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report: data });
  } catch (error) {
    console.error("public-report error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
