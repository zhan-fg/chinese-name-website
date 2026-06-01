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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 1080;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#F8FAFB");
    gradient.addColorStop(0.5, "#EAF1F5");
    gradient.addColorStop(1, "#DCE8EF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Subtle mountain silhouette at bottom
    ctx.fillStyle = "rgba(75, 124, 150, 0.06)";
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.quadraticCurveTo(size * 0.3, size * 0.75, size * 0.5, size * 0.72);
    ctx.quadraticCurveTo(size * 0.7, size * 0.78, size, size * 0.7);
    ctx.lineTo(size, size);
    ctx.lineTo(0, size);
    ctx.fill();

    // Characters (large, centered)
    ctx.fillStyle = "#1A2B34";
    ctx.font = "light 180px 'Georgia', 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    const chars = name.chars.replace(" ", "\u2009\u2009");
    ctx.fillText(chars, size / 2, size * 0.42);

    // Pinyin + phonetic
    ctx.font = "32px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "#5E6F78";
    ctx.fillText(
      `${name.pinyin} \u00B7 ${name.phonetic}`,
      size / 2,
      size * 0.52
    );

    // Divider
    ctx.strokeStyle = "rgba(27, 73, 101, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size * 0.25, size * 0.57);
    ctx.lineTo(size * 0.75, size * 0.57);
    ctx.stroke();

    // Quote
    const quote = `\u201C${name.sourceTranslation}\u201D`;
    ctx.fillStyle = "#1A2B34";
    ctx.font = "italic 28px 'Georgia', serif";
    const words = quote.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      if ((ctx.measureText(line + word).width > size * 0.7) && line) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line += word + " ";
      }
    }
    lines.push(line.trim());

    const lineHeight = 42;
    const startY = size * 0.65;
    lines.forEach((l, i) => {
      ctx.fillText(l, size / 2, startY + i * lineHeight);
    });

    // Attribution
    ctx.fillStyle = "#5E6F78";
    ctx.font = "20px 'Inter', system-ui, sans-serif";
    ctx.fillText(
      `\u2014 ${name.sourceAttribution.split("\u2014")[1]?.trim() || name.sourceAttribution}`,
      size / 2,
      startY + lines.length * lineHeight + 30
    );

    // Bottom branding
    ctx.fillStyle = "#1B4965";
    ctx.font = "24px 'Inter', system-ui, sans-serif";
    ctx.fillText("shanshui.name", size / 2, size * 0.93);

    ctx.fillStyle = "#8BAFBF";
    ctx.font = "16px 'Inter', system-ui, sans-serif";
    ctx.fillText("Discover your Chinese name", size / 2, size * 0.96);

    setImageUrl(canvas.toDataURL("image/png"));
    setGenerating(false);
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    const blob = await (await fetch(imageUrl)).blob();
    const file = new File([blob], `${name.chars.replace(" ", "-")}-name.png`, {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: `My Chinese name: ${name.chars} \u2014 ${name.meaning}`,
          text: `I discovered my Chinese name on shanshui.name \u2014 "${name.chars}" means "${name.meaning}." Find yours!`,
          files: [file],
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: download
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
          <div className="aspect-square bg-mountain-gradient rounded-lg flex items-center justify-center">
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
