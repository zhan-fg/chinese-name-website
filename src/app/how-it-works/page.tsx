import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how Shan Shui generates personalized Chinese names from classical poetry, Five Elements Bazi analysis, mythology, and history. Four simple steps to discover your Chinese name.",
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-light text-text-primary mb-2">
          How Shan Shui Works
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Four steps from curiosity to your personalized Chinese name — each
          rooted in real classical sources.
        </p>

        <div className="space-y-8">
          <Step
            num={1}
            title="Choose Your Source"
            body="Pick where your name should come from: Classical Poetry (Tang/Song dynasty verses), Five Elements Bazi (八字命理 destiny analysis based on your birth date), Stars & Earth (natural imagery), Myths & Legends (dragons, phoenixes, immortals), or Living History (real generals, poets, philosophers). Each category draws from different classical Chinese texts."
          />
          <Step
            num={2}
            title="Tell Us About Yourself"
            body="Optional but powerful: share your English name and a word that describes you. For Five Elements naming, enter your birth date, time, and location — we'll calculate your Bazi (Four Pillars of Destiny) to identify which elements need balancing in your name."
          />
          <Step
            num={3}
            title="Choose Your Surname"
            body="Browse the Hundred Family Surnames (百家姓) — 50+ traditional Chinese surnames with full cultural descriptions. Each surname tells a story: 李 (Lee) is the world's most common surname, 王 (Wang) means 'king,' 林 (Lin) means 'forest.' Pick one that resonates, or let AI recommend."
          />
          <Step
            num={4}
            title="Receive Your Name"
            body="Our AI, trained on classical Chinese texts, generates a unique name with: your full name in characters and pinyin, an English-friendly pronunciation guide, the exact classical source text and attribution, a cultural explanation with Western analogies, and an immersive story about your name's origin. Share it as a social card."
          />
        </div>

        <div className="mt-12 p-6 rounded-card bg-surface border border-card-border">
          <h2 className="text-lg font-light text-text-primary mb-3">
            Why Shan Shui?
          </h2>
          <ul className="space-y-2 text-sm text-text-secondary leading-relaxed">
            <li>
              &#x2022; Every name comes from a real classical source, clearly
              cited — no AI randomness
            </li>
            <li>
              &#x2022; Each name includes pronunciation guides designed for
              English speakers
            </li>
            <li>
              &#x2022; Cultural explanations use Western analogies (Shakespeare,
              Tolkien, Greek myths)
            </li>
            <li>
              &#x2022; Bazi (八字) analysis for Five Elements names — a
              3,000-year-old personality blueprint
            </li>
            <li>
              &#x2022; Free to use. No account required. Unlimited generations.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function Step({
  num,
  title,
  body,
}: {
  num: number;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-deep-blue text-white flex items-center justify-center text-sm font-medium">
        {num}
      </div>
      <div>
        <h2 className="text-lg font-light text-text-primary mb-1">{title}</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
