"use client";

import { useState, useEffect } from "react";

/**
 * Reads shan-pending-unlock from localStorage and displays the name
 * the user is about to unlock. Shows nothing if no pending unlock.
 */
export function PendingName() {
  const [nameId, setNameId] = useState("");

  useEffect(() => {
    try {
      const pending = localStorage.getItem("shan-pending-unlock");
      if (pending) {
        // nameId format: "思远-poetry" → extract display parts
        const dashIdx = pending.lastIndexOf("-");
        if (dashIdx > 0) {
          const chars = pending.slice(0, dashIdx);
          const category = pending.slice(dashIdx + 1);
          setNameId(`${chars} (${category})`);
        } else {
          setNameId(pending);
        }
      }
    } catch {}
  }, []);

  if (!nameId) return null;

  return (
    <div className="mb-4 p-3 rounded-lg bg-[#EEF4F8] border border-deep-blue/20 text-center">
      <p className="text-xs text-text-secondary">You are unlocking:</p>
      <p className="text-lg font-light text-text-primary mt-0.5">{nameId}</p>
    </div>
  );
}
