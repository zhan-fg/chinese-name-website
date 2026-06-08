import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

/**
 * POST /api/init-claim
 * Generates a one-time claim token bound to a specific nameId.
 * The token must be presented when calling /api/claim-gumroad.
 *
 * Body: { nameId: string }
 * Returns: { token: string }
 *
 * Tokens expire after 15 minutes. One token = one name unlock.
 * Prevents unauthorized claims without going through the purchase flow.
 */
export async function POST(request: NextRequest) {
  try {
    const { nameId } = await request.json();

    if (!nameId || typeof nameId !== "string") {
      return NextResponse.json(
        { error: "nameId is required" },
        { status: 400 }
      );
    }

    // Generate a random token
    const token = crypto.randomBytes(24).toString("hex");

    // Store in Supabase
    const { error } = await supabaseAdmin.from("claim_tokens").insert({
      token,
      name_id: nameId,
      status: "pending",
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    if (error) {
      console.error("Failed to store claim token:", error);
      return NextResponse.json(
        { error: "Failed to generate token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error("init-claim error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
