     1|"use client";
     2|
     3|import { useState, useRef, useEffect, useCallback } from "react";
     4|import { SourceCategory, NameEntry } from "@/lib/types";
     5|import SourceSelector from "@/components/SourceSelector";
     6|import UserInfo from "@/components/UserInfo";
     7|import SurnameSelector from "@/components/SurnameSelector";
     8|import GeneratingLoader from "@/components/GeneratingLoader";
     9|import NameResult from "@/components/NameResult";
    10|import ShareCard from "@/components/ShareCard";
    11|import StepIndicator from "@/components/StepIndicator";
    12|import BaziDisclaimer from "@/components/BaziDisclaimer";
    13|import CreditBadge from "@/components/CreditBadge";
    14|import PaywallModal from "@/components/PaywallModal";
    15|import InlineClaim from "@/components/InlineClaim";
    16|import { GUMROAD_PRODUCTS } from "@/lib/gumroad";
    17|
    18|type Step = "category" | "userinfo" | "surname" | "loading" | "result";
    19|
    20|// Steps that map to history entries (loading is skipped)
    21|const STEP_TO_HASH: Record<Step, number> = {
    22|  category: 0,
    23|  userinfo: 1,
    24|  surname: 2,
    25|  loading: -1,
    26|  result: 3,
    27|};
    28|const HASH_TO_STEP: Record<number, Step> = {
    29|  0: "category",
    30|  1: "userinfo",
    31|  2: "surname",
    32|  3: "result",
    33|};
    34|
    35|export default function Home() {
    36|  const [step, setStep] = useState<Step>("category");
    37|  const [category, setCategory] = useState<SourceCategory | null>(null);
    38|  const [englishName, setEnglishName] = useState("");
    39|  const [selfWord, setSelfWord] = useState("");
    40|  const [surname, setSurname] = useState("");
    41|  const [birthData, setBirthData] = useState<{
    42|    year: number; month: number; day: number; hour: number; minute: number; location: string;
    43|  } | null>(null);
    44|  const [result, setResult] = useState<NameEntry | null>(null);
    45|  const [showShare, setShowShare] = useState(false);
    46|  const [error, setError] = useState<string | null>(null);
    47|  const [showPaywall, setShowPaywall] = useState(false);
    48|  const [creditRefresh, setCreditRefresh] = useState(0);
    49|  const [captureStatus, setCaptureStatus] = useState<string | null>(null);
    50|  const [gender, setGender] = useState<"male" | "female" | "neutral">("neutral");
    51|
    52|  // Track generated fullChars for dedup
    53|  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
    54|
    55|  // Track unlocked name IDs (paid reports)
    56|  const [unlockedNames, setUnlockedNames] = useState<Set<string>>(new Set());
    57|
    58|  // Ref to avoid stale closure in event handlers
    59|  const unlockedNamesRef = useRef(unlockedNames);
    60|  unlockedNamesRef.current = unlockedNames;
    61|
    62|  // Inline claim: nameId to unlock (shown when user returns from Gumroad)
    63|  const [inlineClaimNameId, setInlineClaimNameId] = useState("");
    64|
    65|  // Load unlocked names from localStorage on mount
    66|  useEffect(() => {
    67|    try {
    68|      const stored = localStorage.getItem("shan-unlocked");
    69|      if (stored) {
    70|        const names: string[] = JSON.parse(stored);
    71|        setUnlockedNames(new Set(names));
    72|      }
    73|    } catch {}
    74|
    75|    // Listen for cross-tab changes (e.g. /thank-you page updates shan-unlocked)
    76|    const handleStorage = (e: StorageEvent) => {
    77|      if (e.key === "shan-unlocked" && e.newValue) {
    78|        try {
    79|          const names: string[] = JSON.parse(e.newValue);
    80|          setUnlockedNames(new Set(names));
    81|        } catch {}
    82|      }
    83|    };
    84|    window.addEventListener("storage", handleStorage);
    85|    return () => window.removeEventListener("storage", handleStorage);
    86|  }, []);
    87|
    88|  // When user returns to this tab (after Gumroad payment), re-check localStorage
    89|  useEffect(() => {
    90|    const handleFocus = () => {
    91|      try {
    92|        // Check if there's a pending unlock (user bought on Gumroad but hasn't claimed yet)
    93|        const pending = localStorage.getItem("shan-pending-unlock");
    94|        if (pending && !unlockedNamesRef.current.has(pending)) {
    95|          setInlineClaimNameId(pending);
    96|        }
    97|
    98|        // Re-read unlocked names (might have been updated by /thank-you tab)
    99|        const stored = localStorage.getItem("shan-unlocked");
   100|        if (stored) {
   101|          const names: string[] = JSON.parse(stored);
   102|          setUnlockedNames((prev) => {
   103|            const next = new Set(prev);
   104|            let added = false;
   105|            for (const n of names) {
   106|              if (!next.has(n)) { next.add(n); added = true; }
   107|            }
   108|            return added ? new Set(next) : prev;
   109|          });
   110|        }
   111|      } catch {}
   112|    };
   113|    window.addEventListener("focus", handleFocus);
   114|    window.addEventListener("visibilitychange", () => {
   115|      if (document.visibilityState === "visible") handleFocus();
   116|    });
   117|    return () => {
   118|      window.removeEventListener("focus", handleFocus);
   119|      window.removeEventListener("visibilitychange", handleFocus);
   120|    };
   121|  }, []);
   122|
   123|  // Check if current name is unlocked (paid report)
   124|  const currentNameId = result ? `${result.fullChars}-${result.sourceCategory}` : "";
   125|  const isCurrentUnlocked = unlockedNames.has(currentNameId);
   126|
   127|  // Anonymous user ID — persisted in localStorage for credit tracking
   128|  const [anonymousId, setAnonymousId] = useState("");
   129|  useEffect(() => {
   130|    let id = localStorage.getItem("shan-anon-id");
   131|    if (!id) {
   132|      id = "anon_" + crypto.randomUUID();
   133|      localStorage.setItem("shan-anon-id", id);
   134|    }
   135|    setAnonymousId(id);
   136|  }, []);
   137|
   138|  // Detect ?buy=credit_5 etc. from pricing page → show PaywallModal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const buy = params.get("buy");
    if (buy && anonymousId) {
      setShowPaywall(true);
      window.history.replaceState({}, "", "/");
    }
    // Restore a saved report (from /my-names page)
    const viewParam = params.get("view");
    if (viewParam === "report") {
      try {
        const saved = sessionStorage.getItem("shan-view-report");
        if (saved) {
          const reportData = JSON.parse(saved);
          setResult(reportData);
          setStep("result");
          // Mark as unlocked
          const nameId = `${reportData.fullChars}-${reportData.sourceCategory}`;
          setUnlockedNames((prev) => new Set([...prev, nameId]));
          sessionStorage.removeItem("shan-view-report");
          window.history.replaceState({}, "", "/");
        }
      } catch {}
    }
  }, [anonymousId]);
   148|
   149|  // Prevent pushing history during popstate handling
   150|  const skipHistory = useRef(false);
   151|
   152|  // Navigate to a step AND push browser history
   153|  const goToStep = useCallback(
   154|    (newStep: Step) => {
   155|      setStep(newStep);
   156|      if (!skipHistory.current) {
   157|        const idx = STEP_TO_HASH[newStep];
   158|        if (idx >= 0) {
   159|          // Use replaceState if going backward, pushState if going forward
   160|          // Simple heuristic: category=0 always replaces, others push
   161|          if (idx === 0) {
   162|            history.replaceState({ step: idx }, "", "#");
   163|          } else {
   164|            history.pushState({ step: idx }, "", `#step=${idx}`);
   165|          }
   166|        }
   167|      }
   168|      skipHistory.current = false;
   169|    },
   170|    []
   171|  );
   172|
   173|  // Listen for browser back/forward buttons
   174|  useEffect(() => {
   175|    const handlePopState = (e: PopStateEvent) => {
   176|      skipHistory.current = true;
   177|      if (e.state && typeof e.state.step === "number") {
   178|        const restored = HASH_TO_STEP[e.state.step];
   179|        if (restored) {
   180|          // If going back to a step before result, clear the result
   181|          if (restored !== "result") setResult(null);
   182|          setStep(restored);
   183|        }
   184|      } else {
   185|        // No state = back to initial page = category
   186|        setResult(null);
   187|        setError(null);
   188|        setStep("category");
   189|      }
   190|    };
   191|
   192|    // On initial load, check if there's a hash (for refresh support)
   193|    if (typeof window !== "undefined") {
   194|      const hash = window.location.hash;
   195|      const match = hash.match(/step=(\d)/);
   196|      if (match && history.state?.step === undefined) {
   197|        const idx = parseInt(match[1]);
   198|        const restored = HASH_TO_STEP[idx];
   199|        if (restored) {
   200|          skipHistory.current = true;
   201|          setStep(restored);
   202|        }
   203|      }
   204|    }
   205|
   206|    window.addEventListener("popstate", handlePopState);
   207|    return () => window.removeEventListener("popstate", handlePopState);
   208|  }, []);
   209|
   210|  const handleCategorySelect = (cat: SourceCategory) => {
   211|    setCategory(cat);
   212|    goToStep("userinfo");
   213|  };
   214|
   215|  const handleUserInfoSubmit = (
   216|    name: string,
   217|    word: string,
   218|    gender?: "male" | "female" | "neutral",
   219|    birth?: { year: number; month: number; day: number; hour: number; minute: number; location: string }
   220|  ) => {
   221|    setEnglishName(name);
   222|    setSelfWord(word);
   223|    setGender(gender || "neutral");
   224|    if (birth) setBirthData(birth);
   225|    goToStep("surname");
   226|  };
   227|
   228|  const handleUserInfoSkip = () => {
   229|    setEnglishName("");
   230|    setSelfWord("");
   231|    setBirthData(null);
   232|    goToStep("surname");
   233|  };
   234|
   235|  const handleSurnameSelect = (s: string) => {
   236|    setSurname(s);
   237|    setError(null);
   238|    fetchName(englishName, selfWord, s);
   239|  };
   240|
   241|  const handleSurnameSkip = () => {
   242|    setSurname("");
   243|    setError(null);
   244|    fetchName(englishName, selfWord, "");
   245|  };
   246|
   247|  const fetchName = async (name: string, word: string, s: string) => {
   248|    // Wait for anonymousId to be ready
   249|    const anonId = anonymousId || localStorage.getItem("shan-anon-id");
   250|    
   251|    // Check credits before generating
   252|    if (anonId) {
   253|      try {
   254|        const checkRes = await fetch(
   255|          `/api/check-credits?anonymousId=${encodeURIComponent(anonId)}`
   256|        );
   257|        const credits = await checkRes.json();
   258|
   259|        // Only enforce limit if we got valid credit data
   260|        if (!credits.error && credits.totalRemaining !== undefined) {
   261|          if (credits.freeRemaining <= 0 && credits.creditsRemaining <= 0) {
   262|            setShowPaywall(true);
   263|            return;
   264|          }
   265|        }
   266|      } catch {
   267|        // If credit check fails, allow generation (fail open)
   268|      }
   269|    }
   270|
   271|    setStep("loading");
   272|    skipHistory.current = false; // loading step doesn't push history
   273|    try {
   274|      const res = await fetch("/api/generate-name", {
   275|        method: "POST",
   276|        headers: { "Content-Type": "application/json" },
   277|        body: JSON.stringify({
   278|          sourceCategory: category,
   279|          englishName: name || undefined,
   280|          selfWord: word || undefined,
   281|          surname: s || undefined,
   282|          gender: gender !== "neutral" ? gender : undefined,
   283|          birthYear: birthData?.year,
   284|          birthMonth: birthData?.month,
   285|          birthDay: birthData?.day,
   286|          birthHour: birthData?.hour,
   287|          birthMinute: birthData?.minute,
   288|          birthLocation: birthData?.location || undefined,
   289|          anonymousId: anonId || undefined,
   290|          excludeNames: generatedNames,
   291|        }),
   292|      });
   293|
   294|      if (!res.ok) {
   295|        throw new Error(`Server error: ${res.status}`);
   296|      }
   297|
   298|      const data = await res.json();
   299|      setResult(data);
   300|      goToStep("result");
   301|
   302|      // Track for dedup
   303|      if (data.fullChars) {
   304|        setGeneratedNames((prev) => [...prev, data.fullChars]);
   305|      }
   306|
   307|      // Refresh credit badge after generation
   308|      setCreditRefresh((k) => k + 1);
   309|
   310|      // Phase 2: Load story asynchronously
   311|      if (data._storyLoading !== false) {
   312|        fetch("/api/generate-story", {
   313|          method: "POST",
   314|          headers: { "Content-Type": "application/json" },
   315|          body: JSON.stringify({
   316|            nameData: data,
   317|            sourceCategory: category,
   318|            englishName: name || undefined,
   319|            selfWord: word || undefined,
   320|            surname: s || undefined,
   321|          }),
   322|        })
   323|          .then((sRes) => sRes.json())
   324|          .then((story) => {
   325|            setResult((prev) =>
   326|              prev ? { ...prev, ...story, _storyLoading: false } : prev
   327|            );
   328|            // Phase 3: Load personality analysis
   329|            setResult((prev) =>
   330|              prev ? { ...prev, _personalityLoading: true } : prev
   331|            );
   332|            fetch("/api/generate-personality", {
   333|              method: "POST",
   334|              headers: { "Content-Type": "application/json" },
   335|              body: JSON.stringify({
   336|                nameData: { ...data, ...story },
   337|                sourceCategory: category,
   338|                englishName: name || undefined,
   339|                selfWord: word || undefined,
   340|              }),
   341|            })
   342|              .then((pRes) => pRes.json())
   343|              .then((personality) => {
   344|                setResult((prev) =>
   345|                  prev ? { ...prev, ...personality, _personalityLoading: false } : prev
   346|                );
   347|              })
   348|              .catch(() => {
   349|                setResult((prev) =>
   350|                  prev ? { ...prev, _personalityLoading: false } : prev
   351|                );
   352|              });
   353|          })
   354|          .catch(() => {
   355|            setResult((prev) =>
   356|              prev ? { ...prev, _storyLoading: false } : prev
   357|            );
   358|          });
   359|      }
   360|    } catch (err) {
   361|      console.error("Failed to fetch name:", err);
   362|      setError("Something went wrong. Please try again.");
   363|      setStep("surname");
   364|    }
   365|  };
   366|
   367|  const handleRetry = async () => {
   368|    setError(null);
   369|    await fetchName(englishName, selfWord, surname);
   370|  };
   371|
   372|  const handleReset = () => {
   373|    setCategory(null);
   374|    setEnglishName("");
   375|    setSelfWord("");
   376|    setSurname("");
   377|    setBirthData(null);
   378|    setResult(null);
   379|    setError(null);
   380|    goToStep("category");
   381|  };
   382|
   383|  const handleShare = () => {
   384|    setShowShare(true);
   385|  };
   386|
   387|  // Step indicator
   388|  const stepNumber =
   389|    step === "category" ? 0 : step === "userinfo" ? 1 : step === "surname" ? 2 : 3;
   390|  const stepLabels = ["Source", "About You", "Surname", "Your Name"];
   391|
   392|  return (
   393|    <main className="min-h-screen bg-[#F8FAFB] flex flex-col">
   394|      {/* Header */}
   395|      <header className="text-center pt-8 pb-4 px-4">
   396|        <div className="flex items-center justify-center gap-3 mb-2">
   397|          <h1 className="text-xl font-light text-text-primary tracking-wide">
   398|            Shan Shui
   399|          </h1>
   400|          {anonymousId && <CreditBadge anonymousId={anonymousId} refreshKey={creditRefresh} />}
   401|        </div>
   402|        <p className="text-xs text-text-secondary mt-1">
   403|          Your Chinese name, rooted in 3,000 years of poetry and legend
   404|        </p>
   405|      </header>
   406|
   407|      {/* Step indicator */}
   408|      {step !== "result" && (
   409|        <div className="px-4 mb-6">
   410|          <StepIndicator
   411|            steps={stepLabels}
   412|            current={stepNumber}
   413|            onStepClick={(i) => {
   414|              if (i === 0) handleReset();
   415|              if (i === 1 && category) goToStep("userinfo");
   416|              if (i === 2 && category) goToStep("surname");
   417|            }}
   418|          />
   419|        </div>
   420|      )}
   421|
   422|      {/* Error banner */}
   423|      {error && (
   424|        <div className="px-4 mb-4">
   425|          <div className="max-w-sm mx-auto p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center">
   426|            {error}
   427|          </div>
   428|        </div>
   429|      )}
   430|
   431|      {/* Inline claim — shown when user returns from Gumroad with pending unlock */}
   432|      {inlineClaimNameId && (
   433|        <InlineClaim
   434|          nameId={inlineClaimNameId}
   435|          nameData={result || undefined}
   436|          onSuccess={() => {
   437|            setInlineClaimNameId("");
   438|            // Force re-render to pick up unlocked name
   439|            setUnlockedNames((prev) => {
   440|              const next = new Set(prev);
   441|              next.add(inlineClaimNameId);
   442|              return new Set(next);
   443|            });
   444|          }}
   445|          onClose={() => setInlineClaimNameId("")}
   446|        />
   447|      )}
   448|
   449|      {/* Main content */}
   450|      <div className="flex-1 px-4 pb-8">
   451|
   452|        {/* Back button */}
   453|        {(step === "userinfo" || step === "surname") && (
   454|          <div className="max-w-sm mx-auto mb-3">
   455|            <button
   456|              onClick={() => {
   457|                skipHistory.current = false; // let popstate handle it naturally
   458|                history.back();
   459|              }}
   460|              className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors py-2"
   461|              aria-label="Go back to previous step"
   462|            >
   463|              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
   464|                <polyline points="15 18 9 12 15 6" />
   465|              </svg>
   466|              {step === "userinfo" ? "Sources" : "About You"}
   467|            </button>
   468|          </div>
   469|        )}
   470|
   471|        {/* Step 1: Category selection */}
   472|        {step === "category" && (
   473|          <div>
   474|            <SourceSelector
   475|              selected={category}
   476|              onSelect={handleCategorySelect}
   477|            />
   478|          </div>
   479|        )}
   480|
   481|        {/* Step 2: User info */}
   482|        <BaziDisclaimer visible={step === "userinfo" && category === "elements"} />
   483|        <UserInfo
   484|          visible={step === "userinfo"}
   485|          category={category}
   486|          onSkip={handleUserInfoSkip}
   487|          onSubmit={handleUserInfoSubmit}
   488|        />
   489|
   490|        {/* Step 3: Surname selection */}
   491|        <SurnameSelector
   492|          visible={step === "surname"}
   493|          onSelect={handleSurnameSelect}
   494|          onSkip={handleSurnameSkip}
   495|        />
   496|
   497|        {/* Loading */}
   498|        {step === "loading" && <GeneratingLoader />}
   499|
   500|        {/* Step 4: Result */}
   501|