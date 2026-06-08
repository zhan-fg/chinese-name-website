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
  /** Whether this specific name is unlocked (paid) */
  isUnlocked?: boolean;
  /** Gumroad product URL for the Report */
  reportUrl?: string;
}

function Skeleton({ h = "h-3", w = "w-full" }: { h?: string; w?: string }) {
  return (
    <div className={`${h} ${w} bg-mist/15 rounded animate-pulse`} />
  );
}

function BlurOverlay({
  title,
  description,
  reportUrl,
}: {
  title: string;
  description: string;
  reportUrl?: string;
}) {
  return (
    <div className="relative">
      <div className="blur-sm select-none opacity-30 pointer-events-none">
        {title === "source" && (
          <div className="px-6 py-5 border-b border-card-border bg-surface">
            <blockquote className="text-sm text-text-primary leading-relaxed italic mb-2 font-light">
              &ldquo;长风破浪会有时，直挂云帆济沧海&rdquo;
            </blockquote>
            <p className="text-xs text-text-secondary">
              — Li Bai, Tang Dynasty
            </p>
            <div className="mt-3 pt-3 border-t border-card-border/50">
              <p className="text-sm text-text-secondary leading-relaxed">
                &ldquo;Riding the wind, I&apos;ll break the waves...&rdquo;
              </p>
            </div>
          </div>
        )}
        {title === "story" && (
          <div className="px-6 py-5 border-b border-card-border bg-surface">
            <h3 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">
              &#x2728; The Story Behind This Name
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              In the misty mountains of ancient China, a scholar once wrote these
              characters to capture the essence of a distant traveler&apos;s
              dream...
            </p>
          </div>
        )}
        {title === "meaning" && (
          <div className="px-6 py-5 border-b border-card-border bg-surface">
            <h3 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-2">
              &#x1F4A1; What it means
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Each character carries millennia of meaning, chosen specifically
              to resonate with your personality and aspirations...
            </p>
            <div className="mt-4 pt-3 border-t border-deep-blue/10">
              <p className="text-sm text-text-primary leading-relaxed font-light">
                For someone like you, this name speaks to a quiet strength and
                curiosity about the world...
              </p>
            </div>
          </div>
        )}
        {title === "chars" && (
          <div className="px-6 py-5 border-t border-card-border bg-[#F8FAFB]">
            <h3 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-3">
              Character Breakdown
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 text-center p-3 rounded-lg bg-surface border border-card-border">
                <p className="text-[11px] text-text-secondary mb-1">姓</p>
                <p className="text-2xl font-light text-text-primary mb-1">李</p>
                <p className="text-xs text-text-secondary">Lǐ</p>
              </div>
              <div className="flex-1 text-center p-3 rounded-lg bg-surface border border-card-border">
                <p className="text-[11px] text-text-secondary mb-1">名</p>
                <p className="text-2xl font-light text-text-primary mb-1">思</p>
                <p className="text-xs text-text-secondary">Sī</p>
              </div>
              <div className="flex-1 text-center p-3 rounded-lg bg-surface border border-card-border">
                <p className="text-[11px] text-text-secondary mb-1">名</p>
                <p className="text-2xl font-light text-text-primary mb-1">远</p>
                <p className="text-xs text-text-secondary">Yuǎn</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-[2px]">
        <p className="text-lg mb-1">&#x1F512;</p>
        <p className="text-sm font-medium text-text-primary mb-1">
          {title === "source"
            ? "Classical Source"
            : title === "story"
            ? "Full Story"
            : title === "meaning"
            ? "Cultural Meaning"
            : "Character Analysis"}
        </p>
        <p className="text-xs text-text-secondary text-center px-4 mb-3">
          {description}
        </p>
        {reportUrl && (
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-deep-blue text-white text-xs font-medium hover:bg-mid-blue transition-colors"
          >
            Unlock Full Report — $4.99
          </a>
        )}
      </div>
    </div>
  );
}

export default function NameResult({
  name,
  onRetry,
  onReset,
  onShare,
  isFallback,
  isUnlocked,
  reportUrl,
}: Props) {
  const storyLoading = name._storyLoading;
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

    speechSynthesis.cancel();

    const fullName = name.fullChars;

    const trySpeak = () => {
      const voices = speechSynthesis.getVoices();
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

  const showPreview = !isUnlocked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card overflow-hidden max-w-sm mx-auto"
    >
      {/* Hero: Full name with surname — ALWAYS visible */}
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

      {/* GATED SECTIONS — shown blurred with unlock CTA for free users */}
      {showPreview ? (
        <>
          <BlurOverlay
            title="source"
            description="See the classical poem that inspired your name"
            reportUrl={reportUrl}
          />
          <BlurOverlay
            title="meaning"
            description="Understand the philosophy behind each character"
            reportUrl={reportUrl}
          />
          <BlurOverlay
            title="story"
            description="Read the legend behind your name"
            reportUrl={reportUrl}
          />
          <BlurOverlay
            title="chars"
            description="See the ancient meaning of every stroke"
            reportUrl={reportUrl}
          />
        </>
      ) : (
        <>
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
            {storyLoading ? (
              <div className="space-y-2">
                <Skeleton h="h-3" w="w-full" />
                <Skeleton h="h-3" w="w-5/6" />
                <Skeleton h="h-3" w="w-4/6" />
                <div className="mt-4 pt-3 border-t border-deep-blue/10 space-y-2">
                  <Skeleton h="h-3" w="w-full" />
                  <Skeleton h="h-3" w="w-3/4" />
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {name.explanation}
                </p>
                <div className="mt-4 pt-3 border-t border-deep-blue/10">
                  <p className="text-sm text-text-primary leading-relaxed font-light">
                    {name.userBridge}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Layer 3: Full story (collapsible) */}
          <div className="bg-surface">
            <button
              onClick={() => !storyLoading && setStoryOpen(!storyOpen)}
              className={`w-full px-6 py-3.5 flex items-center justify-between text-sm transition-colors ${
                storyLoading
                  ? "text-mist cursor-wait"
                  : "text-deep-blue hover:bg-[#EEF4F8]"
              }`}
              aria-expanded={storyOpen}
              aria-label="Toggle full story"
              disabled={storyLoading}
            >
              <span className="font-medium">
                {storyLoading
                  ? "\u23F3 Crafting your story..."
                  : `${storyOpen ? "\u2212" : "+"} ${storyOpen ? "Hide" : "Uncover"} the full story`}
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

          {/* Character breakdown */}
          <div className="px-6 py-5 border-t border-card-border bg-[#F8FAFB]">
            <h3 className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-3">
              Character Breakdown
            </h3>
            <div className="flex gap-3">
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
        </>
      )}

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

        {isUnlocked && (
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors py-1.5 px-2 rounded-lg hover:bg-[#EEF4F8]"
            aria-label="Share card"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            Share Card
          </button>
        )}

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
