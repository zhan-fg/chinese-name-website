"use client";

import { NameEntry } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";

interface Props {
  name: NameEntry;
  onRetry: () => void;
  onReset: () => void;
  onShare: () => void;
  isFallback?: boolean;
}

export default function NameResult({
  name,
  onRetry,
  onReset,
  onShare,
  isFallback,
}: Props) {
  const [storyOpen, setStoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [noVoice, setNoVoice] = useState(false);

  const handleCopy = async () => {
    const text = `${name.fullChars} · ${name.pinyin} — ${name.meaning}\n\n"${name.sourceTranslation}"\n— ${name.sourceAttribution}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      setNoVoice(true);
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // The full name text to speak
    const fullName = name.fullChars;

    const trySpeak = () => {
      const voices = speechSynthesis.getVoices();
      // Try to find a Chinese voice
      const zhVoice = voices.find(
        (v) => v.lang.startsWith("zh") || v.lang === "cmn"
      );

      const utterance = new SpeechSynthesisUtterance(fullName);
      utterance.lang = "zh-CN";
      utterance.rate = 0.75;
      utterance.pitch = 1;

      if (zhVoice) {
        utterance.voice = zhVoice;
      }

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => {
        setSpeaking(false);
        setNoVoice(true);
      };

      speechSynthesis.speak(utterance);
    };

    // Voices load asynchronously — if empty, wait for them
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      const onVoicesChanged = () => {
        speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        trySpeak();
      };
      speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    } else {
      trySpeak();
    }
  }, [name.fullChars]);

  const sourceIcons: Record<string, string> = {
    poetry: "\uD83D\uDCDC",
    elements: "\u262F\uFE0F",
    nature: "\uD83C\uDF0F",
    mythology: "\uD83D\uDC09",
    history: "\uD83C\uDFDB\uFE0F",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card overflow-hidden max-w-sm mx-auto"
    >
      {/* Hero: Full name with surname */}
      <div className="text-center py-10 px-6 bg-mountain-gradient">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
        >
          {/* Surname badge */}
          <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-white/60 border border-mist/30">
            <span className="text-xs text-text-secondary font-light">姓 · Surname</span>
            <span className="text-lg font-light text-text-primary">{name.surname}</span>
            <span className="text-[11px] text-text-secondary font-light">
              {name.surnamePinyin}
            </span>
          </div>

          {/* Given name - large display */}
          <h2 className="text-[68px] font-light leading-none tracking-wider text-text-primary mb-1">
            {name.givenChars}
          </h2>

          {/* Full name subtitle */}
          <p className="text-sm text-text-secondary font-light mb-1">
            <span className="font-medium text-text-primary">{name.fullChars}</span>
          </p>
          <p className="text-sm text-text-secondary font-light mb-1">
            {name.pinyin} /{" "}
            <span className="font-medium text-text-primary">{name.phonetic}</span>
          </p>
          <p className="text-sm italic text-text-secondary">
            &ldquo;{name.meaning}&rdquo;
          </p>
        </motion.div>

        {isFallback && (
          <p className="text-xs text-accent/70 mt-3 italic">
            (Showing a curated name from our collection — AI generation will be
            even more personal)
          </p>
        )}
      </div>

      {/* Source badge */}
      <div className="px-6 py-2.5 border-b border-card-border bg-surface text-center">
        <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
          <span>
            {sourceIcons[name.sourceCategory] || "\u2728"}
          </span>
          <span className="capitalize">
            From {name.sourceCategory === "elements" ? "Five Elements" : name.sourceCategory}
          </span>
        </span>
      </div>

      {/* Layer 1: Source text + translation */}
      <div className="px-6 py-5 border-b border-card-border bg-surface">
        <blockquote className="text-sm text-text-primary leading-relaxed italic mb-2 font-light">
          &ldquo;{name.sourceText}&rdquo;
        </blockquote>
        <p className="text-xs text-text-secondary">
          &mdash; {name.sourceAttribution}
        </p>
        <div className="mt-3 pt-3 border-t border-card-border/50">
          <p className="text-sm text-text-secondary leading-relaxed">
            &ldquo;{name.sourceTranslation}&rdquo;
          </p>
        </div>
      </div>

      {/* Layer 2: Explanation + user bridge */}
      <div className="px-6 py-5 border-b border-card-border bg-surface">
        <h3 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">
          &#x1F4A1; What it means
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {name.explanation}
        </p>
        <div className="mt-4 pt-3 border-t border-deep-blue/10">
          <p className="text-sm text-text-primary leading-relaxed font-light">
            {name.userBridge}
          </p>
        </div>
      </div>

      {/* Layer 3: Full story (collapsible) */}
      <div className="bg-surface">
        <button
          onClick={() => setStoryOpen(!storyOpen)}
          className="w-full px-6 py-3.5 flex items-center justify-between text-sm text-deep-blue hover:bg-[#EEF4F8] transition-colors"
          aria-expanded={storyOpen}
          aria-label="Toggle full story"
        >
          <span className="font-medium">
            {storyOpen ? "\u2212" : "+"} {storyOpen ? "Hide" : "Uncover"} the
            full story
          </span>
        </button>

        <AnimatePresence>
          {storyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 border-t border-card-border">
                <h3 className="text-sm font-medium text-text-primary mt-5 mb-3">
                  {name.storyTitle}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {name.storyBody}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Character breakdown: surname + both characters */}
      <div className="px-6 py-5 border-t border-card-border bg-[#F8FAFB]">
        <h3 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-3">
          Character Breakdown
        </h3>
        <div className="flex gap-3">
          {/* Surname */}
          <div className="flex-1 text-center p-3 rounded-lg bg-surface border border-card-border">
            <p className="text-[11px] text-text-secondary mb-1">姓</p>
            <p className="text-2xl font-light text-text-primary mb-1">
              {name.surname}
            </p>
            <p className="text-xs text-text-secondary">{name.surnamePinyin}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {name.surnameMeaning}
            </p>
          </div>
          {/* Given name char 1 */}
          <div className="flex-1 text-center p-3 rounded-lg bg-surface border border-card-border">
            <p className="text-[11px] text-text-secondary mb-1">名</p>
            <p className="text-2xl font-light text-text-primary mb-1">
              {name.char1}
            </p>
            <p className="text-xs text-text-secondary">{name.char1Pinyin}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {name.char1Meaning}
            </p>
          </div>
          {/* Given name char 2 */}
          <div className="flex-1 text-center p-3 rounded-lg bg-surface border border-card-border">
            <p className="text-[11px] text-text-secondary mb-1">名</p>
            <p className="text-2xl font-light text-text-primary mb-1">
              {name.char2}
            </p>
            <p className="text-xs text-text-secondary">{name.char2Pinyin}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {name.char2Meaning}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-card-border bg-surface flex items-center justify-between">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-[#EEF4F8]"
          aria-label="Copy name"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {" "}Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              {" "}Copy
            </>
          )}
        </button>

        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-[#EEF4F8]"
          aria-label="Share card"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
          Share Card
        </button>

        <button
          onClick={handleSpeak}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-[#EEF4F8]"
          aria-label="Hear pronunciation"
        >
          {speaking ? (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>{" "}Speaking...</>
          ) : noVoice ? (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>{" "}No voice</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>{" "}Hear</>
          )}
        </button>
      </div>

      {noVoice && (
        <div className="px-6 pb-2">
          <p className="text-[11px] text-accent/70 text-center">
            Your browser doesn&apos;t have a Chinese voice. Try opening in Chrome
            or Safari.
          </p>
        </div>
      )}

      {/* Bottom actions */}
      <div className="px-6 py-4 border-t border-card-border bg-[#F8FAFB] space-y-2">
        <button
          onClick={onRetry}
          className="w-full py-2.5 text-sm text-deep-blue font-medium hover:bg-[#EEF4F8] rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Find me another name
        </button>
        <button
          onClick={onReset}
          className="w-full py-2 text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Explore a different source
        </button>
      </div>
    </motion.div>
  );
}
