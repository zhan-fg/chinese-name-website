import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/save-report
 * Saves a full name report after successful claim.
 * Body: { email: string, nameId: string, nameData: NameEntry }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, nameId, nameData } = await request.json();

    if (!email || !nameId || !nameData) {
      return NextResponse.json(
        { error: "email, nameId, and nameData are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Upsert: insert or update (same nameId + email = update)
    const { error } = await supabaseAdmin.from("name_reports").upsert(
      {
        email: normalizedEmail,
        name_id: nameId,
        name_data: nameData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email,name_id" }
    );

    if (error) {
      console.error("save-report error:", error);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("save-report error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
