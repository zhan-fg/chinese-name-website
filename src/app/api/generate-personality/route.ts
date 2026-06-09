import { NextRequest, NextResponse } from "next/server";
import { generatePersonality } from "@/lib/deepseek";

export const maxDuration = 60;

/**
 * POST /api/generate-personality
 * Phase 3: Generates premium personality content after story is ready.
 *
 * Body: { nameData: NameEntry, englishName?, selfWord?, sourceCategory, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nameData, ...req } = body;

    if (!nameData || !nameData.chars) {
      return NextResponse.json(
        { error: "nameData with at least chars field is required" },
        { status: 400 }
      );
    }

    const personality = await generatePersonality(nameData, req);

    return NextResponse.json(personality);
  } catch (error) {
    console.error("generate-personality error:", error);
    return NextResponse.json(
      {
        archetype: "The Seeker",
        archetypeDescription:
          "A personality drawn to discovery, wisdom, and the quiet pursuit of understanding.",
        englishNameConnection:
          "Your English name and Chinese name share a common spirit.",
        nativePerception:
          "To Chinese ears, this name sounds cultured and authentic.",
        blessing:
          "May wisdom guide your path and your name carry you to distant shores.",
      },
      { status: 200 }
    );
  }
}
