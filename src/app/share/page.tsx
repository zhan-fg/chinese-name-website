import type { Metadata } from "next";
import type { NameEntry } from "@/lib/types";

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export const metadata: Metadata = {
  title: "A Chinese Name — Shan Shui",
  description: "Discover the full story behind this Chinese name, rooted in 3,000 years of poetry and legend.",
};

async function fetchReport(nameId: string): Promise<NameEntry | null> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://newchinesename.com";
    const res = await fetch(`${base}/api/public-report?nameId=${encodeURIComponent(nameId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.report || null;
  } catch {
    return null;
  }
}

function displayName(report: NameEntry): string {
  return report.fullChars || report.chars || "";
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  const nameId = params.id || "";
  const report = nameId ? await fetchReport(nameId) : null;

  if (!report) {
    return (
      <main className="min-h-screen bg-[#F8FAFB] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-4">This name report is not available.</p>
          <a href="/" className="text-deep-blue hover:underline text-sm">Discover your own Chinese name →</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      {/* Hero: Name + Meaning */}
      <div className="bg-mountain-gradient py-12 px-4 text-center">
        <h1 className="text-5xl sm:text-6xl font-light text-text-primary tracking-wider mb-2">
          {displayName(report)}
        </h1>
        {report.pinyin && (
          <p className="text-lg text-text-secondary mb-1">{report.pinyin}</p>
        )}
        {report.meaning && (
          <p className="text-base text-text-secondary italic">&ldquo;{report.meaning}&rdquo;</p>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Source */}
        {report.sourceText && (
          <div className="card p-5">
            <h2 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">Classical Source</h2>
            <blockquote className="text-sm text-text-primary leading-relaxed italic mb-1">
              &ldquo;{report.sourceText}&rdquo;
            </blockquote>
            <p className="text-xs text-text-secondary">&mdash; {report.sourceAttribution}</p>
            {report.sourceTranslation && (
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                &ldquo;{report.sourceTranslation}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* What it means */}
        {report.explanation && (
          <div className="card p-5">
            <h2 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">What It Means</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{report.explanation}</p>
            {report.userBridge && (
              <p className="text-sm text-text-primary mt-3 italic font-light">{report.userBridge}</p>
            )}
          </div>
        )}

        {/* Archetype */}
        {report.archetype && (
          <div className="card p-5">
            <h2 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">Chinese Archetype</h2>
            <p className="text-lg font-light text-text-primary mb-1">{report.archetype}</p>
            {report.archetypeDescription && (
              <p className="text-sm text-text-secondary leading-relaxed">{report.archetypeDescription}</p>
            )}
          </div>
        )}

        {/* Full Story */}
        {report.storyBody && (
          <div className="card p-5">
            <h2 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">
              {report.storyTitle || "The Full Story"}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">{report.storyBody}</p>
          </div>
        )}

        {/* Native perception */}
        {report.nativePerception && (
          <div className="card p-5">
            <h2 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">
              How Chinese Speakers Perceive This Name
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">{report.nativePerception}</p>
          </div>
        )}

        {/* Blessing */}
        {report.blessing && (
          <div className="card p-5 bg-[#EEF4F8] border-deep-blue/20">
            <h2 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">A Blessing</h2>
            <p className="text-sm text-text-primary leading-relaxed italic font-light">{report.blessing}</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center pt-4 pb-8">
          <p className="text-sm text-text-secondary mb-4">
            This name was crafted from Chinese classical tradition — every character rooted in centuries of poetry, philosophy, and history.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors"
          >
            Discover Your Chinese Name →
          </a>
          <p className="text-xs text-mist mt-3">newchinesename.com</p>
        </div>
      </div>
    </main>
  );
}
