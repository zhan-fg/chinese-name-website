/**
 * Structured data (JSON-LD) for Google rich results.
 * Renders a WebApplication schema with FAQ sections.
 */
export default function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Shan Shui — Chinese Name Generator",
    description:
      "AI-powered Chinese name generator. Discover a personalized Chinese name from classical poetry, Five Elements philosophy (Bazi destiny analysis), mythology, and history. Each name comes with pronunciation guide and full cultural story.",
    url: "https://chinese-name-website.vercel.app",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "Shan Shui",
    },
    about: {
      "@type": "Thing",
      name: "Chinese Names",
      description:
        "Traditional Chinese personal names consisting of surname (姓) and given name (名), rooted in 3,000+ years of literary and philosophical tradition.",
    },
    featureList: [
      "AI-generated personalized Chinese names",
      "Bazi (八字) Five Elements destiny analysis",
      "Classical poetry source citations",
      "English pronunciation guides",
      "Cultural background stories",
      "Social share cards",
    ],
  };

  // FAQ structured data for rich snippets
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How are Chinese names structured?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A Chinese name has two parts: the surname (姓) comes first — typically one character from the Hundred Family Surnames — followed by a one or two-character given name (名). The surname represents family lineage; the given name carries meaning drawn from poetry, philosophy, or nature.",
        },
      },
      {
        "@type": "Question",
        name: "What is Bazi (八字) and how does it relate to naming?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bazi, or the Four Pillars of Destiny, is a 3,000-year-old Chinese metaphysical system. Based on your birth date, time, and location, it calculates the balance of the Five Elements (Metal, Wood, Water, Fire, Earth) in your destiny chart. A well-chosen name can supplement weak elements, bringing harmony to your personal energy — similar to how Western astrology uses birth charts.",
        },
      },
      {
        "@type": "Question",
        name: "What are the Five Elements (五行) in Chinese naming?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Five Elements — Metal (金), Wood (木), Water (水), Fire (火), Earth (土) — are the fundamental forces in Chinese philosophy. Each Chinese character carries elemental energy based on its meaning and radical. Choosing name characters with the right elemental balance can enhance or harmonize your natural tendencies, much like the Myers-Briggs personality system but rooted in Bronze Age wisdom.",
        },
      },
      {
        "@type": "Question",
        name: "Where do Chinese names come from?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Traditional Chinese names draw from five main sources: classical poetry (Tang and Song dynasty verses), Five Elements philosophy (balancing cosmic energies), natural imagery (mountains, rivers, stars), mythology and legends (dragons, phoenixes, immortals), and historical figures (generals, poets, philosophers). Each Shan Shui name includes its exact literary or philosophical source.",
        },
      },
      {
        "@type": "Question",
        name: "Can Westerners use Chinese names?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely. Many Westerners studying Chinese, working with Chinese companies, or simply fascinated by Chinese culture adopt Chinese names. A good Chinese name bridges cultures — it should be meaningful in Chinese tradition while being pronounceable and relatable for English speakers. Shan Shui generates names specifically designed for this cross-cultural purpose.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </>
  );
}
