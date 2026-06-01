"use client";

import { SurnameOption } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// Curated common Chinese surnames with Western-friendly descriptions
const COMMON_SURNAMES: SurnameOption[] = [
  { char: "李", pinyin: "Lǐ", phonetic: "Lee", meaning: "plum tree", description: "The most popular surname on Earth — warm, approachable, classic" },
  { char: "王", pinyin: "Wáng", phonetic: "Wahng", meaning: "king", description: "Royal lineage. Confident and authoritative." },
  { char: "张", pinyin: "Zhāng", phonetic: "Jahng", meaning: "draw a bow", description: "Archer's heritage. Bold and direct." },
  { char: "刘", pinyin: "Liú", phonetic: "Lyoh", meaning: "battle-axe", description: "Warrior ancestors. Strong and determined." },
  { char: "陈", pinyin: "Chén", phonetic: "Chun", meaning: "to arrange", description: "Ancient southern roots. Thoughtful and orderly." },
  { char: "杨", pinyin: "Yáng", phonetic: "Yahng", meaning: "poplar tree", description: "Resilient and steadfast, like a tree in the wind." },
  { char: "赵", pinyin: "Zhào", phonetic: "Jow", meaning: "to summon", description: "Imperial bloodline. Charismatic and commanding." },
  { char: "黄", pinyin: "Huáng", phonetic: "Hwahng", meaning: "golden", description: "Earth-toned and warm. Grounded and generous." },
  { char: "周", pinyin: "Zhōu", phonetic: "Joe", meaning: "complete", description: "Named for an ancient dynasty. Well-rounded and reliable." },
  { char: "吴", pinyin: "Wú", phonetic: "Woo", meaning: "Wu kingdom", description: "Southern charm. Creative and expressive." },
  { char: "林", pinyin: "Lín", phonetic: "Leen", meaning: "forest", description: "Nature-connected. Calm and deep-rooted." },
  { char: "马", pinyin: "Mǎ", phonetic: "Mah", meaning: "horse", description: "Free spirit. Energetic and adventurous." },
];

// Randomly select 3 recommended surnames
function getRecommended(): SurnameOption[] {
  const shuffled = [...COMMON_SURNAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

interface Props {
  visible: boolean;
  onSelect: (surname: string) => void;
  onSkip: () => void;
}

export default function SurnameSelector({ visible, onSelect, onSkip }: Props) {
  const [recommended] = useState(() => getRecommended());
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const handleCustomConfirm = () => {
    const trimmed = custom.trim();
    if (trimmed && /^[\u4e00-\u9fff]+$/.test(trimmed) && trimmed.length <= 2) {
      onSelect(trimmed);
    }
  };

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
              Every Chinese name has a family name (姓) that comes first. Pick one
              that feels right — or let us recommend.
            </p>

            {/* Recommended */}
            <div className="mb-4">
              <p className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">
                ✦ Recommended for you
              </p>
              <div className="space-y-2">
                {recommended.map((s) => (
                  <button
                    key={s.char}
                    onClick={() => onSelect(s.char)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-deep-blue/20 bg-[#EEF4F8] hover:bg-[#DCEAF2] transition-colors text-left"
                  >
                    <span className="text-2xl font-light text-text-primary w-10 text-center">
                      {s.char}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">
                        {s.char} ·{" "}
                        <span className="font-light text-text-secondary">
                          {s.pinyin} / {s.phonetic}
                        </span>
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {s.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* More options */}
            <details className="mb-4 group">
              <summary className="text-xs text-text-secondary hover:text-text-primary cursor-pointer py-1 transition-colors">
                + Show more surnames (9 more)
              </summary>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {COMMON_SURNAMES.filter(
                  (s) => !recommended.find((r) => r.char === s.char)
                ).map((s) => (
                  <button
                    key={s.char}
                    onClick={() => onSelect(s.char)}
                    className="p-2 rounded-lg border border-card-border bg-surface hover:bg-[#EEF4F8] hover:border-deep-blue/30 transition-colors text-center"
                  >
                    <p className="text-xl font-light text-text-primary">
                      {s.char}
                    </p>
                    <p className="text-[10px] text-text-secondary mt-0.5">
                      {s.phonetic}
                    </p>
                  </button>
                ))}
              </div>
            </details>

            {/* Custom */}
            <div className="mb-4">
              <button
                onClick={() => setUseCustom(!useCustom)}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                {useCustom ? "− Or choose from list" : "+ Type your own surname"}
              </button>
              {useCustom && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder='e.g. 欧阳, 司马'
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
              className="w-full py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Skip — let AI pick the best surname for me
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
