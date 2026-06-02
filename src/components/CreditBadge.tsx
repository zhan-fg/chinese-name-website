"use client";

import { useEffect, useState } from "react";

interface CreditBalance {
  freeRemaining: number;
  creditsRemaining: number;
  totalRemaining: number;
  isSubscriber: boolean;
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
        <span className="text-[10px] text-mist">Loading...</span>
      </div>
    );
  }

  if (balance.isSubscriber) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-deep-blue/10 border border-deep-blue/20">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-deep-blue">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="text-[10px] font-medium text-deep-blue">Unlimited</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-card-border">
      <span className="text-[10px] text-text-secondary">
        {balance.freeRemaining > 0
          ? `${balance.freeRemaining} free`
          : `${balance.creditsRemaining} left`}
      </span>
    </div>
  );
}
