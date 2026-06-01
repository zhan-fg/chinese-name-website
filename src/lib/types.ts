export type SourceCategory =
  | "poetry"
  | "elements"
  | "nature"
  | "mythology"
  | "history";

export interface GenerateNameRequest {
  sourceCategory: SourceCategory;
  englishName?: string;
  selfWord?: string;
  surname?: string; // user-selected surname or empty for auto-recommend
}

export interface SurnameOption {
  char: string;
  pinyin: string;
  phonetic: string;
  meaning: string;
  description: string; // Western-friendly description
}

export interface NameEntry {
  // Full name
  chars: string;         // "李 云 帆" (surname + given, with spaces)
  fullChars: string;     // "李云帆" (no spaces)
  surname: string;       // "李"
  surnamePinyin: string; // "Lǐ"
  surnamePhonetic: string; // "Lee"
  surnameMeaning: string;  // "plum tree"
  givenChars: string;    // "云 帆" (just the given name part)

  // Given name
  pinyin: string;        // "Yún Fān"
  phonetic: string;
  meaning: string;

  // Character breakdown
  char1: string;
  char1Pinyin: string;
  char1Meaning: string;
  char2: string;
  char2Pinyin: string;
  char2Meaning: string;

  sourceCategory: string;
  sourceText: string;
  sourceAttribution: string;
  sourceTranslation: string;
  explanation: string;
  userBridge: string;
  storyTitle: string;
  storyBody: string;
}
