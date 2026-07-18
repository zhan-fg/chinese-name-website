"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { NameEntry } from "@/lib/types";

interface Props {
  nameId: string;
  nameData?: Partial<NameEntry>;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Inline claim modal. Appears when user returns from Gumroad.
 *
 * Polls /api/claim-status to check if Gumroad Ping has verified the payment.
 * When verified, auto-claims without asking for email.
 * If polling times out, falls back to manual email input.
 *
 * Uses sessionStorage for claim tokens so different tabs don't interfere.
 */
export default function InlineClaim({ nameId, nameData, onSuccess, onClose }: Props) {
  const [phase, setPhase] = useState<"polling" | "manual" | "claiming" | "done">("polling");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const pollCount = useRef(0);
  const maxPolls = 30; // 30 × 2s = 60s timeout

  // Extract display name
  const displayName = nameId.includes("-")
    ? nameId.slice(0, nameId.lastIndexOf("-"))
    : nameId;

  const clearPendingState = () => {
    try {
      localStorage.removeItem("shan-pending-unlock");
      localStorage.removeItem("shan-claim-token");
      sessionStorage.removeItem("shan-claim-token");
    } catch {}
  };

  const handleClose = () => {
    clearPendingState();
    onClose();
  };

  // Poll for Gumroad Ping verification
  useEffect(() => {
    if (phase !== "polling") return;

    const token = getToken();
    if (!token) {
      setPhase("manual");
      return;
    }

    const poll = async () => {
      pollCount.current++;
      try {
        const res = await fetch(`/api/claim-status?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (data.status === "verified") {
          setEmail(data.email || "");
          setPhase("claiming");
          doClaim(data.email || "", token);
        } else if (data.status === "claimed") {
          onSuccess();
          setPhase("done");
        } else if (data.status === "not_found" || pollCount.current >= maxPolls) {
          setPhase("manual");
          clearPendingState();
        }
      } catch {
        if (pollCount.current >= maxPolls) {
          setPhase("manual");
          clearPendingState();
        }
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [phase, nameId, onSuccess]);

  const doClaim = async (userEmail: string, token: string) => {
    try {
      const res = await fetch("/api/claim-gumroad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          productType: "report",
          nameId,
          token,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        try {
          const stored = localStorage.getItem("shan-unlocked");
          const unlocked = stored ? JSON.parse(stored) : [];
          if (!unlocked.includes(nameId)) {
            unlocked.push(nameId);
            localStorage.setItem("shan-unlocked", JSON.stringify(unlocked));
          }
          localStorage.removeItem("shan-pending-unlock");
          localStorage.removeItem("shan-claim-token");
          sessionStorage.removeItem("shan-claim-token");
        } catch {}

        if (nameData && userEmail) {
          fetch("/api/save-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: userEmail,
              nameId,
              nameData,
            }),
          }).catch(() => {});
        }

        setPhase("done");
        setTimeout(onSuccess, 500);
      } else {
        setError(data.error || "Claim failed. Please try again.");
        setPhase("manual");
      }
    } catch {
      setError("Network error. Please try again.");
      setPhase("manual");
    }
  };

  const handleManualClaim = async () => {
    if (!email.trim()) return;
    const token = getToken();
    setPhase("claiming");
    await doClaim(email.trim(), token);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl p-6 max-w-sm w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

          {phase === "polling" && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-2 border-deep-blue border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                Verifying your payment...
              </p>
              <p className="text-xs text-mist mt-1">
                This usually takes a few seconds
              </p>
            </div>
          )}

          {(phase === "manual" || phase === "claiming") && (
            <>
              <div className="text-center mb-5">
                <p className="text-sm text-text-secondary mb-1">
                  Unlock report for
                </p>
                <p className="text-xl font-light text-text-primary">
                  {displayName}
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-600 text-center mb-3 p-2 bg-red-50 rounded-lg">{error}</p>
              )}

              <p className="text-xs text-text-secondary text-center mb-3">
                Enter the email you used on Gumroad
              </p>

              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualClaim()}
                  placeholder="you@email.com"
                  autoFocus
                  disabled={phase === "claiming"}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-card-border text-sm focus:outline-none focus:border-deep-blue disabled:opacity-50"
                />
                <button
                  onClick={handleManualClaim}
                  disabled={phase === "claiming" || !email.trim()}
                  className="px-6 py-2.5 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors disabled:opacity-50"
                >
                  {phase === "claiming" ? "..." : "Unlock"}
                </button>
              </div>
            </>
          )}

          {phase !== "polling" && (
            <button
              onClick={handleClose}
              className="w-full py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Not now
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function getToken(): string {
  try {
    return sessionStorage.getItem("shan-claim-token") || "";
  } catch {
    return "";
  }
}
