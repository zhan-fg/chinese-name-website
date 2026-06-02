import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://chinese-name-website.vercel.app";
const SITE_NAME = "Shan Shui";
const TAGLINE = "Your Chinese Name, Rooted in 3,000 Years of Poetry and Legend";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1B4965",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Discover a Chinese name that's uniquely yours. AI-generated from classical poetry, Five Elements Bazi destiny analysis (八字命理), mythology, and history — each name comes with its full cultural story, pronunciation guide, and share card.",
  keywords: [
    "chinese name generator",
    "chinese name for foreigners",
    "chinese name meaning",
    "chinese name with pronunciation",
    "bazi name analysis",
    "five elements name",
    "wu xing naming",
    "八字取名",
    "chinese name for english speakers",
    "chinese poetry name",
    "chinese mythology name",
    "personalized chinese name",
    "find chinese name",
    "chinese name translation",
    "chinese surname generator",
    "asian name generator",
    "chinese baby name",
    "chinese name for tattoo",
  ],
  authors: [{ name: "Shan Shui" }],
  creator: "Shan Shui",
  publisher: "Shan Shui",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Shan Shui — AI Chinese Name Generator | Poetry, Bazi & History",
    description:
      "Get a personalized Chinese name generated from 3,000 years of poetry, Five Elements destiny analysis, mythology, and history. With pronunciation guide, cultural story, and share card.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Shan Shui — Discover Your Chinese Name",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shan Shui — AI Chinese Name Generator",
    description:
      "Get a personalized Chinese name from poetry, Five Elements Bazi, mythology & history. With pronunciation guide and cultural story.",
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
        <GoogleAnalytics />
        <link rel="llms" href={`${SITE_URL}/llms.txt`} />
        <link rel="llms-full" href={`${SITE_URL}/llms-full.txt`} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
