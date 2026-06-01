"use client";

import { SurnameOption } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

// Hundred Family Surnames (百家姓) — top 50 by population, covering ~82% of Chinese people
// Each with character, pinyin, English-friendly phonetic, meaning, and a Western-audience description
const BAI_JIA_XING: SurnameOption[] = [
  { char: "李", pinyin: "Lǐ", phonetic: "Lee", meaning: "plum tree", description: "The most common surname on Earth — over 100 million people. Associated with the Tang Dynasty imperial family. Warm, classic, universally recognized." },
  { char: "王", pinyin: "Wáng", phonetic: "Wahng", meaning: "king, monarch", description: "Literally means 'king.' The surname of rulers and leaders. One of China's 'big three' surnames. Confident and authoritative." },
  { char: "张", pinyin: "Zhāng", phonetic: "Jahng", meaning: "to draw a bow", description: "Rooted in archery — the original Zhang was the inventor of the bow and arrow. Bold, pioneering, a natural leader." },
  { char: "刘", pinyin: "Liú", phonetic: "Lyoh", meaning: "battle-axe; kill", description: "The surname of the Han Dynasty emperors (206 BC–220 AD), one of China's greatest dynasties. Warrior heritage meets imperial grandeur." },
  { char: "陈", pinyin: "Chén", phonetic: "Chun", meaning: "to exhibit; to arrange", description: "An ancient southern clan from the Zhou Dynasty (1046 BC). Associated with order, tradition, and deep-rooted family values." },
  { char: "杨", pinyin: "Yáng", phonetic: "Yahng", meaning: "poplar tree", description: "The poplar is tall, straight, and resilient — bending but never breaking in the wind. A name for someone steadfast and reliable." },
  { char: "赵", pinyin: "Zhào", phonetic: "Jow", meaning: "to summon; swift", description: "The first surname in the classic Hundred Family Surnames text. Imperial lineage from the Song Dynasty (960–1279). Charismatic and commanding." },
  { char: "黄", pinyin: "Huáng", phonetic: "Hwahng", meaning: "yellow; golden", description: "The color of the earth, the Yellow River, and Chinese civilization itself. Grounded, warm, and generous — like sunlight on soil." },
  { char: "周", pinyin: "Zhōu", phonetic: "Joe", meaning: "complete; circumference", description: "Named for the Zhou Dynasty (1046–256 BC), the longest dynasty in Chinese history. Represents completeness, thoroughness, and reliability." },
  { char: "吴", pinyin: "Wú", phonetic: "Woo", meaning: "the Wu kingdom", description: "From the ancient Wu kingdom in the Yangtze River delta — a land of silk, poetry, and commerce. Creative, refined, and culturally rich." },
  { char: "徐", pinyin: "Xú", phonetic: "Shoo", meaning: "slowly; gently", description: "An ancient surname from the Xu kingdom. Conveys patience and deliberate grace — like a river that knows it will reach the sea." },
  { char: "孙", pinyin: "Sūn", phonetic: "Swoon", meaning: "grandchild; descendant", description: "The surname of Sun Tzu, author of The Art of War. Strategic, intellectual, with a legacy of wisdom passed down through generations." },
  { char: "马", pinyin: "Mǎ", phonetic: "Mah", meaning: "horse", description: "Named for the noble steed — symbol of speed, freedom, and untamed energy. A surname for adventurers and free spirits." },
  { char: "朱", pinyin: "Zhū", phonetic: "Joo", meaning: "vermilion; cinnabar red", description: "The imperial surname of the Ming Dynasty (1368–1644). The color of good fortune, celebration, and passionate intensity." },
  { char: "胡", pinyin: "Hú", phonetic: "Hoo", meaning: "beard; northern tribes", description: "Originated from nomadic peoples who migrated into China. Independent, adaptable, with a spirit shaped by open horizons." },
  { char: "郭", pinyin: "Guō", phonetic: "Gwoh", meaning: "outer city wall", description: "Like the walls that protected ancient cities. A surname that suggests protection, boundaries, and being someone others can lean on." },
  { char: "何", pinyin: "Hé", phonetic: "Huh", meaning: "what; why; how", description: "A philosophical surname — literally the question word. Curious, questioning, never satisfied with surface-level answers." },
  { char: "林", pinyin: "Lín", phonetic: "Leen", meaning: "forest; woods", description: "A grove of trees standing together. Nature-connected, calm, and rooted — like someone who finds peace among tall pines." },
  { char: "高", pinyin: "Gāo", phonetic: "Gow", meaning: "tall; high", description: "Aspiration made into a name. Ambitious, with high standards and higher goals. The sky is the starting point, not the limit." },
  { char: "罗", pinyin: "Luó", phonetic: "Lwoh", meaning: "net; to gather", description: "Like a net that gathers and connects. A surname for networkers, community builders, and those who bring people together." },
  { char: "郑", pinyin: "Zhèng", phonetic: "Jung", meaning: "solemn; serious", description: "From the ancient state of Zheng. Dignified, earnest, and trustworthy — the kind of person you want at your side in a crisis." },
  { char: "梁", pinyin: "Liáng", phonetic: "Lyahng", meaning: "bridge; beam", description: "A bridge between people, ideas, and worlds. A surname for mediators, diplomats, and those who connect what was divided." },
  { char: "谢", pinyin: "Xiè", phonetic: "Shyeh", meaning: "to thank; to decline politely", description: "Gratitude as identity. Gracious, humble, and eloquent — the poet Xie Lingyun (385–433) founded Chinese landscape poetry." },
  { char: "宋", pinyin: "Sòng", phonetic: "Soong", meaning: "the Song Dynasty", description: "Named for the Song Dynasty (960–1279), China's golden age of art and commerce. Cultured, sophisticated, with an eye for beauty." },
  { char: "唐", pinyin: "Táng", phonetic: "Tahng", meaning: "the Tang Dynasty; expansive", description: "The Tang Dynasty (618–907) was China's cosmopolitan golden age. Open-minded, worldly, and grand in vision — like a Silk Road traveler." },
  { char: "韩", pinyin: "Hán", phonetic: "Hahn", meaning: "fence; the Han state", description: "From an ancient state in central China. Solid, dependable, and quietly strong — like a well-built fence protecting what matters." },
  { char: "曹", pinyin: "Cáo", phonetic: "Tsow", meaning: "official; generation", description: "Associated with Cao Cao, the brilliant warlord of Three Kingdoms lore (think Chinese Game of Thrones). Strategic, ambitious, born to lead." },
  { char: "许", pinyin: "Xǔ", phonetic: "Shoo", meaning: "to allow; to promise", description: "A surname of permission and possibility. Open-minded, permissive, someone who creates space for others to thrive." },
  { char: "邓", pinyin: "Dèng", phonetic: "Dung", meaning: "the Deng state", description: "From an ancient feudal state. Associated with Deng Xiaoping, the reformer who reshaped modern China. Pragmatic, visionary, unafraid of change." },
  { char: "萧", pinyin: "Xiāo", phonetic: "Shyow", meaning: "desolate; mournful (original); mugwort", description: "Despite its somber original meaning, this surname evokes the beauty of autumn. Melancholic, artistic, deeply feeling — like a minor-key symphony." },
  { char: "冯", pinyin: "Féng", phonetic: "Fung", meaning: "to gallop; ice", description: "Associated with speed across frozen rivers. Quick-thinking, decisive, someone who doesn't hesitate when action is needed." },
  { char: "曾", pinyin: "Zēng", phonetic: "Dzung", meaning: "once; already; great-grand-", description: "A surname of continuity across generations. Connected to deep ancestry, traditional values, and the weight of history carried lightly." },
  { char: "程", pinyin: "Chéng", phonetic: "Chung", meaning: "journey; distance; rule", description: "A journey with a purpose. Methodical, disciplined, someone who measures progress not in speed but in direction." },
  { char: "蔡", pinyin: "Cài", phonetic: "Tsye", meaning: "tortoise; the Cai state", description: "In ancient China, tortoises were used for divination — reading the future. Wise, patient, someone who thinks before speaking." },
  { char: "彭", pinyin: "Péng", phonetic: "Pung", meaning: "drum sound; booming", description: "The sound of a drum echoing across a battlefield. Resonant, unforgettable, someone whose presence fills a room." },
  { char: "潘", pinyin: "Pān", phonetic: "Pahn", meaning: "river bank; to wash rice", description: "Associated with life-giving water and sustenance. Nurturing, resourceful, someone who makes sure everyone is taken care of." },
  { char: "袁", pinyin: "Yuán", phonetic: "Yoo-an", meaning: "long robe; to pull on", description: "Traditional and dignified. Like a scholar's robe — learned, refined, someone who wears their heritage with quiet pride." },
  { char: "于", pinyin: "Yú", phonetic: "Yoo", meaning: "at; in; from", description: "A simple preposition turned surname — humble origins, no pretension. Someone grounded and direct, who lets actions speak." },
  { char: "董", pinyin: "Dǒng", phonetic: "Doong", meaning: "to supervise; director", description: "To oversee with care and wisdom. Natural managers and guardians — the person everyone trusts to keep things running smoothly." },
  { char: "余", pinyin: "Yú", phonetic: "Yoo", meaning: "surplus; remaining; I (classical)", description: "Abundance and selfhood combined. Someone comfortable in their own skin, with more than enough to share." },
  { char: "苏", pinyin: "Sū", phonetic: "Soo", meaning: "to revive; perilla plant", description: "To wake up, to come back to life. Associated with Su Shi (Su Dongpo), China's Leonardo da Vinci — poet, painter, chef, and irrepressible optimist." },
  { char: "叶", pinyin: "Yè", phonetic: "Yeh", meaning: "leaf", description: "A single leaf on an ancient tree — small, beautiful, and part of something vast. Humble, elegant, connected to nature's rhythms." },
  { char: "吕", pinyin: "Lǚ", phonetic: "Lyoo", meaning: "spine; backbone", description: "The vertebrae that hold the body upright. A surname for someone with moral backbone — principled, unwavering, structurally sound." },
  { char: "魏", pinyin: "Wèi", phonetic: "Way", meaning: "towering; the Wei kingdom", description: "From the Three Kingdoms era (think Game of Thrones). Towering ambition, strategic genius, someone who plays the long game." },
  { char: "蒋", pinyin: "Jiǎng", phonetic: "Jyahng", meaning: "wild rice; aquatic plant", description: "A plant that thrives where land meets water. Adaptable, resilient in changing conditions, comfortable in multiple worlds." },
  { char: "田", pinyin: "Tián", phonetic: "Tyen", meaning: "field; farmland", description: "The good earth — honest, fertile, life-giving. Like a well-tended field, this surname suggests someone who cultivates and nurtures." },
  { char: "杜", pinyin: "Dù", phonetic: "Doo", meaning: "pear tree; to stop", description: "Associated with Du Fu, China's greatest poet (like a Chinese Shakespeare). Deeply feeling, profoundly human, finding beauty in the everyday." },
  { char: "丁", pinyin: "Dīng", phonetic: "Ding", meaning: "nail; fourth; adult male", description: "Short, sharp, and strong — the simplest surname in Chinese (just 2 strokes). Direct, uncomplicated, gets straight to the point." },
  { char: "沈", pinyin: "Shěn", phonetic: "Shun", meaning: "to sink; deep; to pour", description: "Still waters run deep. Thoughtful, introspective, someone whose depth is only visible to those who take the time to look." },
  { char: "姜", pinyin: "Jiāng", phonetic: "Jyahng", meaning: "ginger", description: "Warm, spicy, and medicinal. Ginger has been used in Chinese medicine for millennia. A surname that suggests healing warmth and quiet strength." },
];

// Also add common two-character surnames
const COMPOUND_SURNAMES: SurnameOption[] = [
  { char: "欧阳", pinyin: "Ōuyáng", phonetic: "Oh-yahng", meaning: "south of Ou Mountain", description: "The most famous two-character surname. Elegant and literary — associated with Ouyang Xiu, the great Song Dynasty historian and poet." },
  { char: "司马", pinyin: "Sīmǎ", phonetic: "Suh-mah", meaning: "minister of horses", description: "The surname of Sima Qian (145–86 BC), China's Herodotus — the father of Chinese history. Scholarly, meticulous, a keeper of stories." },
  { char: "诸葛", pinyin: "Zhūgě", phonetic: "Joo-guh", meaning: "many kudzu plants", description: "The surname of Zhuge Liang, the genius strategist of Three Kingdoms — China's Merlin. Brilliant, visionary, calm under pressure." },
  { char: "上官", pinyin: "Shàngguān", phonetic: "Shahng-gwahn", meaning: "high official", description: "Literally 'high-ranking official.' Aristocratic origins mixed with a sense of duty and public service." },
  { char: "慕容", pinyin: "Mùróng", phonetic: "Moo-roong", meaning: "admire the appearance", description: "An ancient Xianbei (nomadic) surname — exotic, romantic, with the mystery of the northern steppes woven into its syllables." },
];

// Get 3 random recommended surnames from the top 10
function getRecommended(): SurnameOption[] {
  const top10 = BAI_JIA_XING.slice(0, 10);
  const shuffled = [...top10].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

interface Props {
  visible: boolean;
  onSelect: (surname: string) => void;
  onSkip: () => void;
}

export default function SurnameSelector({ visible, onSelect, onSkip }: Props) {
  const [recommended] = useState(() => getRecommended());
  const [search, setSearch] = useState("");
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return BAI_JIA_XING;
    const q = search.toLowerCase().trim();
    return BAI_JIA_XING.filter(
      (s) =>
        s.char.includes(q) ||
        s.pinyin.toLowerCase().includes(q) ||
        s.phonetic.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [search]);

  const compoundFiltered = useMemo(() => {
    if (!search.trim()) return COMPOUND_SURNAMES;
    const q = search.toLowerCase().trim();
    return COMPOUND_SURNAMES.filter(
      (s) =>
        s.char.includes(q) ||
        s.pinyin.toLowerCase().includes(q) ||
        s.phonetic.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [search]);

  const handleCustomConfirm = () => {
    const trimmed = custom.trim();
    if (trimmed && /^[\u4e00-\u9fff]+$/.test(trimmed) && trimmed.length <= 2) {
      onSelect(trimmed);
    }
  };

  const SurnameCard = ({ s, featured }: { s: SurnameOption; featured?: boolean }) => (
    <button
      key={s.char}
      onClick={() => onSelect(s.char)}
      className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
        featured
          ? "border-deep-blue/20 bg-[#EEF4F8] hover:bg-[#DCEAF2]"
          : "border-card-border bg-surface hover:bg-[#F4F8FA] hover:border-deep-blue/20"
      }`}
    >
      <span className={`font-light text-text-primary text-center shrink-0 ${s.char.length > 1 ? "text-lg w-14" : "text-2xl w-10"}`}>
        {s.char}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">
          <span className="font-light text-text-secondary">
            {s.pinyin} · {s.phonetic}
          </span>
        </p>
        <p className="text-[11px] text-mist mt-0.5">{s.meaning}</p>
        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
          {s.description}
        </p>
      </div>
    </button>
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="card max-w-sm mx-auto"
        >
          <div className="p-5">
            <h2 className="text-lg font-light text-text-primary text-center mb-1">
              Choose Your Surname
            </h2>
            <p className="text-xs text-text-secondary text-center mb-5">
              Every Chinese name has a family name (姓). Pick one that resonates —
              or let AI recommend the perfect match.
            </p>

            {/* Recommended */}
            <div className="mb-5">
              <p className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">
                ✦ Recommended for you
              </p>
              <div className="space-y-2">
                {recommended.map((s) => (
                  <SurnameCard key={s.char} s={s} featured />
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <label htmlFor="surnameSearch" className="sr-only">
                Search surnames
              </label>
              <input
                id="surnameSearch"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search all 50+ surnames..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-surface text-text-primary placeholder:text-mist focus:outline-none focus:border-deep-blue focus:ring-1 focus:ring-deep-blue/20 transition-colors"
              />
            </div>

            {/* All surnames — scrollable */}
            {!search.trim() && (
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                All Surnames ({BAI_JIA_XING.length})
              </p>
            )}
            <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1 -mr-1">
              {filtered.length === 0 && compoundFiltered.length === 0 && (
                <p className="text-xs text-text-secondary text-center py-6">
                  No surnames match &ldquo;{search}&rdquo; — try a different
                  search or type your own below.
                </p>
              )}
              {filtered.map((s) => (
                <SurnameCard key={s.char} s={s} />
              ))}

              {/* Compound surnames section */}
              {compoundFiltered.length > 0 && (
                <>
                  {!search.trim() && (
                    <div className="pt-3 pb-1">
                      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Two-Character Surnames ({COMPOUND_SURNAMES.length})
                      </p>
                      <p className="text-[11px] text-mist mt-0.5">
                        Rare and distinguished — like having a hyphenated last
                        name in English
                      </p>
                    </div>
                  )}
                  {compoundFiltered.map((s) => (
                    <SurnameCard key={s.char} s={s} />
                  ))}
                </>
              )}
            </div>

            {/* Custom input */}
            <div className="mt-4 pt-4 border-t border-card-border">
              <button
                onClick={() => setUseCustom(!useCustom)}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                {useCustom
                  ? "− Choose from list instead"
                  : "+ Type your own surname"}
              </button>
              {useCustom && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="e.g. 欧, 欧阳, 司马"
                    maxLength={2}
                    className="flex-1 px-3 py-2 rounded-lg border border-card-border bg-surface text-sm text-text-primary placeholder:text-mist focus:outline-none focus:border-deep-blue transition-colors"
                  />
                  <button
                    onClick={handleCustomConfirm}
                    disabled={!custom.trim()}
                    className="px-4 py-2 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue disabled:opacity-40 transition-colors"
                  >
                    Use
                  </button>
                </div>
              )}
            </div>

            {/* Skip */}
            <button
              onClick={onSkip}
              className="w-full mt-3 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Skip — let AI pick the best surname for me
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
