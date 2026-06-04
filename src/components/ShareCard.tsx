"use client";

import { NameEntry } from "@/lib/types";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  name: NameEntry;
  onClose: () => void;
}

export default function ShareCard({ name, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    generateCard();
  }, []);

  const generateCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 1080;
    const H = 1350; // taller 4:5 ratio for social media
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background — deep navy mountain gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#0F1B2D");
    bgGrad.addColorStop(0.4, "#1A3350");
    bgGrad.addColorStop(1, "#0D1520");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Mountain silhouettes
    ctx.fillStyle = "rgba(20, 40, 65, 0.5)";
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.quadraticCurveTo(W * 0.15, H * 0.72, W * 0.25, H * 0.65);
    ctx.quadraticCurveTo(W * 0.35, H * 0.70, W * 0.45, H * 0.60);
    ctx.quadraticCurveTo(W * 0.55, H * 0.68, W * 0.65, H * 0.58);
    ctx.quadraticCurveTo(W * 0.8, H * 0.66, W, H * 0.62);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    // Lighter mountain layer
    ctx.fillStyle = "rgba(30, 60, 90, 0.3)";
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.quadraticCurveTo(W * 0.25, H * 0.80, W * 0.4, H * 0.76);
    ctx.quadraticCurveTo(W * 0.6, H * 0.82, W * 0.8, H * 0.74);
    ctx.quadraticCurveTo(W * 0.9, H * 0.78, W, H * 0.72);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    // Accent line
    ctx.strokeStyle = "rgba(100, 160, 200, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.2, H * 0.54);
    ctx.lineTo(W * 0.8, H * 0.54);
    ctx.stroke();

    // === FULL NAME — large and bold ===
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "300 220px 'Georgia', 'Noto Serif SC', 'SimSun', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.fullChars, W / 2, H * 0.38);

    // Meaning in English
    ctx.font = "italic 500 36px 'Georgia', serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(`\u201C${name.meaning}\u201D`, W / 2, H * 0.50);

    // Pinyin + phonetic
    ctx.font = "300 28px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(`${name.pinyin}  \u00B7  ${name.phonetic}`, W / 2, H * 0.56);

    // === CHARACTER BREAKDOWN ===
    const charY = H * 0.68;

    // Left box — char1
    roundRect(ctx, W * 0.15, charY - 55, W * 0.32, 140, 16);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "300 64px 'Georgia', 'Noto Serif SC', serif";
    ctx.fillText(name.char1, W * 0.31, charY - 5);
    ctx.font = "400 18px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(name.char1Pinyin, W * 0.31, charY + 32);
    ctx.font = "400 16px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(name.char1Meaning, W * 0.31, charY + 54);

    // Right box — char2
    roundRect(ctx, W * 0.53, charY - 55, W * 0.32, 140, 16);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "300 64px 'Georgia', 'Noto Serif SC', serif";
    ctx.fillText(name.char2, W * 0.69, charY - 5);
    ctx.font = "400 18px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(name.char2Pinyin, W * 0.69, charY + 32);
    ctx.font = "400 16px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(name.char2Meaning, W * 0.69, charY + 54);

    // === SOURCE QUOTE ===
    const quoteY = H * 0.85;
    ctx.font = "italic 300 26px 'Georgia', serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";

    const quote = `\u201C${name.sourceTranslation}\u201D`;
    const words = quote.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      if (ctx.measureText(line + word).width > W * 0.7 && line) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line += word + " ";
      }
    }
    lines.push(line.trim());

    const lh = 38;
    const qStart = quoteY - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => {
      ctx.fillText(l, W / 2, qStart + i * lh);
    });

    // Attribution
    ctx.font = "300 18px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    const attr =
      name.sourceAttribution.split("\u2014")[1]?.trim() ||
      name.sourceAttribution;
    ctx.fillText(`\u2014 ${attr}`, W / 2, qStart + lines.length * lh + 28);

    // === FOOTER ===
    const hostname =
      typeof window !== "undefined"
        ? window.location.hostname
        : "shanshui.name";
    ctx.font = "400 22px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(hostname, W / 2, H * 0.975);
    ctx.font = "300 15px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillText("Discover your Chinese name", W / 2, H * 0.998);

    setImageUrl(canvas.toDataURL("image/png"));
    setGenerating(false);
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    const blob = await (await fetch(imageUrl)).blob();
    const file = new File(
      [blob],
      `${name.chars.replace(" ", "-")}-name.png`,
      { type: "image/png" }
    );

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: `My Chinese name: ${name.chars} — ${name.meaning}`,
          text: `I discovered my Chinese name — "${name.chars}" means "${name.meaning}." Find yours at ${window.location.hostname}`,
          files: [file],
        });
      } catch {}
    } else {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = `${name.chars.replace(" ", "-")}-name.png`;
      a.click();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-card p-5 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-text-primary mb-4 text-center">
          Your Share Card
        </h3>

        <canvas ref={canvasRef} className="hidden" />

        {generating ? (
          <div className="aspect-[4/5] bg-mountain-gradient rounded-lg flex items-center justify-center">
            <p className="text-sm text-text-secondary">Generating...</p>
          </div>
        ) : (
          imageUrl && (
            <img
              src={imageUrl}
              alt={`Share card for ${name.chars}`}
              className="w-full rounded-lg shadow-sm"
            />
          )
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleShare}
            disabled={generating}
            className="flex-1 py-2.5 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors disabled:opacity-50"
          >
            Share
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-card-border text-text-secondary text-sm hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper: rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
