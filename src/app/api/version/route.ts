import { NextResponse } from "next/server";

/**
 * GET /api/version
 * Returns the deployed git commit hash and build time.
 * Vercel auto-injects VERCEL_GIT_COMMIT_SHA during build.
 */
export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    buildTime: new Date().toISOString(),
    env: process.env.VERCEL_ENV || "unknown",
  });
}
