"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GUMROAD_PRODUCTS } from "@/lib/gumroad";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreditRefresh?: () => void;
}

export default function PaywallModal({
  visible,
  onClose,
  onCreditRefresh,
}: Props) {
  // Email recovery
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState<string | null>(null);

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
          anonymousId:
            typeof window !== "undefined"
              ? localStorage.getItem("shan-anon-id") || ""
              : "",
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
                Love this name?
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                You found your Chinese name. Unlock its full story — the
                classical poem, character breakdown, and cultural meaning.
              </p>
            </div>

            {/* Report CTA */}
            <div className="mb-4">
              <a
                href={`${GUMROAD_PRODUCTS.report.url}?url=${encodeURIComponent("https://newchinesename.com/thank-you")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-3.5 rounded-xl border-2 border-deep-blue bg-[#EEF4F8] text-left transition-all hover:bg-deep-blue/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Chinese Identity Report
                      <span className="ml-1.5 text-[10px] text-deep-blue font-normal">
                        PER NAME
                      </span>
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Full story, source poem, character breakdown, share card
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-text-primary">
                      $4.99
                    </p>
                  </div>
                </div>
              </a>
            </div>

            {/* Premium */}
            <div className="mb-4">
              <a
                href={`${GUMROAD_PRODUCTS.credit_15.url}?url=${encodeURIComponent("https://newchinesename.com/thank-you")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-3.5 rounded-xl border-2 border-card-border bg-surface hover:border-deep-blue/30 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Premium — 20 Reports
                      <span className="ml-1.5 text-[10px] text-deep-blue font-normal">
                        BEST VALUE
                      </span>
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      5 styles: Poet, Scholar, Warrior, Modern, Ancient
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-text-primary">
                      $9.99
                    </p>
                  </div>
                </div>
              </a>
            </div>

            {/* Trust */}
            <p className="text-[10px] text-mist text-center mb-3">
              Secured by Gumroad &middot;{" "}
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
