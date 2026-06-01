import { GenerateNameRequest } from "./types";

const categoryGuides: Record<string, string> = {
  poetry: `Classical Chinese poetry (Tang/Song dynasty). Find a real poem, 
extract 2 characters that form a beautiful given name. Prioritize poems by Li Bai, 
Du Fu, Wang Wei, Su Shi, Li Qingzhao. The name must come from an actual poem —
cite the exact line.`,

  elements: `Five Elements philosophy (Wu Xing 五行: Metal 金, Wood 木, Water 水, Fire 火, Earth 土).
This category is FUNDAMENTALLY DIFFERENT from poetry — do NOT use names from poems or literary texts.

Instead, create a given name from characters that DIRECTLY embody the five elements. Draw from the 
canonical Five Elements source texts: 《尚书·洪范》(Book of Documents, Grand Plan), 
《黄帝内经》(Yellow Emperor's Inner Canon), 《五行大义》(Great Meaning of Five Elements).

The classic elemental definitions from 尚书·洪范:
- 水曰润下 (Water moistens and descends) — use chars like 润, 渊, 涵, 源, 清, 泽
- 火曰炎上 (Fire blazes and rises) — use chars like 炎, 煜, 烨, 焕, 光, 炜
- 木曰曲直 (Wood bends and straightens) — use chars like 森, 荣, 栋, 楷, 柏, 桐
- 金曰从革 (Metal follows and transforms) — use chars like 铭, 钧, 锋, 铎, 铮, 锡
- 土爰稼穑 (Earth sows and reaps) — use chars like 坤, 垚, 坚, 城, 坦, 圣

Create names that show element relationships: generating cycle (相生: Wood→Fire→Earth→Metal→Water) 
or balancing opposites. Each character MUST clearly correspond to a specific element.

CRITICAL: sourceText MUST come from a Five Elements text (尚书·洪范, 黄帝内经, etc.), 
NOT from poetry. If you can't find a direct Five Elements source, use 尚书·洪范's elemental definitions.`,

  nature: `Natural world: stars, constellations, oceans, mountains, rivers, seasons, 
weather phenomena. Draw from classical Chinese landscape poetry and real 
geographical names. The name should evoke a specific place or natural phenomenon. 
Think: naming someone after the Northern Lights or the Misty Mountains — but Chinese.`,

  mythology: `Chinese mythology and folklore: dragons, phoenixes, the Kun-Peng 
giant fish-bird, immortals, legendary heroes. Use names from actual myths 
(Shanhaijing, Zhuangzi, Chuci, Soushenji). Explain like you're introducing 
Greek mythology to a newcomer — every creature and legend needs context.`,

  history: `Real historical figures: generals, poets, philosophers, emperors, 
inventors. Use their courtesy names (字) or evocative epithets. Tell their 
story like a biopic trailer — when did they live, what did they overcome, 
why do we still remember them?`,
};

const surnameGuide = `COMMON CHINESE SURNAMES (choose the best match or use the one provided):
李 (Lǐ/Lee) — plum tree. Most common surname globally.
王 (Wáng/Wahng) — king. Royal, authoritative.
张 (Zhāng/Jahng) — to draw a bow. Archer's lineage.
刘 (Liú/Lyoh) — battle-axe. Warrior ancestors.
陈 (Chén/Chun) — to exhibit. Old southern clan.
杨 (Yáng/Yahng) — poplar tree. Resilient.
赵 (Zhào/Jow) — to summon. Imperial lineage.
黄 (Huáng/Hwahng) — yellow/golden. Earth element.
周 (Zhōu/Joe) — complete, thorough. Ancient dynasty name.
吴 (Wú/Woo) — the Wu kingdom. Southern heritage.
林 (Lín/Leen) — forest. Nature-connected.
马 (Mǎ/Mah) — horse. Energetic, free-spirited.`;

export function buildPrompt(req: GenerateNameRequest): string {
  const { sourceCategory, englishName, selfWord, surname } = req;

  const personalization = [
    englishName &&
      `User's English name: "${englishName}". If possible, choose characters whose sounds echo their English name.`,
    selfWord &&
      `User describes themselves as: "${selfWord}". Choose a name that reflects this quality and weave it into the explanation naturally.`,
    surname
      ? `User chose the surname: ${surname}. Use this surname.`
      : `Recommend a surname from the list below that best matches the name's meaning and the user's vibe.`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a Chinese cultural scholar who specializes in creating Chinese names for Western audiences. Your audience knows NOTHING about Chinese culture — explain everything with Western analogies (Shakespeare, Greek myths, Tolkien, MBTI, the Bible, Norse sagas, Star Wars — whatever fits best).

SOURCE CATEGORY: ${categoryGuides[sourceCategory]}

${surnameGuide}

${personalization ? `PERSONALIZATION:\n${personalization}\n` : ""}

Generate a COMPLETE Chinese name with SURNAME + 2-character GIVEN NAME. You MUST:
1. Use ONLY real characters from classical Chinese texts or verified historical sources — NO invented names
2. Choose characters whose pronunciation is reasonably easy for English speakers (avoid ü, avoid zh/ch/sh/r if a simpler alternative exists with same meaning)
3. Explain every concept using Western analogies
4. The name must sound beautiful and carry positive, aspirational meaning
5. The story must be vivid and emotional — make the reader feel something
6. The surname should be chosen from the common surnames list above UNLESS the user already provided one

CRITICAL — Return ONLY this EXACT JSON (no markdown, no explanation outside the JSON):

{
  "surname": "single character surname (e.g. '李')",
  "surnamePinyin": "Pinyin with tone (e.g. 'Lǐ')",
  "surnamePhonetic": "English-friendly (e.g. 'Lee')",
  "surnameMeaning": "meaning in English (e.g. 'plum tree')",
  "givenChars": "two characters with space between them (e.g. '云 帆')",
  "fullChars": "surname + given without spaces (e.g. '李云帆')",
  "chars": "surname + given with spaces (e.g. '李 云 帆')",
  "pinyin": "Full pinyin with tone marks (e.g. 'Lǐ Yún Fān')",
  "phonetic": "English-friendly pronunciation (e.g. 'Lee Yoon Fahn')",
  "meaning": "Full name meaning in 3-5 English words",
  
  "char1": "first given-name character",
  "char1Pinyin": "pinyin of first character",
  "char1Meaning": "meaning of first character in English",
  "char2": "second given-name character",
  "char2Pinyin": "pinyin of second character",
  "char2Meaning": "meaning of second character in English",
  
  "sourceText": "the ORIGINAL Chinese source text (the actual poem line or classical quote)",
  "sourceAttribution": "attribution in Chinese + English (e.g. '李白《行路难》— Li Bai, The Hard Road (Tang Dynasty, 744 AD)')",
  "sourceTranslation": "elegant English translation of the source text (poetic, not literal)",
  
  "explanation": "Cultural explanation for a Western audience (40-70 words). Use a Western analogy. Example: 'Think of this like Odysseus staring at the open sea — the poet is saying that no matter how impossible the journey seems, the winds will turn.'",
  
  "userBridge": "One sentence connecting this name to the user's identity. Pattern: 'If you chose this name, you're the kind of person who...' Make it specific and emotionally resonant.",
  
  "storyTitle": "Story title in English (catchy, like a documentary episode title — max 8 words)",
  "storyBody": "The full story (120-200 words). Tell it like a podcast narrative: who created this, when, under what circumstances, what were they feeling, what does it mean for someone who carries this name today. Use vivid, emotional language. Make the user feel something."
}`;
}
