import { NameEntry } from "./types";

/**
 * Validate AI-generated name data against schema.
 * Returns the validated entry or null if invalid.
 */
export function validateName(data: unknown): NameEntry | null {
  if (!data || typeof data !== "object") return null;

  const d = data as Record<string, unknown>;

  const requiredFields = [
    "surname",
    "surnamePinyin",
    "surnamePhonetic",
    "surnameMeaning",
    "givenChars",
    "fullChars",
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

  // Sanity: full chars (surname+given without spaces) should be 3-4 Chinese characters
  const fullChars = d.fullChars as string;
  if (fullChars.length < 3 || fullChars.length > 4) return null;
  if (!/^[\u4e00-\u9fff]+$/.test(fullChars)) return null;

  // Sanity: givenChars should be 2 Chinese characters (with optional space)
  const givenNoSpace = (d.givenChars as string).replace(/\s/g, "");
  if (givenNoSpace.length < 2 || givenNoSpace.length > 3) return null;
  if (!/^[\u4e00-\u9fff]+$/.test(givenNoSpace)) return null;

  // Sanity: surname should be a single Chinese character
  const surname = d.surname as string;
  if (surname.length !== 1 || !/^[\u4e00-\u9fff]$/.test(surname)) return null;

  // Sanity: story body should be reasonably substantial
  if ((d.storyBody as string).length < 60) return null;

  return d as unknown as NameEntry;
}
