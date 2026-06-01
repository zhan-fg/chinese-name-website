import { GenerateNameRequest } from "./types";

const categoryGuides: Record<string, string> = {
  poetry: `Classical Chinese poetry (Tang/Song dynasty). Find a real poem, 
extract 2 characters that form a beautiful name. Prioritize poems by Li Bai, 
Du Fu, Wang Wei, Su Shi, Li Qingzhao. The name must come from an actual poem —
cite the exact line.`,

  elements: `Five Elements philosophy (Wu Xing: Metal, Wood, Water, Fire, Earth). 
Create a 2-character name where each character embodies an element. Explain the 
personality archetype — treat it like a Myers-Briggs or Enneagram, but ancient 
Chinese. Each element has personality traits: Wood=growing creative, Fire=passionate 
radiant, Earth=grounded nurturing, Metal=disciplined refined, Water=deep adaptable.`,

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

export function buildPrompt(req: GenerateNameRequest): string {
  const { sourceCategory, englishName, selfWord } = req;

  const personalization = [
    englishName &&
      `User's English name: "${englishName}". If possible, choose characters whose sounds echo their English name (e.g. "Emma" → sounds like "Yì Mǎ" or similar).`,
    selfWord &&
      `User describes themselves as: "${selfWord}". Choose a name that reflects this quality and weave it into the explanation naturally.`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a Chinese cultural scholar who specializes in creating Chinese names for Western audiences. Your audience knows NOTHING about Chinese culture — explain everything with Western analogies (Shakespeare, Greek myths, Tolkien, MBTI, the Bible, Norse sagas, Star Wars — whatever fits best).

SOURCE CATEGORY: ${categoryGuides[sourceCategory]}

${personalization ? `PERSONALIZATION:\n${personalization}\n` : ""}

Generate a 2-character Chinese name. You MUST:
1. Use ONLY real characters from classical Chinese texts or verified historical sources — NO invented names
2. Choose characters whose pronunciation is reasonably easy for English speakers (avoid ü, avoid zh/ch/sh/r if a simpler alternative exists with same meaning)
3. Explain every concept using Western analogies
4. The name must sound beautiful and carry positive, aspirational meaning
5. The story must be vivid and emotional — make the reader feel something

CRITICAL — Return ONLY this EXACT JSON (no markdown, no explanation outside the JSON):

{
  "chars": "two characters with space between them",
  "pinyin": "Pinyin with tone marks",
  "phonetic": "English-friendly pronunciation hint (e.g. 'Yoon Fahn')",
  "meaning": "Name meaning in 2-4 English words",
  
  "char1": "first character",
  "char1Pinyin": "pinyin of first character",
  "char1Meaning": "meaning of first character in English",
  "char2": "second character",
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
