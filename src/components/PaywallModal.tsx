"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PRICING_PLANS, type PricingPlanId } from "@/lib/paypal";

interface Props {
  visible: boolean;
  anonymousId: string;
  onClose: () => void;
  onCreditRefresh?: () => void;
}

export default function PaywallModal({
  visible,
  anonymousId,
  onClose,
  onCreditRefresh,
}: Props) {
  const [loading, setLoading] = useState<PricingPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Email recovery
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState<string | null>(null);

  const handlePurchase = async (planId: PricingPlanId) => {
    setLoading(planId);
    setError(null);

    // Fallback: read from localStorage if prop is empty
    const anonId = anonymousId || (typeof window !== "undefined" ? localStorage.getItem("shan-anon-id") : null);
    if (!anonId) {
      setError("Session not ready. Please refresh the page and try again.");
      setLoading(null);
      return;
    }

    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, anonymousId: anonId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Payment setup failed: ${msg}`);
      setLoading(null);
    }
  };

  const handleRecover = async () => {
    if (!recoveryEmail.trim()) return;
    setRecoveryLoading(true);
    setRecoveryMsg(null);

    try {
      const res = await fetch("/api/recover-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recoveryEmail.trim(),
          anonymousId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setRecoveryMsg(
          `Found ${data.creditsRemaining || 0} credits + ${data.freeRemaining || 0} free uses! ${
            data.isSubscriber ? "(Unlimited)" : ""
          }`
        );
        onCreditRefresh?.();
        setTimeout(() => {
          onClose();
          setRecoveryMsg(null);
          setShowRecovery(false);
        }, 2000);
      } else {
        setRecoveryMsg("No credits found for that email.");
      }
    } catch {
      setRecoveryMsg("Recovery failed. Please try again.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-2xl sm:rounded-2xl p-6 max-w-sm w-full shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="text-center mb-5">
              <h2 className="text-lg font-light text-text-primary mb-1">
                Your free names are used up
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                You&apos;ve generated your 3 free names. Choose a plan to
                continue discovering your perfect Chinese name.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center">
                {error}
              </div>
            )}

            {/* Plans */}
            <div className="space-y-2.5 mb-4">
              {Object.entries(PRICING_PLANS).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => handlePurchase(key as PricingPlanId)}
                  disabled={loading !== null}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all ${
                    "featured" in plan && plan.featured
                      ? "border-deep-blue bg-[#EEF4F8]"
                      : "border-card-border bg-surface hover:border-deep-blue/30"
                  } disabled:opacity-60`}
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {plan.name}
                      {"featured" in plan && plan.featured && (
                        <span className="ml-1.5 text-[10px] text-deep-blue font-normal">
                          BEST VALUE
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-text-primary">
                      ${(plan.amount / 100).toFixed(2)}
                    </p>
                    {plan.id === "subscription" && (
                      <p className="text-[10px] text-text-secondary">30 days</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Trust */}
            <p className="text-[10px] text-mist text-center mb-3">
              Secured by PayPal &middot;{" "}
              <a
                href="/refund"
                target="_blank"
                className="underline hover:text-text-secondary"
              >
                7-day refund policy
              </a>
            </p>

            {/* Email recovery section */}
            {!showRecovery ? (
              <button
                onClick={() => setShowRecovery(true)}
                className="w-full py-2 text-xs text-deep-blue hover:text-mid-blue transition-colors mb-1"
              >
                Already purchased? Recover your credits &rarr;
              </button>
            ) : (
              <div className="mb-3 p-3 rounded-xl bg-[#EEF4F8] border border-deep-blue/20">
                <p className="text-xs text-text-secondary mb-2">
                  Enter the email you used with PayPal to recover your credits.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRecover()}
                    placeholder="your@email.com"
                    className="flex-1 px-3 py-2 rounded-lg border border-card-border text-sm focus:outline-none focus:border-deep-blue"
                  />
                  <button
                    onClick={handleRecover}
                    disabled={recoveryLoading || !recoveryEmail.trim()}
                    className="px-4 py-2 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors disabled:opacity-50"
                  >
                    {recoveryLoading ? "..." : "Find"}
                  </button>
                </div>
                {recoveryMsg && (
                  <p
                    className={`text-xs mt-2 ${
                      recoveryMsg.includes("Found")
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {recoveryMsg}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
