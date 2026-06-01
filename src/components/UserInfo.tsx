"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { SourceCategory } from "@/lib/types";

interface BirthFields {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  location: string;
}

interface Props {
  visible: boolean;
  category: SourceCategory | null;
  onSkip: () => void;
  onSubmit: (
    englishName: string,
    selfWord: string,
    birth?: { year: number; month: number; day: number; hour: number; minute: number; location: string }
  ) => void;
}

export default function UserInfo({ visible, category, onSkip, onSubmit }: Props) {
  const [englishName, setEnglishName] = useState("");
  const [selfWord, setSelfWord] = useState("");
  const [birth, setBirth] = useState<BirthFields>({
    year: "",
    month: "",
    day: "",
    hour: "",
    minute: "00",
    location: "",
  });
  const [showBirthHelp, setShowBirthHelp] = useState(false);

  const isElements = category === "elements";

  const handleSubmit = () => {
    const birthData =
      isElements && birth.year && birth.month && birth.day && birth.hour
        ? {
            year: parseInt(birth.year),
            month: parseInt(birth.month),
            day: parseInt(birth.day),
            hour: parseInt(birth.hour),
            minute: parseInt(birth.minute || "0"),
            location: birth.location.trim(),
          }
        : undefined;

    onSubmit(englishName.trim(), selfWord.trim(), birthData);
  };

  const updateBirth = (field: keyof BirthFields, value: string) => {
    setBirth((prev) => ({ ...prev, [field]: value }));
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
              {isElements &&
                " For Five Elements naming, your birth date and location enable personalized Bazi analysis."}
            </p>

            <div className="space-y-4">
              {/* English name */}
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

              {/* Self word */}
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

              {/* Birth data — only for Five Elements */}
              {isElements && (
                <>
                  <div className="pt-3 border-t border-card-border">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-deep-blue uppercase tracking-wider">
                        Birth Date &amp; Time
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowBirthHelp(!showBirthHelp)}
                        className="text-[10px] text-mist hover:text-text-secondary transition-colors"
                      >
                        {showBirthHelp ? "Hide help" : "Why?"}
                      </button>
                    </div>

                    {showBirthHelp && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-[11px] text-text-secondary leading-relaxed mb-3 p-2.5 rounded-lg bg-[#EEF4F8] border border-deep-blue/10"
                      >
                        In Chinese metaphysics, your birth time determines your
                        Bazi (八字) — the Four Pillars of Destiny. This reveals
                        which of the Five Elements (金木水火土) you were born
                        with and which you need. Your name can then be crafted to
                        bring balance. Think of it as a 3,000-year-old
                        personality blueprint.
                      </motion.p>
                    )}

                    {/* Date row */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <label className="block text-[11px] text-text-secondary mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={birth.year}
                          onChange={(e) => updateBirth("year", e.target.value)}
                          placeholder="1990"
                          min="1900"
                          max="2026"
                          className="w-full px-2.5 py-2 text-sm rounded-lg border border-card-border bg-surface text-text-primary placeholder:text-mist focus:outline-none focus:border-deep-blue transition-colors"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] text-text-secondary mb-1">
                          Month
                        </label>
                        <input
                          type="number"
                          value={birth.month}
                          onChange={(e) => updateBirth("month", e.target.value)}
                          placeholder="1-12"
                          min="1"
                          max="12"
                          className="w-full px-2.5 py-2 text-sm rounded-lg border border-card-border bg-surface text-text-primary placeholder:text-mist focus:outline-none focus:border-deep-blue transition-colors"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] text-text-secondary mb-1">
                          Day
                        </label>
                        <input
                          type="number"
                          value={birth.day}
                          onChange={(e) => updateBirth("day", e.target.value)}
                          placeholder="1-31"
                          min="1"
                          max="31"
                          className="w-full px-2.5 py-2 text-sm rounded-lg border border-card-border bg-surface text-text-primary placeholder:text-mist focus:outline-none focus:border-deep-blue transition-colors"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    {/* Time row */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <label className="block text-[11px] text-text-secondary mb-1">
                          Hour (0-23)
                        </label>
                        <input
                          type="number"
                          value={birth.hour}
                          onChange={(e) => updateBirth("hour", e.target.value)}
                          placeholder="14"
                          min="0"
                          max="23"
                          className="w-full px-2.5 py-2 text-sm rounded-lg border border-card-border bg-surface text-text-primary placeholder:text-mist focus:outline-none focus:border-deep-blue transition-colors"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] text-text-secondary mb-1">
                          Minute
                        </label>
                        <input
                          type="number"
                          value={birth.minute}
                          onChange={(e) => updateBirth("minute", e.target.value)}
                          placeholder="00"
                          min="0"
                          max="59"
                          className="w-full px-2.5 py-2 text-sm rounded-lg border border-card-border bg-surface text-text-primary placeholder:text-mist focus:outline-none focus:border-deep-blue transition-colors"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-[11px] text-text-secondary mb-1">
                        Birth location (city, country)
                      </label>
                      <input
                        type="text"
                        value={birth.location}
                        onChange={(e) => updateBirth("location", e.target.value)}
                        placeholder="e.g. Beijing, China; London, UK"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-surface text-text-primary placeholder:text-mist focus:outline-none focus:border-deep-blue focus:ring-1 focus:ring-deep-blue/20 transition-colors"
                        maxLength={100}
                      />
                      <p className="text-[10px] text-mist mt-1">
                        Used to calculate your Bazi (八字). Ask your family if
                        unsure — the exact hour matters in Chinese metaphysics.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className="w-full py-3 rounded-card bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors focus:outline-none focus:ring-2 focus:ring-deep-blue/40"
                aria-label="Continue to surname selection"
              >
                Continue &rarr;
              </button>

              <button
                onClick={onSkip}
                className="w-full py-2 text-text-secondary text-xs hover:text-text-primary transition-colors"
              >
                Skip — just use my category
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
