"use client";

import { useState } from "react";
import type { NameEntry } from "@/lib/types";

interface ReportItem {
  nameId: string;
  nameData: NameEntry;
  createdAt: string;
}

export default function MyNamesPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch(
        `/api/my-reports?email=${encodeURIComponent(email.trim())}`
      );
      const data = await res.json();
      setReports(data.reports || []);
      if (data.reports?.length === 0) {
        setError("No reports found for this email.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report: ReportItem) => {
    // Store the report data so the main page can show it
    try {
      sessionStorage.setItem("shan-view-report", JSON.stringify(report.nameData));
      window.location.href = "/?view=report";
    } catch {
      window.location.href = "/";
    }
  };

  // Display name from nameId
  const displayName = (report: ReportItem) => {
    const d = report.nameData;
    return d.fullChars || d.chars || report.nameId;
  };

  const sourceLabel = (category: string) => {
    const map: Record<string, string> = {
      poetry: "Classical Poetry",
      elements: "Five Elements",
      nature: "Astronomy & Geography",
      mythology: "Chinese Mythology",
      history: "Historical Legends",
    };
    return map[category] || category;
  };

  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-2xl font-light text-text-primary text-center mb-2">
          My Chinese Names
        </h1>
        <p className="text-sm text-text-secondary text-center mb-8">
          Enter the email you used on Gumroad to recover your unlocked names.
        </p>

        {/* Search */}
        <div className="flex gap-2 mb-8">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="you@email.com"
            className="flex-1 px-4 py-2.5 rounded-lg border border-card-border text-sm focus:outline-none focus:border-deep-blue"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !email.trim()}
            className="px-6 py-2.5 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Find"}
          </button>
        </div>

        {error && searched && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-center mb-6">
            <p className="text-sm text-amber-800">{error}</p>
            <p className="text-xs text-amber-600 mt-1">
              Make sure you used the same email as your Gumroad purchase.
            </p>
          </div>
        )}

        {/* Report list */}
        {reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((report, i) => (
              <button
                key={report.nameId || i}
                onClick={() => handleViewReport(report)}
                className="w-full card p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-light text-text-primary">
                      {displayName(report)}
                    </p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {report.nameData.meaning}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EEF4F8] text-deep-blue">
                        {sourceLabel(report.nameData.sourceCategory)}
                      </span>
                      <span className="text-[11px] text-mist">
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-mist"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="text-center mt-8">
          <a href="/" className="text-sm text-deep-blue hover:underline">
            ← Back to name generator
          </a>
        </div>
      </div>
    </main>
  );
}
