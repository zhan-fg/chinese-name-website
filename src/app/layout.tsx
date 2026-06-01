import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1B4965",
};

export const metadata: Metadata = {
  title: "Shan Shui — Your Chinese Name, Rooted in 3,000 Years of Poetry and Legend",
  description:
    "Discover a Chinese name that's uniquely yours. Generated from classical poetry, five elements philosophy, mythology, and history — each name comes with its full story. No random generators, no AI nonsense. Every name has a real source.",
  keywords: [
    "chinese name generator",
    "find chinese name",
    "chinese name meaning",
    "chinese poetry name",
    "five elements name",
    "wu xing name",
    "chinese name story",
    "personalized chinese name",
    "chinese name for english speakers",
    "chinese name with pronunciation",
  ],
  authors: [{ name: "Shan Shui" }],
  openGraph: {
    title: "Shan Shui — Discover Your Chinese Name",
    description:
      "AI-generated Chinese names from classical poetry, five elements, mythology, and history. Each name comes with its full cultural story.",
    type: "website",
    locale: "en_US",
    siteName: "Shan Shui",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shan Shui — Discover Your Chinese Name",
    description:
      "AI-generated Chinese names from classical poetry, five elements, mythology, and history. Each name comes with its full cultural story.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
