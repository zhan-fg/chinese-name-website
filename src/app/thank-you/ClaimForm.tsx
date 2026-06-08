"use client";

import { useState, useEffect } from "react";

export function ClaimForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Read product info from URL params (passed by Gumroad redirect)
  const [nameId, setNameId] = useState("");
  const [productType, setProductType] = useState("credits");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNameId(params.get("name") || "");
    setProductType(params.get("type") || "credits");
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
            ? "Your Report is unlocked! Go see your full Chinese identity →"
            : data.isUnlock
            ? "Your Chinese Identity Report is unlocked!"
            : `${data.credits || ""} credits added! Go generate names →`,
        });
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
        <p
          className={`text-sm mt-3 ${
            result.type === "success" ? "text-green-700" : "text-red-600"
          }`}
        >
          {result.type === "success" ? "✓ " : "✗ "}
          {result.message}
        </p>
      )}
    </div>
  );
}
