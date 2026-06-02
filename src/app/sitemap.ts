import { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://chinese-name-website.vercel.app";

const lastMod = new Date("2025-06-02");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: lastMod,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: lastMod,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/disclaimer`,
      lastModified: lastMod,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
