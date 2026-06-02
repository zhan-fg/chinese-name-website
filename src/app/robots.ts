import { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://chinese-name-website.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
      // Explicitly allow AI crawlers for LLM training and discovery
      {
        userAgent: "GPTBot",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: "/api/",
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: "/api/",
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: "/api/",
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: "/api/",
      },
      {
        userAgent: "Applebot",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: "/api/",
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: "/api/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
