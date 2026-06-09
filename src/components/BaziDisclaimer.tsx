"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  visible: boolean;
}

export default function BaziDisclaimer({ visible }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="max-w-sm mx-auto mb-4"
    >
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-600 shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-amber-800 leading-relaxed">
              <strong>For entertainment & education only.</strong> Bazi (八字)
              analysis is a traditional cultural practice — not scientifically
              validated. Interpretations are suggestive, not definitive.{" "}
              <a
                href="/disclaimer"
                className="underline hover:text-amber-900"
              >
                Full disclaimer
              </a>
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-amber-600 shrink-0"
            aria-label="Dismiss"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
