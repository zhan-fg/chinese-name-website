import { NextRequest, NextResponse } from "next/server";
import { generateName } from "@/lib/deepseek";
import { calculateBazi, formatBaziForPrompt } from "@/lib/bazi";
import { deductUse } from "@/lib/credits";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sourceCategory,
      englishName,
      selfWord,
      surname,
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute,
      birthLocation,
      anonymousId,
    } = body;

    if (!sourceCategory) {
      return NextResponse.json(
        { error: "sourceCategory is required" },
        { status: 400 }
      );
    }

    const validCategories = [
      "poetry",
      "elements",
      "nature",
      "mythology",
      "history",
    ];
    if (!validCategories.includes(sourceCategory)) {
      return NextResponse.json(
        {
          error: `Invalid sourceCategory. Must be one of: ${validCategories.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Calculate Bazi if birth data is provided
    let baziPrompt: string | undefined;
    if (
      sourceCategory === "elements" &&
      birthYear &&
      birthMonth &&
      birthDay &&
      birthHour !== undefined
    ) {
      try {
        const bazi = calculateBazi({
          year: birthYear,
          month: birthMonth,
          day: birthDay,
          hour: birthHour,
          minute: birthMinute || 0,
          location: birthLocation || undefined,
        });
        baziPrompt = formatBaziForPrompt(bazi);
      } catch (err) {
        console.error("Bazi calculation failed:", err);
      }
    }

    const result = await generateName(
      {
        sourceCategory,
        englishName: englishName?.trim() || undefined,
        selfWord: selfWord?.trim() || undefined,
        surname: surname?.trim() || undefined,
        birthYear: birthYear || undefined,
        birthMonth: birthMonth || undefined,
        birthDay: birthDay || undefined,
        birthHour: birthHour ?? undefined,
        birthMinute: birthMinute || undefined,
        birthLocation: birthLocation?.trim() || undefined,
      },
      baziPrompt
    );

    // Deduct credit after successful generation
    if (anonymousId) {
      try {
        await deductUse(anonymousId);
      } catch (err) {
        console.error("Failed to deduct credit:", err);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
