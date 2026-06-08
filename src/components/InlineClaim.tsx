"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  nameId: string;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Inline email claim form. Appears on the main page when the user
 * returns from Gumroad with a pending unlock in localStorage.
 * Calls /api/claim-gumroad directly — no page navigation needed.
 */
export default function InlineClaim({ nameId, onSuccess, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Extract display name from nameId (e.g. "思远-poetry" → "思远")
  const displayName = nameId.includes("-")
    ? nameId.slice(0, nameId.lastIndexOf("-"))
    : nameId;

  const handleClaim = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/claim-gumroad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          productType: "report",
          nameId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update localStorage
        try {
          const stored = localStorage.getItem("shan-unlocked");
          const unlocked = stored ? JSON.parse(stored) : [];
          if (!unlocked.includes(nameId)) {
            unlocked.push(nameId);
            localStorage.setItem("shan-unlocked", JSON.stringify(unlocked));
          }
          localStorage.removeItem("shan-pending-unlock");
        } catch {}

        onSuccess();
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
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
          className="bg-white rounded-t-2xl sm:rounded-2xl p-6 max-w-sm w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

          <div className="text-center mb-5">
            <p className="text-sm text-text-secondary mb-1">
              You bought the report for
            </p>
            <p className="text-xl font-light text-text-primary">
              {displayName}
            </p>
          </div>

          <p className="text-xs text-text-secondary text-center mb-3">
            Enter your Gumroad email to unlock it instantly.
          </p>

          <div className="flex gap-2 mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleClaim()}
              placeholder="you@email.com"
              autoFocus
              className="flex-1 px-4 py-2.5 rounded-lg border border-card-border text-sm focus:outline-none focus:border-deep-blue"
            />
            <button
              onClick={handleClaim}
              disabled={loading || !email.trim()}
              className="px-6 py-2.5 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "Unlock"}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center mb-2">{error}</p>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Not now
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
