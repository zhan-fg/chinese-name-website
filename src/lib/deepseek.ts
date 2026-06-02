import { GenerateNameRequest, NameEntry } from "./types";
import { getFallbackName } from "@/data/names";

const categoryGuides: Record<string, string> = {
  poetry: `Classical Chinese poetry (Tang/Song). Extract 2 characters from a real poem by Li Bai, Du Fu, Wang Wei, Su Shi, or Li Qingzhao. Cite the exact line.`,
  elements: `Five Elements (Wu Xing). Use chars that embody: Water 水(润,渊,涵), Fire 火(炎,煜,烨), Wood 木(森,荣,栋), Metal 金(铭,钧,锋), Earth 土(坤,垚,坚). Source from 尚书·洪范 or 黄帝内经.`,
  nature: `Natural world: stars, oceans, mountains, rivers, seasons. From landscape poetry and geography.`,
  mythology: `Chinese mythology: dragons, phoenixes, Kun-Peng, immortals. From Shanhaijing, Zhuangzi, Chuci.`,
  history: `Real historical figures: courtesy names (字) or epithets of generals, poets, philosophers.`,
};

const surnameGuide = `SUPER-COMMON: 李(Lǐ/Lee), 王(Wáng/Wahng), 张(Zhāng/Jahng), 刘(Liú/Lyoh), 陈(Chén/Chun), 杨(Yáng/Yahng), 赵(Zhào/Jow), 黄(Huáng/Hwahng), 周(Zhōu/Joe), 吴(Wú/Woo), 林(Lín/Leen), 马(Mǎ/Mah)`;

function personalization(req: GenerateNameRequest): string {
  return [
    req.englishName && `English name: "${req.englishName}".`,
    req.selfWord && `Self-description: "${req.selfWord}".`,
    req.surname
      ? `Use surname: ${req.surname}.`
      : `Pick surname from: ${surnameGuide}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

async function callDeepSeek(
  prompt: string,
  apiKey: string,
  baseUrl: string,
  maxTokens: number
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DeepSeek ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// Phase 1: Generate name + source (fast, <500 tokens)
// ============================================================

export async function generateName(
  req: GenerateNameRequest,
  baziPrompt?: string
): Promise<NameEntry> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (!apiKey || apiKey === "your_deepseek_api_key_here") {
    return { ...getFallbackName(req.sourceCategory), _fallback: true } as NameEntry;
  }

  const prompt = `Chinese name scholar. Generate a SURNAME + 2-char GIVEN NAME.

CATEGORY: ${categoryGuides[req.sourceCategory]}
${personalization(req)}
${baziPrompt ? "BAZI: " + baziPrompt + "\nSupplement WEAK elements." : ""}

Return ONLY this JSON:
{
  "surname": "姓",
  "surnamePinyin": "with tone",
  "surnamePhonetic": "English-friendly",
  "surnameMeaning": "brief",
  "givenChars": "字 字",
  "fullChars": "姓氏",
  "chars": "姓 字 字",
  "pinyin": "with tones",
  "phonetic": "English-friendly",
  "meaning": "3-5 words",
  "char1": "字1",
  "char1Pinyin": "pinyin",
  "char1Meaning": "English",
  "char2": "字2",
  "char2Pinyin": "pinyin",
  "char2Meaning": "English",
  "sourceText": "original Chinese source line",
  "sourceAttribution": "Chinese + English (author, work, era)",
  "sourceTranslation": "elegant English translation"
}`;

  try {
    const result = await callDeepSeek(prompt, apiKey, baseUrl, 600);
    return validateAndReturn(result, req.sourceCategory);
  } catch (error) {
    console.error("generateName failed:", error);
    return { ...getFallbackName(req.sourceCategory), _fallback: true } as NameEntry;
  }
}

// ============================================================
// Phase 2: Generate story (slower, ~800 tokens)
// Called AFTER the name is already shown to the user
// ============================================================

export async function generateStory(
  nameData: NameEntry,
  req: GenerateNameRequest,
  baziPrompt?: string
): Promise<Partial<NameEntry>> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (!apiKey || apiKey === "your_deepseek_api_key_here") {
    // Return empty story fields — frontend shows fallback text
    return {
      explanation: "This name draws from classical Chinese tradition.",
      userBridge: "This name was chosen for its timeless cultural resonance.",
      storyTitle: "A Name from Ancient China",
      storyBody:
        "This name combines characters with deep roots in Chinese civilization, carrying meanings that have resonated across centuries.",
    };
  }

  const prompt = `Chinese cultural scholar. Write narrative content for this name:

Name: ${nameData.chars} (${nameData.meaning})
Surname: ${nameData.surname} (${nameData.surnameMeaning})
Source: ${nameData.sourceText}
Attribution: ${nameData.sourceAttribution}
Category: ${req.sourceCategory}
${personalization(req)}
${baziPrompt ? "BAZI context: " + baziPrompt : ""}

Use Western analogies (Shakespeare, Greek myths, Tolkien, MBTI). 
Keep it vivid and emotional.

Return ONLY this JSON:
{
  "explanation": "30-50 words. Western analogy. 'Think of this like...'",
  "userBridge": "One sentence: 'If you chose this name, you're the kind of person who...'",
  "storyTitle": "max 6 words",
  "storyBody": "80-120 words. Podcast narrative: who created this, when, under what circumstances, what does it mean today."
}`;

  try {
    const result = await callDeepSeek(prompt, apiKey, baseUrl, 900);
    return {
      explanation: (result.explanation as string) || "",
      userBridge: (result.userBridge as string) || "",
      storyTitle: (result.storyTitle as string) || "",
      storyBody: (result.storyBody as string) || "",
    };
  } catch (error) {
    console.error("generateStory failed:", error);
    return {
      explanation: "A name rooted in centuries of Chinese literary tradition.",
      userBridge: "This name carries the weight of Chinese cultural history.",
      storyTitle: "An Ancient Legacy",
      storyBody:
        "Chinese names are not just labels — they are capsules of history, poetry, and philosophy. This name draws from sources that have shaped Chinese civilization for thousands of years.",
    };
  }
}

// ============================================================
// Validation
// ============================================================

function validateAndReturn(
  data: Record<string, unknown>,
  category: string
): NameEntry {
  const required = [
    "surname",
    "fullChars",
    "pinyin",
    "meaning",
    "sourceText",
    "sourceTranslation",
  ];
  for (const f of required) {
    if (!data[f] || typeof data[f] !== "string") {
      throw new Error(`Missing required field: ${f}`);
    }
  }

  const fullChars = data.fullChars as string;
  if (fullChars.length < 2 || fullChars.length > 4) {
    throw new Error(`Invalid fullChars length: ${fullChars.length}`);
  }

  return {
    ...data,
    sourceCategory: category,
    // Placeholder story fields — will be filled by generateStory
    explanation: (data.explanation as string) || "",
    userBridge: (data.userBridge as string) || "",
    storyTitle: (data.storyTitle as string) || "",
    storyBody: (data.storyBody as string) || "",
    // Flag that story is pending
    _storyLoading: true,
  } as unknown as NameEntry;
}
