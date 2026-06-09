import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Chinese Names Work — Surname, Given Name, and Cultural Meaning",
  description:
    "Learn how Chinese names are structured: surname (姓) comes first, given name (名) comes second. Understand the cultural meaning behind Chinese naming traditions, from classical poetry to Five Elements philosophy.",
  keywords: [
    "how chinese names work",
    "chinese name structure",
    "chinese surname meaning",
    "chinese given name",
    "chinese naming tradition",
    "chinese name culture",
    "chinese name explained",
  ],
};

export default function HowChineseNamesWork() {
  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-light text-text-primary mb-2">
          How Chinese Names Work
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          A guide for anyone who wants to understand what makes a Chinese name
          meaningful — and why the best ones come from 3,000-year-old poetry.
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="text-lg font-medium text-text-primary mb-3">
              Surname First, Always
            </h2>
            <p className="mb-3">
              Chinese names put the family name (姓, xìng) before the personal
              name (名, míng). If your name is John Smith, the Chinese equivalent
              would be Smith John. This ordering reflects a deeply rooted
              cultural value: you belong to your family before you belong to
              yourself.
            </p>
            <p>
              Most Chinese surnames are one character. The Hundred Family
              Surnames (百家姓), compiled during the Song Dynasty around 960 AD,
              lists the most common ones. The top five — 李 (Lǐ), 王 (Wáng), 张
              (Zhāng), 刘 (Liú), and 陈 (Chén) — are shared by over 400 million
              people. Each surname carries its own history: 李 means plum tree
              and traces back to a Tang Dynasty imperial lineage; 王 means king
              and was adopted by descendants of deposed rulers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-text-primary mb-3">
              The Given Name Is Where the Magic Happens
            </h2>
            <p className="mb-3">
              A Chinese given name is typically one or two characters. These
              characters are not randomly chosen — they are extracted from
              classical sources: poetry, philosophy, history, natural imagery, or
              mythology. A name like 云帆 (Yún Fān, Cloud Sail) comes from Li
              Bai's poem "The Hard Road," written in 744 AD.
            </p>
            <p className="mb-3">
              What makes a name good or bad depends on several things. First,
              how the characters sound together — tone combinations that flow
              musically are preferred. Second, the cultural weight of the source —
              a character from Du Fu's poetry carries more gravitas than one from
              a modern dictionary. Third, the name should not be too obvious: a
              name meaning "Beautiful Flower" reads like a vocabulary word
              rather than a real person's name.
            </p>
            <p>
              The worst mistake Westerners make is directly translating their
              English name's meaning into Chinese. "Hope" becomes 希望 — which
              sounds like a corporate slogan, not a human being. The Chinese
              approach is indirect: you don't name someone "Hope," you name
              them after a poem about dawn breaking over a mountain, and let the
              meaning emerge through allusion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-text-primary mb-3">
              Five Sources of Chinese Names
            </h2>
            <p className="mb-3">
              Traditional Chinese names draw from five classical domains:
            </p>
            <ul className="space-y-4">
              <li>
                <strong className="text-text-primary">
                  Poetry & Song (诗词歌赋)
                </strong>
                <br />
                The most prestigious source. Characters extracted from Tang and
                Song dynasty poems by Li Bai, Du Fu, Wang Wei, and Su Shi. Each
                name traces back to a specific line — you know exactly which poem
                and which poet. This is the naming equivalent of being named
                after a Shakespeare character.
              </li>
              <li>
                <strong className="text-text-primary">
                  Five Elements (五行)
                </strong>
                <br />
                Based on Wu Xing philosophy — Wood, Fire, Earth, Metal, Water.
                Combined with Bazi (八字) birth chart analysis, this system
                selects characters whose elemental properties balance your
                destiny. Think of it as the Chinese equivalent of astrological
                naming, but with 3,000 more years of refinement.
              </li>
              <li>
                <strong className="text-text-primary">
                  Stars & Earth (天文地理)
                </strong>
                <br />
                Names drawn from Chinese astronomy, sacred mountains, great
                rivers, and natural phenomena. The Northern Dipper (北斗),
                Mount Tai (泰山), the Yangtze River — these are not just
                landmarks but living presences in Chinese cosmology.
              </li>
              <li>
                <strong className="text-text-primary">
                  Myths & Legends (神话传说)
                </strong>
                <br />
                Characters evoking the Kun-Peng, the Dragon Kings, the Queen
                Mother of the West. From the Classic of Mountains and Seas
                (山海经) to Journey to the West (西游记), mythological names
                carry archetypal power.
              </li>
              <li>
                <strong className="text-text-primary">
                  History (历史)
                </strong>
                <br />
                Names drawn from the courtesy names (字) and art names (号) of
                historical figures — generals, philosophers, poets, emperors.
                Bearing a name from the Records of the Grand Historian (史记)
                connects you to the drama of Chinese civilization.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-text-primary mb-3">
              What Native Speakers Actually Think
            </h2>
            <p className="mb-3">
              To Chinese ears, a good name sounds like it belongs to a real
              person with a family history. It should evoke a specific feeling —
              scholarly, elegant, bold, gentle — without being heavy-handed. A
              name should not sound like it came from a textbook or a
              translation app.
            </p>
            <p>
              Names that immediately identify someone as a foreigner: food names
              (包子, 奶茶), direct translations (希望 for Hope), and characters
              that appear in dictionaries but never in actual names. A Chinese
              name should feel like it could belong to someone who grew up
              speaking the language — even if the person bearing it learned
              Chinese last week.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-text-primary mb-3">
              Why This All Matters
            </h2>
            <p>
              A Chinese name is not a translation. It is a gift from a culture
              that has been refining the art of naming for three millennia. When
              you choose a Chinese name rooted in classical poetry, you are not
              just picking characters — you are stepping into a story that began
              long before you were born, and will continue long after.
            </p>
          </section>
        </div>

        <div className="mt-10 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors"
          >
            Find Your Chinese Name →
          </a>
        </div>
      </div>
    </main>
  );
}
