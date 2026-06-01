import { NextRequest, NextResponse } from "next/server";
import { generateName } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceCategory, englishName, selfWord, surname } = body;

    if (!sourceCategory) {
      return NextResponse.json(
        { error: "sourceCategory is required" },
        { status: 400 }
      );
    }

    const validCategories = ["poetry", "elements", "nature", "mythology", "history"];
    if (!validCategories.includes(sourceCategory)) {
      return NextResponse.json(
        {
          error: `Invalid sourceCategory. Must be one of: ${validCategories.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const result = await generateName({
      sourceCategory,
      englishName: englishName?.trim() || undefined,
      selfWord: selfWord?.trim() || undefined,
      surname: surname?.trim() || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
