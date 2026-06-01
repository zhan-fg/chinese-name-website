import { NameEntry } from "./types";

/**
 * Validate AI-generated name data against schema.
 * Returns the validated entry or null if invalid.
 */
export function validateName(data: unknown): NameEntry | null {
  if (!data || typeof data !== "object") return null;

  const d = data as Record<string, unknown>;

  const requiredFields = [
    "chars",
    "pinyin",
    "phonetic",
    "meaning",
    "char1",
    "char1Pinyin",
    "char1Meaning",
    "char2",
    "char2Pinyin",
    "char2Meaning",
    "sourceText",
    "sourceAttribution",
    "sourceTranslation",
    "explanation",
    "userBridge",
    "storyTitle",
    "storyBody",
  ];

  for (const field of requiredFields) {
    if (!d[field] || typeof d[field] !== "string") return null;
  }

  // Sanity: chars should be 2-3 Chinese characters (allowing space)
  const charsNoSpace = (d.chars as string).replace(/\s/g, "");
  if (charsNoSpace.length < 2 || charsNoSpace.length > 3) return null;
  if (!/^[\u4e00-\u9fff]+$/.test(charsNoSpace)) return null;

  // Sanity: story body should be reasonably substantial
  if ((d.storyBody as string).length < 60) return null;

  return d as unknown as NameEntry;
}
