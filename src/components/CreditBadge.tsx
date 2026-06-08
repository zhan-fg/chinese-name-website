"use client";

import { useEffect, useState } from "react";

interface CreditBalance {
  freeRemaining: number;
  creditsRemaining: number;
  totalRemaining: number;
}

interface Props {
  anonymousId: string;
  refreshKey?: number;
}

export default function CreditBadge({ anonymousId, refreshKey }: Props) {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!anonymousId) return;
    setLoading(true);
    fetch(`/api/check-credits?anonymousId=${encodeURIComponent(anonymousId)}`)
      .then((res) => res.json())
      .then((data) => {
        setBalance(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [anonymousId, refreshKey]);

  if (loading || !balance) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-card-border">
        <div className="w-2.5 h-2.5 rounded-full bg-mist/30 animate-pulse" />
        <span className="text-[10px] text-mist">...</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-card-border">
      <span className="text-[10px] text-text-secondary">
        {balance.freeRemaining > 0
          ? `${balance.freeRemaining} free previews`
          : balance.creditsRemaining > 0
          ? `${balance.creditsRemaining} reports`
          : "No previews left"}
      </span>
    </div>
  );
}
