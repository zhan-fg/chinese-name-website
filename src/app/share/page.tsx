import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ n?: string; m?: string; c?: string }>;
}

export const metadata: Metadata = {
  title: "A Chinese Name — Shan Shui",
  description:
    "Discover the story behind this Chinese name, and find your own rooted in 3,000 years of poetry and legend.",
};

const sourceLabels: Record<string, string> = {
  poetry: "Classical Chinese Poetry",
  elements: "Five Elements Philosophy",
  nature: "Astronomy & Geography",
  mythology: "Chinese Mythology",
  history: "Historical Legends",
};

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  const name = params.n || "";
  const meaning = params.m || "";
  const category = params.c || "";

  if (!name) {
    return (
      <main className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <p className="text-white/50 text-sm">No name provided.</p>
      </main>
    );
  }

  const sourceLabel = sourceLabels[category] || "Ancient Chinese Tradition";

  return (
    <main className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center px-6 py-16">
      {/* Name — large and impactful */}
      <h1 className="text-6xl sm:text-7xl font-light text-white text-center tracking-wider mb-4">
        {name}
      </h1>

      {/* Meaning */}
      {meaning && (
        <p className="text-xl sm:text-2xl text-white/70 italic text-center mb-6">
          &ldquo;{meaning}&rdquo;
        </p>
      )}

      {/* Source badge */}
      <div className="inline-block px-4 py-2 rounded-full border border-white/20 text-white/60 text-sm mb-10">
        {sourceLabel}
      </div>

      {/* Subtext */}
      <p className="text-white/40 text-sm text-center max-w-sm mb-10">
        This name was generated from {sourceLabel.toLowerCase()}, carrying
        centuries of Chinese cultural tradition in every character.
      </p>

      {/* CTA */}
      <a
        href="/"
        className="inline-block px-8 py-4 rounded-xl bg-white text-[#0A1628] text-base font-medium hover:bg-white/90 transition-colors text-center"
      >
        Discover Your Chinese Name →
      </a>

      <p className="text-white/30 text-xs mt-6 text-center">
        newchinesename.com
      </p>
    </main>
  );
}
