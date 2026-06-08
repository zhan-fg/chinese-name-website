"use client";

import { GUMROAD_PRODUCTS } from "@/lib/gumroad";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-light text-text-primary text-center mb-2">
          Unlock Your Chinese Identity
        </h1>
        <p className="text-sm text-text-secondary text-center mb-10">
          3 free previews. Pay only for the names you love.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 max-w-lg sm:max-w-none mx-auto">
          {/* Free Preview */}
          <div className="card p-5 text-center flex flex-col">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
              Free Preview
            </p>
            <p className="text-2xl font-light text-text-primary mb-1">$0</p>
            <p className="text-xs text-text-secondary mb-4">3 previews</p>
            <ul className="text-xs text-text-secondary space-y-2 mb-6 flex-1 text-left">
              <li>&#x2022; Your Chinese name</li>
              <li>&#x2022; Pinyin & pronunciation</li>
              <li>&#x2022; One-line meaning</li>
              <li>&#x2022; Source category</li>
              <li className="text-mist">&#x2022; Full story — locked</li>
              <li className="text-mist">&#x2022; Character breakdown — locked</li>
            </ul>
            <a
              href="/"
              className="block w-full py-2.5 rounded-lg border border-card-border text-text-secondary text-sm hover:bg-gray-50 transition-colors"
            >
              Try Free
            </a>
          </div>

          {/* Identity Report */}
          <div className="card p-5 text-center flex flex-col border-deep-blue ring-1 ring-deep-blue relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-deep-blue text-white text-[10px] font-medium">
              POPULAR
            </div>
            <p className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-1">
              Identity Report
            </p>
            <p className="text-2xl font-light text-text-primary mb-1">$4.99</p>
            <p className="text-xs text-text-secondary mb-4">per name</p>
            <ul className="text-xs text-text-secondary space-y-2 mb-6 flex-1 text-left">
              <li>&#x2022; Full name story</li>
              <li>&#x2022; Classical source & poem</li>
              <li>&#x2022; Character breakdown</li>
              <li>&#x2022; Cultural meaning</li>
              <li>&#x2022; Pronunciation guide</li>
              <li>&#x2022; Share card</li>
            </ul>
            <a
              href={GUMROAD_PRODUCTS.report.url || GUMROAD_PRODUCTS.credit_5.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors text-center"
            >
              Unlock Report
            </a>
          </div>

          {/* Premium: 20 Names */}
          <div className="card p-5 text-center flex flex-col">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
              Premium
            </p>
            <p className="text-2xl font-light text-text-primary mb-1">$9.99</p>
            <p className="text-xs text-text-secondary mb-4">20 name reports</p>
            <ul className="text-xs text-text-secondary space-y-2 mb-6 flex-1 text-left">
              <li>&#x2022; 20 Identity Reports</li>
              <li>&#x2022; 5 styles (Poet, Scholar, Warrior, Modern, Ancient)</li>
              <li>&#x2022; Everything in Report</li>
              <li>&#x2022; Compare & pick your favorite</li>
              <li>&#x2022; One-time purchase</li>
            </ul>
            <a
              href={GUMROAD_PRODUCTS.credit_15.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors text-center"
            >
              Get Premium
            </a>
          </div>
        </div>

        <div className="mt-10 p-5 rounded-card bg-surface border border-card-border text-center">
          <p className="text-xs text-text-secondary mb-3">
            All payments are securely processed by Gumroad. Your financial data
            never touches our servers.
          </p>
          <div className="flex justify-center gap-2 text-[10px] text-mist">
            <span>&#x2022; Gumroad</span>
            <span>&#x2022; Visa</span>
            <span>&#x2022; Mastercard</span>
            <span>&#x2022; Amex</span>
          </div>
        </div>
      </div>
    </main>
  );
}
