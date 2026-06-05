import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Shan Shui — Discover Your Chinese Name";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F1B2D 0%, #1A3350 50%, #0D1520 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Mountain silhouettes */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 250, opacity: 0.15, display: "flex" }}>
          <svg viewBox="0 0 1200 250" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
            <path d="M0 250 L150 100 L300 160 L450 70 L600 140 L800 80 L1000 120 L1200 50 L1200 250 Z" fill="#4B7C96" />
            <path d="M0 250 L200 140 L400 180 L550 110 L750 170 L900 100 L1100 150 L1200 80 L1200 250 Z" fill="#2D5A6E" />
          </svg>
        </div>

        {/* Name */}
        <div style={{ fontSize: 80, fontWeight: 300, color: "white", letterSpacing: "0.15em" }}>
          山水
        </div>

        {/* Title */}
        <div style={{ fontSize: 48, fontWeight: 300, color: "rgba(255,255,255,0.85)", marginTop: 24, letterSpacing: "0.05em" }}>
          Shan Shui
        </div>

        {/* Description */}
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.5)", fontWeight: 300, marginTop: 20 }}>
          Your Chinese Name · AI-Generated from Classical Poetry & History
        </div>

        {/* Footer */}
        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.25)", fontWeight: 300, marginTop: 48 }}>
          Free · Personalized · Cultural Stories
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
