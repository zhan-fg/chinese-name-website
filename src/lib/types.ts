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
}

export interface NameEntry {
  chars: string;
  pinyin: string;
  phonetic: string;
  meaning: string;
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
