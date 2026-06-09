"use client";

import { NameEntry } from "@/lib/types";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  name: NameEntry;
  onClose: () => void;
}

// Category → badge label mapping
const categoryLabels: Record<string, string> = {
  poetry: "CLASSICAL POETRY",
  elements: "FIVE ELEMENTS",
  nature: "NATURAL WORLD",
  mythology: "CHINESE MYTHOLOGY",
  history: "HISTORICAL LEGENDS",
};

// Category → accent color
const categoryColors: Record<string, string> = {
  poetry: "rgba(180,200,220,0.9)",
  elements: "rgba(200,180,140,0.9)",
  nature: "rgba(140,200,160,0.9)",
  mythology: "rgba(200,140,180,0.9)",
  history: "rgba(200,160,140,0.9)",
};

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
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ============================================================
    // BACKGROUND — deep elegant gradient
    // ============================================================
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#0A1628");
    bgGrad.addColorStop(0.5, "#13243D");
    bgGrad.addColorStop(1, "#0D1A2D");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle mountain silhouettes — far background
    ctx.fillStyle = "rgba(20, 40, 65, 0.4)";
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.quadraticCurveTo(W * 0.2, H * 0.68, W * 0.3, H * 0.64);
    ctx.quadraticCurveTo(W * 0.45, H * 0.70, W * 0.55, H * 0.60);
    ctx.quadraticCurveTo(W * 0.7, H * 0.66, W * 0.85, H * 0.58);
    ctx.quadraticCurveTo(W * 0.95, H * 0.63, W, H * 0.56);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    // Near mountain layer
    ctx.fillStyle = "rgba(15, 30, 50, 0.6)";
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.quadraticCurveTo(W * 0.3, H * 0.82, W * 0.5, H * 0.76);
    ctx.quadraticCurveTo(W * 0.7, H * 0.84, W, H * 0.72);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    // ============================================================
    // TOP LABEL — small, elegant
    // ============================================================
    ctx.font = "300 28px 'Georgia', 'Noto Serif SC', serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MY CHINESE NAME", W / 2, H * 0.08);

    // Decorative line under label
    const accentColor = categoryColors[name.sourceCategory] || "rgba(160,180,200,0.7)";
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.38, H * 0.098);
    ctx.lineTo(W * 0.62, H * 0.098);
    ctx.stroke();

    // ============================================================
    // NAME — dominates ~40% of vertical space
    // ============================================================
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "300 220px 'Georgia', 'Noto Serif SC', 'SimSun', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.fullChars, W / 2, H * 0.26);

    // PINYIN — secondary
    ctx.font = "300 38px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(name.pinyin, W / 2, H * 0.36);

    // MEANING — smallest of the three
    ctx.font = "italic 300 32px 'Georgia', serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(name.meaning, W / 2, H * 0.405);

    // ============================================================
    // DIVIDER
    // ============================================================
    const dividerY = H * 0.44;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.25, dividerY);
    ctx.lineTo(W * 0.75, dividerY);
    ctx.stroke();

    // ============================================================
    // ARCHETYPE — big, impactful
    // ============================================================
    if (name.archetype) {
      ctx.font = "300 52px 'Georgia', 'Noto Serif SC', serif";
      ctx.fillStyle = accentColor;
      ctx.fillText(name.archetype, W / 2, H * 0.51);
    }

    // ============================================================
    // CULTURAL BADGE
    // ============================================================
    const badgeLabel = categoryLabels[name.sourceCategory] || "CLASSICAL CHINESE";
    const badgeW = Math.max(ctx.measureText(badgeLabel).width + 60, 280);
    const badgeH = 52;
    const badgeY = H * 0.585;

    roundRect(ctx, W / 2 - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 26);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "500 22px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(badgeLabel, W / 2, badgeY + 1);

    // ============================================================
    // POETIC LINE — one impactful sentence
    // ============================================================
    const poeticLine = getPoeticLine(name);
    if (poeticLine) {
      ctx.font = "italic 300 28px 'Georgia', serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";

      // Wrap text
      const maxW = W * 0.72;
      const words = `"${poeticLine}"`.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        if (ctx.measureText(line + w).width > maxW && line) {
          lines.push(line.trim());
          line = w + " ";
        } else {
          line += w + " ";
        }
      }
      lines.push(line.trim());

      const lh = 44;
      const poeticY = H * 0.67 - ((lines.length - 1) * lh) / 2;
      lines.forEach((l, i) => {
        ctx.fillText(l, W / 2, poeticY + i * lh);
      });
    }

    // ============================================================
    // FOOTER
    // ============================================================
    const hostname =
      typeof window !== "undefined"
        ? window.location.hostname
        : "newchinesename.com";
    ctx.font = "400 22px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(hostname, W / 2, H * 0.945);

    ctx.font = "300 15px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillText("Discover your Chinese name", W / 2, H * 0.965);

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
          title: `My Chinese name: ${name.chars} — ${name.archetype || name.meaning}`,
          text: `I discovered my Chinese name — "${name.fullChars}" means "${name.meaning}." ${name.archetype ? `My archetype: ${name.archetype}.` : ""} Find yours at ${typeof window !== "undefined" ? window.location.hostname : "newchinesename.com"}`,
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

/**
 * Pick the most shareable poetic line from the name data.
 * Prefers source text over long explanations.
 */
function getPoeticLine(name: NameEntry): string {
  // If we have a blessing, use it (it's designed to be poetic)
  if (name.blessing) {
    // Take first sentence or first ~100 chars
    const first = name.blessing.split(/[.!?]/)[0].trim();
    if (first.length < 15) return name.blessing.slice(0, 120).trim();
    return first;
  }
  // Fall back to source translation
  if (name.sourceTranslation && name.sourceTranslation.length < 120) {
    return name.sourceTranslation;
  }
  // Minimal fallback
  return `Inspired by ${name.sourceCategory === "poetry" ? "classical Chinese poetry" : "ancient Chinese tradition"}.`;
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
