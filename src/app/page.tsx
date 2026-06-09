"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SourceCategory, NameEntry } from "@/lib/types";
import SourceSelector from "@/components/SourceSelector";
import UserInfo from "@/components/UserInfo";
import SurnameSelector from "@/components/SurnameSelector";
import GeneratingLoader from "@/components/GeneratingLoader";
import NameResult from "@/components/NameResult";
import ShareCard from "@/components/ShareCard";
import StepIndicator from "@/components/StepIndicator";
import BaziDisclaimer from "@/components/BaziDisclaimer";
import CreditBadge from "@/components/CreditBadge";
import PaywallModal from "@/components/PaywallModal";
import InlineClaim from "@/components/InlineClaim";
import { GUMROAD_PRODUCTS } from "@/lib/gumroad";

type Step = "category" | "userinfo" | "surname" | "loading" | "result";

// Steps that map to history entries (loading is skipped)
const STEP_TO_HASH: Record<Step, number> = {
  category: 0,
  userinfo: 1,
  surname: 2,
  loading: -1,
  result: 3,
};
const HASH_TO_STEP: Record<number, Step> = {
  0: "category",
  1: "userinfo",
  2: "surname",
  3: "result",
};

export default function Home() {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<SourceCategory | null>(null);
  const [englishName, setEnglishName] = useState("");
  const [selfWord, setSelfWord] = useState("");
  const [surname, setSurname] = useState("");
  const [birthData, setBirthData] = useState<{
    year: number; month: number; day: number; hour: number; minute: number; location: string;
  } | null>(null);
  const [result, setResult] = useState<NameEntry | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [creditRefresh, setCreditRefresh] = useState(0);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);
  const [gender, setGender] = useState<"male" | "female" | "neutral">("neutral");

  // Track generated fullChars for dedup
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  // Track unlocked name IDs (paid reports)
  const [unlockedNames, setUnlockedNames] = useState<Set<string>>(new Set());

  // Ref to avoid stale closure in event handlers
  const unlockedNamesRef = useRef(unlockedNames);
  unlockedNamesRef.current = unlockedNames;

  // Inline claim: nameId to unlock (shown when user returns from Gumroad)
  const [inlineClaimNameId, setInlineClaimNameId] = useState("");

  // Load unlocked names from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("shan-unlocked");
      if (stored) {
        const names: string[] = JSON.parse(stored);
        setUnlockedNames(new Set(names));
      }
    } catch {}

    // Listen for cross-tab changes (e.g. /thank-you page updates shan-unlocked)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "shan-unlocked" && e.newValue) {
        try {
          const names: string[] = JSON.parse(e.newValue);
          setUnlockedNames(new Set(names));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // When user returns to this tab (after Gumroad payment), re-check localStorage
  useEffect(() => {
    const handleFocus = () => {
      try {
        // Check if there's a pending unlock (user bought on Gumroad but hasn't claimed yet)
        const pending = localStorage.getItem("shan-pending-unlock");
        if (pending && !unlockedNamesRef.current.has(pending)) {
          setInlineClaimNameId(pending);
        }

        // Re-read unlocked names (might have been updated by /thank-you tab)
        const stored = localStorage.getItem("shan-unlocked");
        if (stored) {
          const names: string[] = JSON.parse(stored);
          setUnlockedNames((prev) => {
            const next = new Set(prev);
            let added = false;
            for (const n of names) {
              if (!next.has(n)) { next.add(n); added = true; }
            }
            return added ? new Set(next) : prev;
          });
        }
      } catch {}
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") handleFocus();
    });
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  // Check if current name is unlocked (paid report)
  const currentNameId = result ? `${result.fullChars}-${result.sourceCategory}` : "";
  const isCurrentUnlocked = unlockedNames.has(currentNameId);

  // Anonymous user ID — persisted in localStorage for credit tracking
  const [anonymousId, setAnonymousId] = useState("");
  useEffect(() => {
    let id = localStorage.getItem("shan-anon-id");
    if (!id) {
      id = "anon_" + crypto.randomUUID();
      localStorage.setItem("shan-anon-id", id);
    }
    setAnonymousId(id);
  }, []);

  // Detect ?buy=credit_5 etc. from pricing page → show PaywallModal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const buy = params.get("buy");
    if (buy && anonymousId) {
      setShowPaywall(true);
      // Clean URL
      window.history.replaceState({}, "", "/");
    }
  }, [anonymousId]);

  // Prevent pushing history during popstate handling
  const skipHistory = useRef(false);

  // Navigate to a step AND push browser history
  const goToStep = useCallback(
    (newStep: Step) => {
      setStep(newStep);
      if (!skipHistory.current) {
        const idx = STEP_TO_HASH[newStep];
        if (idx >= 0) {
          // Use replaceState if going backward, pushState if going forward
          // Simple heuristic: category=0 always replaces, others push
          if (idx === 0) {
            history.replaceState({ step: idx }, "", "#");
          } else {
            history.pushState({ step: idx }, "", `#step=${idx}`);
          }
        }
      }
      skipHistory.current = false;
    },
    []
  );

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      skipHistory.current = true;
      if (e.state && typeof e.state.step === "number") {
        const restored = HASH_TO_STEP[e.state.step];
        if (restored) {
          // If going back to a step before result, clear the result
          if (restored !== "result") setResult(null);
          setStep(restored);
        }
      } else {
        // No state = back to initial page = category
        setResult(null);
        setError(null);
        setStep("category");
      }
    };

    // On initial load, check if there's a hash (for refresh support)
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const match = hash.match(/step=(\d)/);
      if (match && history.state?.step === undefined) {
        const idx = parseInt(match[1]);
        const restored = HASH_TO_STEP[idx];
        if (restored) {
          skipHistory.current = true;
          setStep(restored);
        }
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleCategorySelect = (cat: SourceCategory) => {
    setCategory(cat);
    goToStep("userinfo");
  };

  const handleUserInfoSubmit = (
    name: string,
    word: string,
    gender?: "male" | "female" | "neutral",
    birth?: { year: number; month: number; day: number; hour: number; minute: number; location: string }
  ) => {
    setEnglishName(name);
    setSelfWord(word);
    setGender(gender || "neutral");
    if (birth) setBirthData(birth);
    goToStep("surname");
  };

  const handleUserInfoSkip = () => {
    setEnglishName("");
    setSelfWord("");
    setBirthData(null);
    goToStep("surname");
  };

  const handleSurnameSelect = (s: string) => {
    setSurname(s);
    setError(null);
    fetchName(englishName, selfWord, s);
  };

  const handleSurnameSkip = () => {
    setSurname("");
    setError(null);
    fetchName(englishName, selfWord, "");
  };

  const fetchName = async (name: string, word: string, s: string) => {
    // Wait for anonymousId to be ready
    const anonId = anonymousId || localStorage.getItem("shan-anon-id");
    
    // Check credits before generating
    if (anonId) {
      try {
        const checkRes = await fetch(
          `/api/check-credits?anonymousId=${encodeURIComponent(anonId)}`
        );
        const credits = await checkRes.json();

        // Only enforce limit if we got valid credit data
        if (!credits.error && credits.totalRemaining !== undefined) {
          if (credits.freeRemaining <= 0 && credits.creditsRemaining <= 0) {
            setShowPaywall(true);
            return;
          }
        }
      } catch {
        // If credit check fails, allow generation (fail open)
      }
    }

    setStep("loading");
    skipHistory.current = false; // loading step doesn't push history
    try {
      const res = await fetch("/api/generate-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCategory: category,
          englishName: name || undefined,
          selfWord: word || undefined,
          surname: s || undefined,
          gender: gender !== "neutral" ? gender : undefined,
          birthYear: birthData?.year,
          birthMonth: birthData?.month,
          birthDay: birthData?.day,
          birthHour: birthData?.hour,
          birthMinute: birthData?.minute,
          birthLocation: birthData?.location || undefined,
          anonymousId: anonId || undefined,
          excludeNames: generatedNames,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      goToStep("result");

      // Track for dedup
      if (data.fullChars) {
        setGeneratedNames((prev) => [...prev, data.fullChars]);
      }

      // Refresh credit badge after generation
      setCreditRefresh((k) => k + 1);

      // Phase 2: Load story asynchronously
      if (data._storyLoading !== false) {
        fetch("/api/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nameData: data,
            sourceCategory: category,
            englishName: name || undefined,
            selfWord: word || undefined,
            surname: s || undefined,
          }),
        })
          .then((sRes) => sRes.json())
          .then((story) => {
            setResult((prev) =>
              prev ? { ...prev, ...story, _storyLoading: false } : prev
            );
            // Phase 3: Load personality analysis
            setResult((prev) =>
              prev ? { ...prev, _personalityLoading: true } : prev
            );
            fetch("/api/generate-personality", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nameData: { ...data, ...story },
                sourceCategory: category,
                englishName: name || undefined,
                selfWord: word || undefined,
              }),
            })
              .then((pRes) => pRes.json())
              .then((personality) => {
                setResult((prev) =>
                  prev ? { ...prev, ...personality, _personalityLoading: false } : prev
                );
              })
              .catch(() => {
                setResult((prev) =>
                  prev ? { ...prev, _personalityLoading: false } : prev
                );
              });
          })
          .catch(() => {
            setResult((prev) =>
              prev ? { ...prev, _storyLoading: false } : prev
            );
          });
      }
    } catch (err) {
      console.error("Failed to fetch name:", err);
      setError("Something went wrong. Please try again.");
      setStep("surname");
    }
  };

  const handleRetry = async () => {
    setError(null);
    await fetchName(englishName, selfWord, surname);
  };

  const handleReset = () => {
    setCategory(null);
    setEnglishName("");
    setSelfWord("");
    setSurname("");
    setBirthData(null);
    setResult(null);
    setError(null);
    goToStep("category");
  };

  const handleShare = () => {
    setShowShare(true);
  };

  // Step indicator
  const stepNumber =
    step === "category" ? 0 : step === "userinfo" ? 1 : step === "surname" ? 2 : 3;
  const stepLabels = ["Source", "About You", "Surname", "Your Name"];

  return (
    <main className="min-h-screen bg-[#F8FAFB] flex flex-col">
      {/* Header */}
      <header className="text-center pt-8 pb-4 px-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-xl font-light text-text-primary tracking-wide">
            Shan Shui
          </h1>
          {anonymousId && <CreditBadge anonymousId={anonymousId} refreshKey={creditRefresh} />}
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Your Chinese name, rooted in 3,000 years of poetry and legend
        </p>
      </header>

      {/* Step indicator */}
      {step !== "result" && (
        <div className="px-4 mb-6">
          <StepIndicator
            steps={stepLabels}
            current={stepNumber}
            onStepClick={(i) => {
              if (i === 0) handleReset();
              if (i === 1 && category) goToStep("userinfo");
              if (i === 2 && category) goToStep("surname");
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

      {/* Inline claim — shown when user returns from Gumroad with pending unlock */}
      {inlineClaimNameId && (
        <InlineClaim
          nameId={inlineClaimNameId}
          onSuccess={() => {
            setInlineClaimNameId("");
            // Force re-render to pick up unlocked name
            setUnlockedNames((prev) => {
              const next = new Set(prev);
              next.add(inlineClaimNameId);
              return new Set(next);
            });
          }}
          onClose={() => setInlineClaimNameId("")}
        />
      )}

      {/* Main content */}
      <div className="flex-1 px-4 pb-8">

        {/* Back button */}
        {(step === "userinfo" || step === "surname") && (
          <div className="max-w-sm mx-auto mb-3">
            <button
              onClick={() => {
                skipHistory.current = false; // let popstate handle it naturally
                history.back();
              }}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors py-2"
              aria-label="Go back to previous step"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {step === "userinfo" ? "Sources" : "About You"}
            </button>
          </div>
        )}

        {/* Step 1: Category selection */}
        {step === "category" && (
          <div>
            <SourceSelector
              selected={category}
              onSelect={handleCategorySelect}
            />
          </div>
        )}

        {/* Step 2: User info */}
        <BaziDisclaimer visible={step === "userinfo" && category === "elements"} />
        <UserInfo
          visible={step === "userinfo"}
          category={category}
          onSkip={handleUserInfoSkip}
          onSubmit={handleUserInfoSubmit}
        />

        {/* Step 3: Surname selection */}
        <SurnameSelector
          visible={step === "surname"}
          onSelect={handleSurnameSelect}
          onSkip={handleSurnameSkip}
        />

        {/* Loading */}
        {step === "loading" && <GeneratingLoader />}

        {/* Step 4: Result */}
        {step === "result" && result && (
          <NameResult
            name={result}
            onRetry={handleRetry}
            onReset={handleReset}
            onShare={handleShare}
            isUnlocked={isCurrentUnlocked}
            reportUrl={GUMROAD_PRODUCTS.report.url || undefined}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 px-4 border-t border-card-border">
        <p className="text-[11px] text-mist leading-relaxed mb-3">
          &#x2727; Each name is generated from classical Chinese texts and
          verified against historical sources &#x2727;
        </p>
        <nav className="flex justify-center gap-3 flex-wrap mb-3">
          <a href="/how-it-works" className="text-[11px] text-mist hover:text-text-secondary transition-colors">How It Works</a>
          <span className="text-mist/40 text-[11px]">&middot;</span>
          <a href="/about" className="text-[11px] text-mist hover:text-text-secondary transition-colors">About</a>
          <span className="text-mist/40 text-[11px]">&middot;</span>
          <a href="/contact" className="text-[11px] text-mist hover:text-text-secondary transition-colors">Contact</a>
          <span className="text-mist/40 text-[11px]">&middot;</span>
          <a href="/pricing" className="text-[11px] text-mist hover:text-text-secondary transition-colors">Pricing</a>
        </nav>
        <nav className="flex justify-center gap-3 flex-wrap">
          <a href="/privacy" className="text-[11px] text-mist hover:text-text-secondary transition-colors">Privacy</a>
          <span className="text-mist/40 text-[11px]">&middot;</span>
          <a href="/terms" className="text-[11px] text-mist hover:text-text-secondary transition-colors">Terms</a>
          <span className="text-mist/40 text-[11px]">&middot;</span>
          <a href="/disclaimer" className="text-[11px] text-mist hover:text-text-secondary transition-colors">Disclaimer</a>
        </nav>
        <p className="text-[10px] text-mist/60 mt-3">
          &copy; {new Date().getFullYear()} Shan Shui. All rights reserved.
        </p>
      </footer>

      {/* Share modal */}
      {showShare && result && (
        <ShareCard name={result} onClose={() => setShowShare(false)} />
      )}

      {/* Paywall modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onCreditRefresh={() => setCreditRefresh((k) => k + 1)}
      />

      {/* Checkout success handler */}
      {typeof window !== "undefined" && (
        <CheckoutHandler
          anonymousId={anonymousId}
          onCreditRefresh={() => setCreditRefresh((k) => k + 1)}
          captureStatus={captureStatus}
          onCaptureStatus={setCaptureStatus}
        />
      )}
    </main>
  );
}

/**
 * Handles PayPal checkout redirect.
 * When user returns from PayPal with ?checkout=success&token=ORDER_ID,
 * captures the order and credits the user.
 */
function CheckoutHandler({
  anonymousId,
  onCreditRefresh,
  captureStatus,
  onCaptureStatus,
}: {
  anonymousId: string;
  onCreditRefresh: () => void;
  captureStatus: string | null;
  onCaptureStatus: (s: string | null) => void;
  capturedEmail?: string;
}) {
  const [capturedEmail, setCapturedEmail] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const token = params.get("token"); // PayPal order ID

    if (checkout === "success" && token && anonymousId) {
      // Capture PayPal order
      onCaptureStatus("capturing");

      fetch("/api/capture-paypal-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: token, anonymousId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            onCaptureStatus("success");
            onCreditRefresh();
            if (data.email) setCapturedEmail(data.email);
          } else {
            onCaptureStatus("error");
            console.error("Capture failed:", data.error);
          }
        })
        .catch((err) => {
          console.error("Capture error:", err);
          onCaptureStatus("error");
        });

      // Clean URL
      window.history.replaceState({}, "", "/");
    } else if (checkout === "cancelled") {
      window.history.replaceState({}, "", "/");
    }
  }, [anonymousId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss status after 5 seconds
  useEffect(() => {
    if (captureStatus && captureStatus !== "capturing") {
      const t = setTimeout(() => onCaptureStatus(null), 5000);
      return () => clearTimeout(t);
    }
  }, [captureStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!captureStatus) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${
          captureStatus === "capturing"
            ? "bg-surface border border-card-border text-text-secondary"
            : captureStatus === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}
      >
        {captureStatus === "capturing" && "Confirming payment..."}
        {captureStatus === "success" && (
          <>
            {"\u2714 Payment received — credits added!"}
            {capturedEmail && (
              <span className="block text-[11px] opacity-75 mt-0.5">
                Linked to {capturedEmail}
              </span>
            )}
          </>
        )}
        {captureStatus === "error" && "Payment captured but credits may be delayed. Contact us if needed."}
      </div>
    </div>
  );
}
