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
  const timeout = setTimeout(() => controller.abort(), 60000);

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
  baziPrompt?: string,
  excludeNames?: string[]
): Promise<NameEntry> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (!apiKey || apiKey === "your_deepseek_api_key_here") {
    return { ...getFallbackName(req.sourceCategory, excludeNames), _fallback: true } as NameEntry;
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
  "sourceTranslation": "elegant English translation of the source text"
}`;

  try {
    const result = await callDeepSeek(prompt, apiKey, baseUrl, 600);
    return validateAndReturn(result, req.sourceCategory);
  } catch (error) {
    console.error("generateName failed:", error);
    return { ...getFallbackName(req.sourceCategory, excludeNames), _fallback: true } as NameEntry;
  }
}

// ============================================================
// Phase 2: Generate rich story (slower, ~2000 tokens)
// ============================================================

const storyPrompts: Record<string, string> = {
  poetry: `You are a literary scholar explaining classical Chinese poetry to a Western audience.

Write a rich, detailed "What it means" analysis AND a "Full Story" for this name inspired by classical poetry.

The user's name comes from this source line: "{sourceText}" by {sourceAttribution}.

WHAT IT MEANS — write 120-180 words covering:
1. The literal meaning of the poem line(s) — translate each phrase for a Western reader
2. The poetic devices used (metaphor, imagery, parallelism) and what they convey
3. The emotional core of the poem — what the poet was feeling (homesickness, longing, joy, despair, ambition)
4. Why these specific characters were chosen for THIS name — what quality do they bestow?
5. A Western cultural parallel (Shakespeare sonnet, Greek lyric, Romantic poetry, etc.)

USER BRIDGE — one vivid, personal sentence connecting the name's essence to the user's identity. "If this name speaks to you, you are someone who..."

FULL STORY — write 200-300 words as a podcast narrative covering:
1. The poet's life at the time of writing — age, circumstances, political situation, personal struggles
2. Where and when was it written? What was happening in China at that time?
3. The poem's journey through history — how it was received, why it endured, who quoted it
4. What this poem means to Chinese people TODAY — why every schoolchild knows it
5. How these characters capture something universal about the human experience — what can a Western reader take away?
End with a poetic, memorable closing line.`,

  elements: `You are a scholar of Chinese metaphysics and philosophy.

Write a rich "What it means" and "Full Story" for this name inspired by the Five Elements (Wu Xing).

Source: {sourceText} from {sourceAttribution}

WHAT IT MEANS — 120-180 words:
1. Explain the Five Element this name embodies — its qualities, season, direction, organ, emotion
2. The specific characters chosen — what element does each represent? How do they interact?
3. The philosophical principle behind this combination (generating cycle? controlling cycle?)
4. How this name would balance or enhance the bearer's elemental constitution
5. A Western parallel — think Greek humors, Jungian archetypes, or Ayurvedic doshas

USER BRIDGE — one sentence: "If this name resonates with you, your character carries the energy of..."

FULL STORY — 200-300 words:
1. Origins of Wu Xing theory in Chinese civilization — from 尚书 to traditional medicine
2. How the Chinese have used elemental naming for thousands of years — imperial names, scholarly names
3. The specific element's role in Chinese cosmology — what did ancient philosophers say about it?
4. Modern relevance — how these concepts still influence Chinese medicine, feng shui, martial arts
5. What it means to bear an elemental name today — a closing reflection`,

  nature: `You are a scholar of Chinese landscape poetry and natural philosophy.

Write a rich "What it means" and "Full Story" for this nature-inspired name.

Source: {sourceText} from {sourceAttribution}

WHAT IT MEANS — 120-180 words:
1. The natural phenomenon or landscape feature this name references
2. Its symbolic meaning in Chinese culture — what does a mountain/river/star/season represent?
3. How the specific characters capture the essence of this natural element
4. The Daoist/Buddhist/Confucian perspective on humans and nature reflected here
5. A Western parallel — Romantic poetry, Transcendentalism, or nature writing

USER BRIDGE — one sentence connecting nature to character.

FULL STORY — 200-300 words:
1. The specific landscape or natural feature in Chinese geography/history
2. Famous poets or philosophers who wrote about it
3. Its role in Chinese art — landscape painting (山水画), poetry, garden design
4. The philosophical meaning — what does nature teach us according to Chinese thought?
5. Why this natural name matters in our urban, digital age`,

  mythology: `You are a scholar of Chinese mythology and folklore.

Write a rich "What it means" and "Full Story" for this myth-inspired name.

Source: {sourceText} from {sourceAttribution}

WHAT IT MEANS — 120-180 words:
1. The mythical creature, deity, or legendary figure this name references
2. Its origin story — which text first mentions it? (山海经, 庄子, 楚辞, etc.)
3. What powers, qualities, or virtues does it embody?
4. How the characters capture this mythical essence
5. A Western parallel — Greek/Roman/Norse myth equivalent

USER BRIDGE — one sentence connecting myth to identity.

FULL STORY — 200-300 words:
1. The full origin myth — tell the story dramatically, with vivid imagery
2. Variations of the myth across different regions/dynasties
3. How this myth shaped Chinese culture — art, literature, idioms, festivals
4. Modern cultural presence — films, games, novels that reference this myth
5. The universal theme — what human truth does this myth express?`,

  history: `You are a historian specializing in Chinese civilization.

Write a rich "What it means" and "Full Story" for this historically-inspired name.

Source: {sourceText} from {sourceAttribution}

WHAT IT MEANS — 120-180 words:
1. The historical figure — who were they? Which dynasty? What did they achieve?
2. Their 字 (courtesy name) or 号 (art name) — the tradition of multiple names in Chinese culture
3. The specific characters chosen — how they reflect the figure's character or legacy
4. Why this historical figure matters — their contribution to Chinese civilization
5. A Western parallel — comparable Western historical figure

USER BRIDGE — one sentence linking history to personal identity.

FULL STORY — 200-300 words:
1. The historical context — what was China like during this person's lifetime?
2. Key moments in their life — decisive battles, famous writings, political intrigues
3. Their legacy — how are they remembered? Temples, festivals, idioms, school textbooks?
4. Controversies or debates — what do modern historians argue about?
5. What their life teaches us today — the timeless lesson`,

  fallback: `You are a Chinese cultural scholar writing for Western readers.

Write a rich "What it means" and "Full Story" for this name: {chars} ({meaning}).

WHAT IT MEANS — 120-180 words:
1. The cultural resonance of these characters — what do they evoke in Chinese tradition?
2. Character-by-character analysis — the layered meanings of each
3. How Chinese names carry aspirations — what a parent hopes for their child
4. A Western parallel that helps a non-Chinese reader understand

USER BRIDGE — one vivid sentence.

FULL STORY — 200-300 words:
1. The broader cultural context these characters inhabit
2. Historical usage — who else bore similar names? What did they achieve?
3. The name in literature, art, or philosophy
4. What these characters mean in modern China
5. A closing reflection on why names matter across cultures`,
};

export async function generateStory(
  nameData: NameEntry,
  req: GenerateNameRequest,
  baziPrompt?: string
): Promise<Partial<NameEntry>> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (!apiKey || apiKey === "your_deepseek_api_key_here") {
    return {
      explanation: "This name draws from centuries of Chinese literary and philosophical tradition.",
      userBridge: "This name was chosen for its deep cultural resonance across Chinese history.",
      storyTitle: "A Name from Ancient China",
      storyBody:
        "Chinese names are not mere labels — they are vessels of meaning, carrying the weight of poetry, philosophy, and ancestral hopes. This name was selected from classical sources, each character chosen for its layered significance and its harmony with the bearer's essence. The tradition of meaningful naming stretches back over three thousand years, from oracle bones to imperial courts to modern families seeking connection to their heritage.",
    };
  }

  // Build category-specific prompt
  let template =
    storyPrompts[req.sourceCategory] || storyPrompts.fallback;

  template = template
    .replace(/{sourceText}/g, nameData.sourceText || "")
    .replace(/{sourceAttribution}/g, nameData.sourceAttribution || "")
    .replace(/{chars}/g, nameData.chars || "")
    .replace(/{meaning}/g, nameData.meaning || "")
    .replace(/{surname}/g, nameData.surname || "")
    .replace(/{surnameMeaning}/g, nameData.surnameMeaning || "");

  const prompt = `Chinese cultural scholar writing for a Western audience.

Name: ${nameData.chars} (${nameData.meaning})
Surname: ${nameData.surname} (${nameData.surnameMeaning})
Source text: ${nameData.sourceText}
Attribution: ${nameData.sourceAttribution}
Category: ${req.sourceCategory}
${personalization(req)}
${baziPrompt ? "BAZI context: " + baziPrompt : ""}

${template}

IMPORTANT WRITING GUIDELINES:
- Write as if narrating a documentary or podcast — engaging, warm, authoritative
- Use vivid imagery and emotional language. Make the reader FEEL the story.
- Assume the reader knows NOTHING about Chinese culture — explain everything clearly.
- Use Western cultural references as bridges (Shakespeare, Greek myths, Tolkien, etc.)
- Never be generic or vague. Every sentence should add new information.
- End with a memorable, resonant closing line.

Return ONLY this JSON:
{
  "explanation": "120-180 words. What this name means on multiple levels: literal, poetic, philosophical, personal.",
  "userBridge": "One vivid sentence connecting this name's essence to the user's identity or character.",
  "storyTitle": "A compelling, specific title (max 8 words) that captures the essence of the story.",
  "storyBody": "200-300 words. A rich narrative: origins, historical context, cultural significance, modern relevance. Tell a STORY, not just facts."
}`;

  try {
    const result = await callDeepSeek(prompt, apiKey, baseUrl, 2500);
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
        "Chinese names are not just labels — they are capsules of history, poetry, and philosophy. This name draws from sources that have shaped Chinese civilization for thousands of years, connecting its bearer to an unbroken chain of cultural memory stretching from antiquity to the present day.",
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
    explanation: (data.explanation as string) || "",
    userBridge: (data.userBridge as string) || "",
    storyTitle: (data.storyTitle as string) || "",
    storyBody: (data.storyBody as string) || "",
    _storyLoading: true,
  } as unknown as NameEntry;
}
