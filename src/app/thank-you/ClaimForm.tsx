"use client";

import { useState, useEffect } from "react";

export function ClaimForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    action?: "view-report" | "generate";
  } | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  // Read product info from URL params and localStorage
  const [nameId, setNameId] = useState("");
  const [productType, setProductType] = useState("credits");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlName = params.get("name");
    if (urlName) {
      setNameId(urlName);
      setProductType("report");
    } else {
      // Read pending unlock from localStorage (set by BlurOverlay before Gumroad redirect)
      try {
        const pending = localStorage.getItem("shan-pending-unlock");
        if (pending) {
          setNameId(pending);
          setProductType("report");
          // Keep the pending item until claim succeeds
        }
      } catch {}
    }
  }, []);

  const handleClaim = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const body: Record<string, string> = { email: email.trim() };
      if (nameId) body.nameId = nameId;
      if (productType) body.productType = productType;

      const res = await fetch("/api/claim-gumroad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Clean up pending unlock
        if (nameId && productType === "report") {
          try {
            localStorage.removeItem("shan-pending-unlock");
          } catch {}
        }

        // Save unlocked names to localStorage
        if (nameId && productType === "report") {
          try {
            const stored = localStorage.getItem("shan-unlocked");
            const unlocked = stored ? JSON.parse(stored) : [];
            if (!unlocked.includes(nameId)) {
              unlocked.push(nameId);
              localStorage.setItem("shan-unlocked", JSON.stringify(unlocked));
            }
          } catch {}
        }

        setResult({
          type: "success",
          message: data.isSubscription
            ? "Your Report is unlocked!"
            : data.isUnlock
            ? "Your Chinese Identity Report is unlocked!"
            : `${data.credits || ""} credits added!`,
          action: data.isUnlock ? "view-report" : "generate",
        });

        // Auto-redirect to main page after 3 seconds
        setRedirectCountdown(3);
        const timer = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              window.location.href = "/";
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setResult({
          type: "error",
          message: data.error || "Something went wrong. Please try again.",
        });
      }
    } catch {
      setResult({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleClaim()}
          placeholder="you@email.com"
          className="flex-1 px-4 py-2.5 rounded-lg border border-card-border text-sm focus:outline-none focus:border-deep-blue"
        />
        <button
          onClick={handleClaim}
          disabled={loading || !email.trim()}
          className="px-6 py-2.5 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Claim"}
        </button>
      </div>

      {result && (
        <div
          className={`text-sm mt-3 p-3 rounded-lg ${
            result.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={
              result.type === "success" ? "text-green-700" : "text-red-600"
            }
          >
            {result.type === "success" ? "✓ " : "✗ "}
            {result.message}
          </p>
          {result.type === "success" && result.action && (
            <div className="mt-3">
              <p className="text-xs text-green-600 mb-2">
                {redirectCountdown > 0
                  ? `Redirecting to your ${result.action === "view-report" ? "report" : "names"} in ${redirectCountdown}...`
                  : "Go back to the main page to see your content."}
              </p>
              <a
                href="/"
                className="inline-block px-4 py-2 rounded-lg bg-deep-blue text-white text-xs font-medium hover:bg-mid-blue transition-colors"
              >
                {result.action === "view-report"
                  ? "View My Report →"
                  : "Generate Names →"}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
