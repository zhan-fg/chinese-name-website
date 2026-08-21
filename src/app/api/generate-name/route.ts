import { NextRequest, NextResponse } from "next/server";
import { generateName } from "@/lib/deepseek";
import { calculateBazi, formatBaziForPrompt } from "@/lib/bazi";
import { completeGeneration, refundGeneration, reserveGeneration } from "@/lib/usage";
import crypto from "crypto";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let requestId = "";
  let reserved = false;
  try {
    const body = await request.json();
    const {
      sourceCategory,
      englishName,
      selfWord,
      surname,
      gender,
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute,
      birthLocation,
      anonymousId,
      excludeNames,
      requestId: clientRequestId,
    } = body;

    if (!anonymousId || typeof anonymousId !== "string" || anonymousId.length > 128) {
      return NextResponse.json({ error: "A valid anonymousId is required" }, { status: 401 });
    }

    requestId = typeof clientRequestId === "string" && /^[a-zA-Z0-9_-]{16,128}$/.test(clientRequestId)
      ? clientRequestId
      : crypto.randomUUID();

    if (!sourceCategory) {
      return NextResponse.json(
        { error: "sourceCategory is required" },
        { status: 400 }
      );
    }

    const validCategories = ["poetry", "elements", "nature", "mythology", "history"];
    if (!validCategories.includes(sourceCategory)) {
      return NextResponse.json(
        { error: `Invalid sourceCategory. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

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

    await reserveGeneration(anonymousId, requestId);
    reserved = true;

    const result = await generateName(
      {
        sourceCategory,
        englishName: englishName?.trim() || undefined,
        selfWord: selfWord?.trim() || undefined,
        surname: surname?.trim() || undefined,
        gender: gender || undefined,
        birthYear: birthYear || undefined,
        birthMonth: birthMonth || undefined,
        birthDay: birthDay || undefined,
        birthHour: birthHour ?? undefined,
        birthMinute: birthMinute || undefined,
        birthLocation: birthLocation?.trim() || undefined,
      },
      baziPrompt,
      Array.isArray(excludeNames) ? excludeNames : undefined
    );

    await completeGeneration(requestId);
    return NextResponse.json({ ...result, requestId });
  } catch (error) {
    console.error("API route error:", error);
    if (reserved && requestId) await refundGeneration(requestId);
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "No generations remaining" }, { status: 402 });
    }
    if (error instanceof Error && error.message === "USAGE_SERVICE_UNAVAILABLE") {
      return NextResponse.json({ error: "Usage service unavailable" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
