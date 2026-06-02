import { NextRequest, NextResponse } from "next/server";
import { getAvailableUses } from "@/lib/credits";

/**
 * GET /api/check-credits?anonymousId=xxx
 * Returns the user's current credit balance.
 * Also enforces IP-based free account limit.
 */
export async function GET(request: NextRequest) {
  const anonymousId = request.nextUrl.searchParams.get("anonymousId");

  if (!anonymousId) {
    return NextResponse.json({ error: "anonymousId required" }, { status: 400 });
  }

  // Extract client IP (Vercel provides x-forwarded-for or x-real-ip)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined;

  try {
    const balance = await getAvailableUses(anonymousId, ip);
    return NextResponse.json(balance);
  } catch (error) {
    console.error("check-credits error:", error);
    return NextResponse.json({
      freeRemaining: 3,
      creditsRemaining: 0,
      totalRemaining: 3,
      isSubscriber: false,
    });
  }
}
