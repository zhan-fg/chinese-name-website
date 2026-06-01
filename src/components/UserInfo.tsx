"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Props {
  visible: boolean;
  onSkip: () => void;
  onSubmit: (englishName: string, selfWord: string) => void;
}

export default function UserInfo({ visible, onSkip, onSubmit }: Props) {
  const [englishName, setEnglishName] = useState("");
  const [selfWord, setSelfWord] = useState("");

  const handleSubmit = () => {
    onSubmit(englishName.trim(), selfWord.trim());
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="card p-5 mb-4">
            <h2 className="text-lg font-light text-text-primary mb-1">
              Tell us about yourself
            </h2>
            <p className="text-text-secondary text-xs mb-5 leading-relaxed">
              Optional — but it helps us find a name that truly fits you.
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="englishName"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  Your English name
                </label>
                <input
                  id="englishName"
                  type="text"
                  value={englishName}
                  onChange={(e) => setEnglishName(e.target.value)}
                  placeholder="e.g. Emma, James"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-surface text-text-primary placeholder:text-mist focus:outline-none focus:border-deep-blue focus:ring-1 focus:ring-deep-blue/20 transition-colors"
                  maxLength={50}
                />
              </div>

              <div>
                <label
                  htmlFor="selfWord"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  One word that describes you
                </label>
                <input
                  id="selfWord"
                  type="text"
                  value={selfWord}
                  onChange={(e) => setSelfWord(e.target.value)}
                  placeholder="e.g. adventurous, curious, calm"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-surface text-text-primary placeholder:text-mist focus:outline-none focus:border-deep-blue focus:ring-1 focus:ring-deep-blue/20 transition-colors"
                  maxLength={30}
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-3 rounded-card bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors focus:outline-none focus:ring-2 focus:ring-deep-blue/40"
                aria-label="Discover my name"
              >
                Discover My Name &rarr;
              </button>

              <button
                onClick={onSkip}
                className="w-full py-2 text-text-secondary text-xs hover:text-text-primary transition-colors"
              >
                Skip &mdash; just use my category
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
