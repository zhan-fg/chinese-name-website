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
${req.gender ? `GENDER: ${req.gender === "male" ? "Masculine name. Choose characters that evoke strength, ambition, wisdom, dignity, or scholarly depth. The name should feel bold, grounded, and timeless — think of generals, poets, philosophers. Avoid delicate or ornamental characters." : req.gender === "female" ? "Feminine name. Choose characters that evoke grace, intelligence, beauty, or quiet strength. The name should feel elegant, luminous, and refined — think of poets, artists, scholars. Avoid harsh or aggressive characters." : "Gender-neutral name. Choose characters with balanced, universal appeal — neither distinctly masculine nor feminine."}` : ""}
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
  // ── POETRY: Literary analysis of classical poems ──
  poetry: `You are a literary scholar explaining classical Chinese poetry to a Western audience.

This name is drawn from: "{sourceText}" — by {sourceAttribution}.

WHAT IT MEANS — write 150-200 words covering:
1. Translate the source line phrase-by-phrase for a reader who knows zero Chinese. What does each character/image mean literally?
2. What poetic device is at work? (metaphor, juxtaposition, allusion, parallelism, personification?) How does the device create meaning?
3. The poet's emotional state when writing — were they exiled? drunk with friends? mourning? celebrating? What specific biographical detail makes this line hit harder?
4. Why THESE characters were extracted for this name — what quality do they bestow on the bearer?
5. A precise Western parallel — name a specific Shakespeare sonnet, Keats ode, or Sappho fragment that works the same way. Not "like Romantic poetry" — name the exact work.

USER BRIDGE — one vivid, personal sentence. "If this name speaks to you, you are someone who..."

FULL STORY — write 300-400 words as a rich narrative:
1. SET THE SCENE: Where is the poet? What year? What dynasty? What does the landscape look like? The weather? The time of day? Paint the picture.
2. THE POET'S LIFE: What was happening in their life at this exact moment — their age, career, political situation, personal relationships. Give specific biographical details, not generalizations.
3. HISTORICAL BACKDROP: What was China like then? War? Peace? Cultural flowering? Decline? Connect the poem to its historical moment.
4. THE POEM'S JOURNEY: How was it received? Who preserved it? Which emperors quoted it? How did it survive 1000+ years to reach us?
5. WHY IT STILL MATTERS: What does this poem say to a person in 2024? What universal human experience does it capture that transcends time and culture?
End with the poem's most powerful line as a closing quote.`,

  // ── ELEMENTS: Wu Xing philosophy, cosmology, metaphysics ──
  elements: `You are a master of Chinese metaphysics — the Five Elements (Wu Xing 五行), Yin-Yang theory, the I Ching (易经), and traditional Chinese cosmology. You are NOT a poetry scholar.

This name is built on Five Elements principles. Source context: {sourceText} from {sourceAttribution}.

WHAT IT MEANS — write 150-200 words:
1. Identify which Element(s) these characters embody (Wood 木, Fire 火, Earth 土, Metal 金, Water 水). Explain WHY — what about each character's radical, etymology, or traditional association maps to that element?
2. The Five Elements are a system of CYCLES. Does this name use the Generating cycle (生: Wood→Fire→Earth→Metal→Water→Wood) or the Controlling cycle (克: Wood→Earth→Water→Fire→Metal→Wood)? What does this combination MEAN for the bearer's destiny?
3. Each element governs specific organs (Water=Kidney, Fire=Heart, Wood=Liver, Metal=Lung, Earth=Spleen), emotions (Water=Fear, Fire=Joy, Wood=Anger, Metal=Grief, Earth=Worry), seasons, directions, colors, tastes. What does this name's elemental profile say about the bearer's constitutional tendencies?
4. How would a traditional Chinese doctor or feng shui master interpret this name? What balance or imbalance does it address?
5. Western parallel: don't just say "Greek humors." Compare specifically — how is Wu Xing's Wood element different from the Sanguine humor? How is it similar to Jung's concept of archetypes or the Myers-Briggs cognitive functions?

USER BRIDGE — "If this name resonates with you, your elemental constitution carries the energy of..."

FULL STORY — write 300-400 words:
1. ORIGINS: Wu Xing theory didn't start as philosophy. It began with practical observation — farmers watching seasons cycle, doctors mapping organs to elements, generals applying it to strategy. Trace how it emerged from the Warring States period through texts like 尚书·洪范 and 黄帝内经.
2. THE ELEMENT'S PERSONALITY: Give the specific element(s) in this name a PERSONALITY. If Water were a person, what would they be like? What would Wood value? Make the element come alive as a character.
3. COSMIC APPLICATION: How does Wu Xing explain EVERYTHING in traditional Chinese thought? Dynastic cycles (each dynasty ruled by an element), music (五音 five tones), food (五味 five flavors), even time itself (五季 five seasons). Show the reader how vast this system is.
4. LIVING TRADITION: Wu Xing is not dead history. Walk into any Chinese medicine clinic and the doctor checks your elemental balance. Walk into a feng shui consultation and the master reads the elements of your space. Modern martial artists still train according to elemental principles. Give concrete examples.
5. WHAT YOUR NAME MEANS: Return to the name. What does it mean to bear an elemental name in the 21st century? How does this ancient wisdom apply to modern life?`,

  // ── NATURE: Astronomy, geography, feng shui, natural science ──
  nature: `You are a scholar of Chinese astronomy, geography, feng shui (风水), and natural philosophy. You are NOT a poetry analyst. You do not talk about "landscape poetry" — you talk about actual stars, mountains, rivers, weather patterns, and how ancient Chinese understood the physical universe.

This name draws from the natural world. Source context: {sourceText} from {sourceAttribution}.

WHAT IT MEANS — write 150-200 words:
1. Identify the SPECIFIC natural phenomenon: if it's a star — which one? (北斗? 紫微? 二十八宿?) If it's a mountain — which one? (五岳: 泰山, 华山, 衡山, 恒山, 嵩山?) If it's water — which river or sea? Be specific, not generic.
2. What is the SCIENTIFIC or GEOGRAPHICAL reality behind this name? If the name means "Ocean," talk about how ancient Chinese viewed the Eastern Sea (东海) — not as poetic metaphor but as a real geographical entity with trade routes, naval history, and mythological significance.
3. In Chinese cosmology, nature is not separate from humanity — it's a single living system (天人合一). How does this specific natural element fit into that worldview?
4. Feng shui (风水) connection: what does this natural element mean in terms of qi flow, site selection, or spatial harmony? If the name evokes mountains, talk about 靠山 (backing mountain). If water, talk about 水为财 (water as wealth).
5. Western parallel: compare to a specific concept from Western science or philosophy — not poetry. Think: the Ancient Greek understanding of the four elements, Native American land philosophy, or modern ecology.

USER BRIDGE — "If this name calls to you, you are connected to the natural force of..."

FULL STORY — write 300-400 words:
1. THE PHYSICAL REALITY: Describe the actual natural feature. If it's a mountain — its height, location, geological formation, what grows on it, who lives near it. If it's a star — its astronomical properties, when it's visible, its place in the Chinese constellation system (not Western constellations — use 二十八宿). If it's a river — its length, source, cities along it, floods and droughts in its history.
2. CULTURAL GEOGRAPHY: How has this natural feature shaped Chinese civilization? Did armies fight over this mountain pass? Did poets pilgrimage to this peak? Did this river create or destroy dynasties? Give specific historical events.
3. FENG SHUI & CHINESE SCIENCE: How did Chinese astronomers map this star? How did geographers document this mountain? What did feng shui masters say about its qi? This is about observation and knowledge, not poetry.
4. SACRED GEOGRAPHY: In Chinese tradition, nature is alive. Mountains are dragons sleeping. Rivers are the earth's blood. Stars are celestial officials. Explain the ANIMIST or DAOIST understanding of this natural entity. How do people still worship or honor it today?
5. THE MODERN CONNECTION: This mountain still stands. This star still shines. This river still flows. What does it mean to carry a name from the natural world in an age of climate crisis, urbanization, and digital life?`,

  // ── MYTHOLOGY: Epic storytelling, complete myths ──
  mythology: `You are a master storyteller of Chinese mythology and folklore. Your job is to TELL A STORY — not analyze it dryly. You are a bard, a griot, a fireside narrator. Make the reader's eyes go wide.

This name draws from Chinese mythology. Source: {sourceText} from {sourceAttribution}.

WHAT IT MEANS — write 150-200 words:
1. Identify the SPECIFIC myth or legendary figure. Is it from 山海经 (Classic of Mountains and Seas)? 庄子 (Zhuangzi)? 楚辞 (Songs of Chu)? 西游记 (Journey to the West)? 封神演义? Be exact about which text and which chapter or section.
2. What creature, god, immortal, or hero does this name reference? Name them specifically. The Kun-Peng (鲲鹏). The Dragon Kings (龙王). The Queen Mother of the West (西王母). Hou Yi the Archer (后羿). Nüwa (女娲). Don't be vague — name the specific myth.
3. What powers or qualities does this being embody? What makes them awesome, terrifying, tragic, or inspiring? What can they do that mortals cannot?
4. Why were THESE characters chosen for this name? What quality of the mythical being transfers to the name-bearer?
5. A Western parallel: name a specific Greek, Norse, Egyptian, or Celtic myth that carries similar themes. Compare Zeus to the Jade Emperor, not just "like Greek myths."

USER BRIDGE — "If this name chooses you, you carry the spirit of..."

FULL STORY — write 300-400 words as an EPIC NARRATIVE:
1. THE ORIGIN: Tell the myth from the beginning. Set the cosmic stage. Was this before heaven and earth separated? During the reign of which legendary emperor? In what fantastical realm? Use vivid sensory detail — colors, sounds, scale.
2. THE STORY UNFOLDS: What happened? Tell the full dramatic arc. Was there a battle? A transformation? A sacrifice? A trick? A love story? A tragedy? Describe the key moments with cinematic intensity. Show, don't tell.
3. THE CAST OF CHARACTERS: Who else appears? What gods, demons, sages, or mortals play a role? Give them personality. Make the reader care about them.
4. THE DEEPER MEANING: Every Chinese myth carries philosophical weight. What is this myth really about? The relationship between humans and nature? The danger of hubris? The value of perseverance? The cycle of destruction and creation? The tension between order and chaos?
5. THE MYTH TODAY: How does this story live on? Is there a festival celebrating it? A temple dedicated to its hero? A video game or film adaptation? An idiom that every Chinese person knows that comes from this myth?
End with the myth's most memorable image or line.`,

  // ── HISTORY: Intrigue, drama, lessons from the past ──
  history: `You are a historian and storyteller specializing in the drama, intrigue, and human truth of Chinese history. You are NOT a dry academic — you are a narrator who makes history feel like a HBO series. The past is full of secrets, betrayals, triumphs, and warnings.

This name is drawn from Chinese history. Source: {sourceText} from {sourceAttribution}.

WHAT IT MEANS — write 150-200 words:
1. Name the specific historical figure. Dynasty? Years alive? What did they DO? General? Emperor? Poet-official? Philosopher? Rebel? Strategist? Be specific.
2. What is this person's MOST DEFINING MOMENT? The battle they won against impossible odds? The poem they wrote before execution? The political gamble that changed a dynasty? The betrayal that broke them? Focus on the drama.
3. What CHARACTER TRAIT defined this person? Were they brilliantly strategic but personally ruthless? Loyal to a fault? Visionary but naive? Cunning? Righteous? Ambitious to the point of self-destruction?
4. Why were these specific characters extracted for this name? What quality of this historical figure does the name-bearer inherit?
5. A precise Western parallel: compare to a specific figure — not "like Caesar" but "like when Caesar crossed the Rubicon, knowing it meant civil war." Or "like Churchill in 1940." Or "like Socrates choosing the hemlock."

USER BRIDGE — "If this name resonates with you, you carry the legacy of..."

FULL STORY — write 300-400 words:
1. THE WORLD THEY LIVED IN: Set the historical scene. What dynasty? What was the political situation? Was China unified or divided? At war or at peace? Prosperous or crumbling? What did ordinary life look like? Give the reader the FEEL of the era.
2. THE DRAMA: Tell the key event or episode that defines this person. The palace intrigue. The battlefield decision. The philosophical debate. The act of defiance. The tragic mistake. Make it cinematic — dialogue, tension, stakes, consequence.
3. THE HUMAN BEHIND THE LEGEND: What did this person fear? Love? Regret? What kept them awake at night? What did they sacrifice? Chinese history often sanitizes its figures — give us the complicated, messy, real human being.
4. THE LESSON: What does this person's story teach us? Is it a warning about the corruption of power? An inspiration about perseverance? A caution about loyalty misplaced? A reminder that even the mighty fall? Be explicit about the moral.
5. THE ECHO: How is this person remembered today? A temple? A tomb? A proverb? A film? A political reference? How does their legacy shape modern Chinese identity?
End with a powerful, memorable line — their own words if they left any, or a historian's verdict on their life.`,

  // ── FALLBACK: General cultural analysis ──
  fallback: `You are a Chinese cultural scholar writing for Western readers.

Write a rich "What it means" and "Full Story" for this name: {fullChars} ({meaning}). Each character: {char1} = {char1Meaning}, {char2} = {char2Meaning}.

WHAT IT MEANS — 150-200 words:
1. Character-by-character deep analysis — what does each character mean in its FULL cultural context, not just dictionary definition?
2. How these characters interact — why were they paired together? What combined meaning emerges?
3. The cultural resonance — what does this name evoke in Chinese tradition? What aspirations does it carry?
4. A precise Western parallel to help a non-Chinese reader feel the weight of this name.

USER BRIDGE — one vivid, personal sentence.

FULL STORY — 300-400 words:
1. The broader cultural world these characters inhabit — what traditions, philosophies, or historical moments do they connect to?
2. Who else in Chinese history bore similar names and what did they achieve?
3. The name in Chinese art, literature, or philosophy — where does it appear?
4. What these characters mean in modern China — how are they used today?
5. A closing reflection on why names carry the weight of civilization.`,
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
    .replace(/{fullChars}/g, nameData.fullChars || nameData.chars || "")
    .replace(/{givenChars}/g, nameData.givenChars || "")
    .replace(/{chars}/g, nameData.chars || "")
    .replace(/{meaning}/g, nameData.meaning || "")
    .replace(/{surname}/g, nameData.surname || "")
    .replace(/{surnameMeaning}/g, nameData.surnameMeaning || "")
    .replace(/{char1}/g, nameData.char1 || "")
    .replace(/{char2}/g, nameData.char2 || "")
    .replace(/{char1Meaning}/g, nameData.char1Meaning || "")
    .replace(/{char2Meaning}/g, nameData.char2Meaning || "");

  const prompt = `Chinese cultural scholar writing for a Western audience.

Full name: ${nameData.fullChars || nameData.chars}
Given name: ${nameData.givenChars || ""} (char1: ${nameData.char1 || ""} = ${nameData.char1Meaning || ""}, char2: ${nameData.char2 || ""} = ${nameData.char2Meaning || ""})
Surname: ${nameData.surname} (${nameData.surnameMeaning})
Meaning: ${nameData.meaning}
Source text: ${nameData.sourceText}
Attribution: ${nameData.sourceAttribution}
Category: ${req.sourceCategory}
${personalization(req)}
${baziPrompt ? "BAZI context: " + baziPrompt : ""}

${template}

CRITICAL RULES:
- You MUST explain ALL given name characters (${nameData.givenChars || ""}) individually. Do not skip any character.
- The full name is "${nameData.fullChars || nameData.chars}" — surname "${nameData.surname}" + given name "${nameData.givenChars || ""}". Reference the complete name.
- Write as if narrating a documentary or podcast — engaging, warm, authoritative.
- Use vivid imagery and emotional language. Make the reader FEEL the story.
- Assume the reader knows NOTHING about Chinese culture — explain everything clearly.
- Use Western cultural references as bridges (Shakespeare, Greek myths, Tolkien, etc.).
- Never be generic or vague. Every sentence should add new information.
- End with a memorable, resonant closing line.

Return ONLY this JSON:
{
  "explanation": "120-180 words covering ALL characters. What this name means on multiple levels: literal, poetic, philosophical, personal. Explain EACH given character individually.",
  "userBridge": "One vivid sentence connecting this name's essence to the user's identity or character.",
  "storyTitle": "A compelling, specific title (max 8 words) that captures the essence of the story.",
  "storyBody": "200-300 words. A rich narrative: origins, historical context, cultural significance, modern relevance. Tell a STORY, not just facts."
}`;

  try {
    const result = await callDeepSeek(prompt, apiKey, baseUrl, 4000);
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

// ============================================================
// Phase 3: Generate personality analysis (premium content)
// ============================================================

export async function generatePersonality(
  nameData: NameEntry,
  req: GenerateNameRequest
): Promise<Partial<NameEntry>> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (!apiKey || apiKey === "your_deepseek_api_key_here") {
    return {
      archetype: "The Seeker",
      archetypeDescription: "A personality drawn to discovery, wisdom, and the quiet pursuit of understanding.",
      englishNameConnection: "Your English name and Chinese name share a common spirit.",
      nativePerception: "To Chinese ears, this name sounds cultured, thoughtful, and authentic.",
      blessing: "May wisdom guide your path and may your name carry you to distant shores.",
    };
  }

  const prompt = `You are a Chinese naming master and cultural storyteller. Generate premium personality content for this name.

Full name: ${nameData.fullChars || nameData.chars}
Given name: ${nameData.givenChars || ""}
Surname: ${nameData.surname} (${nameData.surnameMeaning})
Meaning: ${nameData.meaning}
Source: ${nameData.sourceText} — ${nameData.sourceAttribution}
Category: ${req.sourceCategory}
${req.englishName ? `User's English name: "${req.englishName}"` : ""}
${req.selfWord ? `User describes themselves as: "${req.selfWord}"` : ""}

Return ONLY this JSON with these EXACT fields:

{
  "archetype": "A compelling 2-4 word title like 'The Wandering Scholar', 'The Mountain Sage', 'The Dragon Dreamer', 'The Celestial Explorer', 'The Silent Strategist'. Make it specific and memorable.",
  "archetypeDescription": "60-80 words. In Chinese cultural tradition, people with names like this embody certain qualities... Describe the archetype: what kind of person bears this name? What drives them? What do they value? Make the user feel seen and understood. Use vivid, literary language.",
  "englishNameConnection": ${req.englishName ? `"40-60 words. Draw a meaningful connection between the user's English name '${req.englishName}' and their Chinese name. Find a genuine parallel — not forced. If the English name means 'grace' and the Chinese name means 'cloud sail', connect them through themes of freedom, journey, transcendence."` : `"40-60 words. Even without knowing your English name, comment on how this Chinese name complements any name from the Western tradition through its universal themes."`},
  "nativePerception": "40-60 words. How would a native Chinese speaker perceive this name? Be honest — does it sound elegant? Literary? Traditional? Modern? Masculine/feminine? Would it belong to a scholar, artist, leader, adventurer? Mention specific associations. Include both positive and nuanced observations.",
  "blessing": "50-80 words. A traditional Chinese-style blessing inspired by the name's meaning. Use poetic, warm language. Echo the name's imagery. Should feel like something an elder or calligrapher would write. Include natural imagery and timeless wisdom. End with a resonant line."
}

CRITICAL RULES:
- Every section must reference the SPECIFIC name and its meaning. No generic filler.
- Use Western cultural bridges where helpful.
- Write with warmth and authority — like a cultural ambassador.
- Make the user feel this was crafted uniquely for them.`;

  try {
    const result = await callDeepSeek(prompt, apiKey, baseUrl, 1500);
    return {
      archetype: (result.archetype as string) || "",
      archetypeDescription: (result.archetypeDescription as string) || "",
      englishNameConnection: (result.englishNameConnection as string) || "",
      nativePerception: (result.nativePerception as string) || "",
      blessing: (result.blessing as string) || "",
    };
  } catch (error) {
    console.error("generatePersonality failed:", error);
    return {
      archetype: "The Seeker",
      archetypeDescription: "A personality drawn to discovery, wisdom, and the quiet pursuit of understanding — much like the scholars and poets of ancient China who found meaning in every mountain and stream.",
      englishNameConnection: "Names across cultures carry the same fundamental hope — that we grow into the best version of ourselves.",
      nativePerception: "To Chinese ears, this name sounds cultured and thoughtful, carrying the weight of centuries of literary tradition.",
      blessing: "May wisdom guide your path. May your name carry you to distant shores, and may you always find your way home.",
    };
  }
}
