"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (consent === null) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
    // If GA is loaded, disable it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (w.gtag) {
      w["ga-disable-" + (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "")] = true;
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-sm mx-auto card p-4 shadow-lg border-deep-blue/10">
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              We use cookies for analytics and to improve your experience. By
              continuing, you agree to our{" "}
              <a
                href="/privacy"
                className="text-deep-blue hover:underline"
              >
                Privacy Policy
              </a>
              .
            </p>
            <div className="flex gap-2">
              <button
                onClick={accept}
                className="flex-1 py-2 rounded-lg bg-deep-blue text-white text-xs font-medium hover:bg-mid-blue transition-colors"
              >
                Accept
              </button>
              <button
                onClick={decline}
                className="flex-1 py-2 rounded-lg border border-card-border text-text-secondary text-xs hover:bg-gray-50 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
