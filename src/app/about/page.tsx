import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Shan Shui",
  description:
    "Shan Shui creates personalized Chinese names for Western audiences. Learn about our mission to bridge cultures through the ancient art of Chinese naming.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-light text-text-primary mb-2">
          About Shan Shui
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Bridging cultures through the ancient art of Chinese naming
        </p>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">Shan Shui</strong> (山水) means
            &ldquo;mountains and water&rdquo; in Chinese — the two elements that
            define Chinese landscape painting and poetry. Just as a landscape
            painting captures an entire world in brushstrokes, a Chinese name
            captures an entire identity in just two or three characters.
          </p>

          <h2 className="text-lg font-light text-text-primary pt-4">
            Our Mission
          </h2>
          <p>
            We believe that names are bridges. A Chinese name isn&apos;t just a
            label — it&apos;s a story, a philosophy, and a connection to 3,000
            years of continuous civilization. We built Shan Shui to make that
            connection accessible to everyone, regardless of their background or
            language.
          </p>
          <p>
            Every name we generate comes from a real source: a Tang Dynasty poem,
            an ancient Five Elements text, a myth from the Classic of Mountains
            and Seas. No random combinations. No AI hallucinations. Every name
            has provenance.
          </p>

          <h2 className="text-lg font-light text-text-primary pt-4">
            Who We Serve
          </h2>
          <p>
            Chinese language learners seeking authentic names. Professionals
            working with Chinese companies. Travelers preparing for journeys to
            China. Martial artists, tea enthusiasts, and culture lovers. Anyone
            curious about what their name would be if they were born on the other
            side of the world.
          </p>

          <h2 className="text-lg font-light text-text-primary pt-4">
            The Name Behind the Names
          </h2>
          <p>
            Shan Shui is an independent project built with Next.js and AI. It
            combines modern technology with classical scholarship to create
            something that hasn&apos;t existed before: a Chinese name generator
            that respects the depth and dignity of the tradition it draws from.
          </p>
        </div>
      </div>
    </main>
  );
}
