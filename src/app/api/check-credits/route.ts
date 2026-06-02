import { NextRequest, NextResponse } from "next/server";
import { getAvailableUses } from "@/lib/credits";

/**
 * GET /api/check-credits?anonymousId=xxx
 * Returns the user's current credit balance.
 */
export async function GET(request: NextRequest) {
  const anonymousId = request.nextUrl.searchParams.get("anonymousId");

  if (!anonymousId) {
    return NextResponse.json({ error: "anonymousId required" }, { status: 400 });
  }

  try {
    const balance = await getAvailableUses(anonymousId);
    return NextResponse.json(balance);
  } catch (error) {
    console.error("check-credits error:", error);
    // Fallback: assume user has credits (don't block on infra failure)
    return NextResponse.json({
      freeRemaining: 3,
      creditsRemaining: 0,
      totalRemaining: 3,
      isSubscriber: false,
    });
  }
}
