import { GenerateNameRequest, NameEntry } from "./types";
import { getFallbackName } from "@/data/names";

const categoryGuides: Record<string, string> = {
  poetry: `Classical Chinese poetry (Tang/Song dynasty). Find a real poem, 
extract 2 characters that form a beautiful given name. Prioritize poems by Li Bai, 
Du Fu, Wang Wei, Su Shi, Li Qingzhao.`,

  elements: `Five Elements philosophy (Wu Xing). Use characters that embody: 
Water 水 (润, 渊, 涵), Fire 火 (炎, 煜, 烨), Wood 木 (森, 荣, 栋), 
Metal 金 (铭, 钧, 锋), Earth 土 (坤, 垚, 坚).
sourceText MUST come from 尚书·洪范 or 黄帝内经, NOT poetry.`,

  nature: `Natural world: stars, oceans, mountains, rivers, seasons. Draw from 
landscape poetry and real geographical names.`,

  mythology: `Chinese mythology: dragons, phoenixes, Kun-Peng, immortals. 
Use names from Shanhaijing, Zhuangzi, Chuci.`,

  history: `Real historical figures: generals, poets, philosophers. Use their 
courtesy names (字) or evocative epithets.`,
};

const surnameGuide = `SUPER-COMMON SURNAMES: 李(Lǐ/Lee), 王(Wáng/Wahng), 张(Zhāng/Jahng), 
刘(Liú/Lyoh), 陈(Chén/Chun), 杨(Yáng/Yahng), 赵(Zhào/Jow), 
黄(Huáng/Hwahng), 周(Zhōu/Joe), 吴(Wú/Woo), 林(Lín/Leen), 马(Mǎ/Mah)`;

export async function generateName(
  req: GenerateNameRequest,
  baziPrompt?: string
): Promise<NameEntry> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (!apiKey || apiKey === "your_deepseek_api_key_here") {
    console.warn("DeepSeek API key not configured — using fallback");
    return { ...getFallbackName(req.sourceCategory), _fallback: true } as NameEntry;
  }

  const { sourceCategory, englishName, selfWord, surname } = req;

  const personalization = [
    englishName && `User's English name: "${englishName}".`,
    selfWord && `User's self-description: "${selfWord}".`,
    surname
      ? `Use surname: ${surname}.`
      : `Pick a surname from: ${surnameGuide}.`,
  ].filter(Boolean).join(" ");

  const prompt = `You are a Chinese cultural scholar. Create a Chinese name (surname + 2-character given name) for a Western audience.

CATEGORY: ${categoryGuides[sourceCategory]}
${surnameGuide}
${personalization}
${baziPrompt ? "BAZI: " + baziPrompt + "\nSupplement the WEAK elements identified above." : ""}

Return ONLY this JSON (no markdown, keep storyBody under 100 words):
{
  "surname": "单姓",
  "surnamePinyin": "with tone",
  "surnamePhonetic": "English-friendly",
  "surnameMeaning": "brief meaning",
  "givenChars": "two chars with space",
  "fullChars": "no spaces",
  "chars": "with spaces",
  "pinyin": "with tone marks",
  "phonetic": "English-friendly",
  "meaning": "3-5 English words",
  "char1": "first char",
  "char1Pinyin": "pinyin",
  "char1Meaning": "English",
  "char2": "second char",
  "char2Pinyin": "pinyin",
  "char2Meaning": "English",
  "sourceText": "original Chinese source",
  "sourceAttribution": "Chinese + English",
  "sourceTranslation": "elegant English",
  "explanation": "30-50 words, use Western analogy",
  "userBridge": "If you chose this name, you're the kind of person who...",
  "storyTitle": "max 6 words",
  "storyBody": "60-100 words. Vivid, emotional. Who created this and why does it matter."
}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

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
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`DeepSeek API ${response.status}: ${errText.slice(0, 300)}`);
      return { ...getFallbackName(sourceCategory), _fallback: true } as NameEntry;
    }

    const data = await response.json();
    const raw = JSON.parse(data.choices[0].message.content);

    // Lightweight validation
    const required = ["surname", "fullChars", "pinyin", "meaning", "sourceText", "storyBody"];
    for (const f of required) {
      if (!raw[f] || typeof raw[f] !== "string") {
        console.warn(`Missing field: ${f}`);
        return { ...getFallbackName(sourceCategory), _fallback: true } as NameEntry;
      }
    }
    if (raw.fullChars.length < 2 || raw.fullChars.length > 4) {
      return { ...getFallbackName(sourceCategory), _fallback: true } as NameEntry;
    }

    return { ...raw, sourceCategory } as NameEntry;
  } catch (error) {
    console.error("Generation failed:", error);
    return { ...getFallbackName(sourceCategory), _fallback: true } as NameEntry;
  }
}
