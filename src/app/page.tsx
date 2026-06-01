"use client";

import { useState } from "react";
import { SourceCategory, NameEntry } from "@/lib/types";
import SourceSelector from "@/components/SourceSelector";
import UserInfo from "@/components/UserInfo";
import GeneratingLoader from "@/components/GeneratingLoader";
import NameResult from "@/components/NameResult";
import ShareCard from "@/components/ShareCard";
import StepIndicator from "@/components/StepIndicator";

type Step = "category" | "userinfo" | "loading" | "result";

export default function Home() {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<SourceCategory | null>(null);
  const [englishName, setEnglishName] = useState("");
  const [selfWord, setSelfWord] = useState("");
  const [result, setResult] = useState<NameEntry | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategorySelect = (cat: SourceCategory) => {
    setCategory(cat);
  };

  const handleContinueFromCategory = () => {
    if (category) {
      setStep("userinfo");
    }
  };

  const handleUserInfoSubmit = async (
    name: string,
    word: string
  ) => {
    setEnglishName(name);
    setSelfWord(word);
    setError(null);
    await fetchName(name, word);
  };

  const handleSkip = async () => {
    setEnglishName("");
    setSelfWord("");
    setError(null);
    await fetchName("", "");
  };

  const fetchName = async (name: string, word: string) => {
    setStep("loading");
    try {
      const res = await fetch("/api/generate-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCategory: category,
          englishName: name || undefined,
          selfWord: word || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch (err) {
      console.error("Failed to fetch name:", err);
      setError("Something went wrong. Please try again.");
      setStep("category");
    }
  };

  const handleRetry = async () => {
    setError(null);
    await fetchName(englishName, selfWord);
  };

  const handleReset = () => {
    setStep("category");
    setCategory(null);
    setEnglishName("");
    setSelfWord("");
    setResult(null);
    setError(null);
  };

  const handleShare = () => {
    setShowShare(true);
  };

  // Determine step number for indicator
  const stepNumber = step === "category" ? 1 : step === "userinfo" ? 2 : 3;
  const stepLabels = ["Source", "About You", "Your Name"];

  return (
    <main className="min-h-screen bg-[#F8FAFB] flex flex-col">
      {/* Header */}
      <header className="text-center pt-8 pb-4 px-4">
        <h1 className="text-xl font-light text-text-primary tracking-wide">
          Shan Shui
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Your Chinese name, rooted in 3,000 years of poetry and legend
        </p>
      </header>

      {/* Step indicator */}
      {step !== "result" && (
        <div className="px-4 mb-6">
          <StepIndicator
            steps={stepLabels}
            current={stepNumber - 1}
            onStepClick={(i) => {
              if (i === 0) handleReset();
              if (i === 1 && category) setStep("userinfo");
            }}
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="px-4 mb-4">
          <div className="max-w-sm mx-auto p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center">
            {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 px-4 pb-8">
        {/* Step 1: Category selection */}
        {step === "category" && (
          <div>
            <SourceSelector
              selected={category}
              onSelect={handleCategorySelect}
            />
            {category && (
              <div className="mt-6 max-w-sm mx-auto">
                <button
                  onClick={handleContinueFromCategory}
                  className="w-full py-3 rounded-card bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors"
                >
                  Continue &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: User info */}
        <UserInfo
          visible={step === "userinfo"}
          onSkip={handleSkip}
          onSubmit={handleUserInfoSubmit}
        />

        {/* Loading */}
        {step === "loading" && <GeneratingLoader />}

        {/* Step 3: Result */}
        {step === "result" && result && (
          <NameResult
            name={result}
            isFallback={(result as NameEntry & { _fallback?: boolean })._fallback}
            onRetry={handleRetry}
            onReset={handleReset}
            onShare={handleShare}
          />
        )}
      </div>

      {/* Footer trust signal */}
      <footer className="text-center py-6 px-4">
        <p className="text-[11px] text-mist leading-relaxed">
          &#x2727; Each name is generated from classical Chinese texts and
          verified against historical sources &#x2727;
        </p>
      </footer>

      {/* Share modal */}
      {showShare && result && (
        <ShareCard name={result} onClose={() => setShowShare(false)} />
      )}
    </main>
  );
}
