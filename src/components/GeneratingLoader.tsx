"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const trivia = [
  "The oldest surviving Chinese name is over 3,000 years old.",
  'Li Bai\'s name literally means "Plum White" — his mother dreamed of a white star before his birth.',
  "Most Chinese names are 2 or 3 characters. 4-character names are extremely rare.",
  "The Five Elements (\u4E94\u884C) have been used for naming since 2000 BCE.",
  "In ancient China, people had multiple names: a birth name, a courtesy name (at 20), and sometimes an art name.",
  'The character \u660E (m\u00EDng, \"bright\") appears in the names of 6 different Chinese dynasties.',
  "Chinese family names come first — there are only about 100 common ones for 1.4 billion people.",
  "The phoenix (\u51E4\u51F0) appears in Chinese names 3,000 years before it appears in Harry Potter.",
  'Tang Dynasty poets wrote over 48,900 poems — many of which are still mined for baby names today.',
  'The I Ching (\u6613\u7ECF), the world\'s oldest book, is still used by parents choosing names for their children.',
  "Unlike Western traditions, Chinese names are chosen for meaning and sound — never after relatives.",
  'Emperor Qin Shi Huang\'s birth name (\u8D62\u653F) was considered so sacred it\'s almost never used as a name today.',
];

export default function GeneratingLoader() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % trivia.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card p-8 max-w-sm mx-auto text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="text-4xl mb-6 inline-block"
      >
        \u2728
      </motion.div>

      <h2 className="text-lg font-light text-text-primary mb-2">
        Weaving your name...
      </h2>
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">
        Searching classical texts for the perfect characters that match your
        spirit. This usually takes a few seconds.
      </p>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-card-border rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-deep-blue rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 5, ease: "easeInOut" }}
        />
      </div>

      {/* Rotating trivia */}
      <motion.p
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="text-xs text-text-secondary italic leading-relaxed"
      >
        {trivia[idx]}
      </motion.p>
    </div>
  );
}
