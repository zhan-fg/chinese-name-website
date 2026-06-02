"use client";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-light text-text-primary text-center mb-2">
          Simple, Fair Pricing
        </h1>
        <p className="text-sm text-text-secondary text-center mb-10">
          Your first 3 names are free. After that, choose what works for you.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 max-w-lg sm:max-w-none mx-auto">
          {/* Free */}
          <div className="card p-5 text-center flex flex-col">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
              Free
            </p>
            <p className="text-2xl font-light text-text-primary mb-1">$0</p>
            <p className="text-xs text-text-secondary mb-4">forever</p>
            <ul className="text-xs text-text-secondary space-y-2 mb-6 flex-1 text-left">
              <li>&#x2022; 3 name generations</li>
              <li>&#x2022; All 5 source categories</li>
              <li>&#x2022; Bazi (八字) analysis</li>
              <li>&#x2022; Pronunciation guide</li>
              <li>&#x2022; Cultural story</li>
              <li>&#x2022; Share card</li>
            </ul>
            <a
              href="/"
              className="block w-full py-2.5 rounded-lg border border-card-border text-text-secondary text-sm hover:bg-gray-50 transition-colors"
            >
              Get Started
            </a>
          </div>

          {/* Credit 5 */}
          <div className="card p-5 text-center flex flex-col">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
              5 Credits
            </p>
            <p className="text-2xl font-light text-text-primary mb-1">$5.99</p>
            <p className="text-xs text-text-secondary mb-4">$1.20 per name</p>
            <ul className="text-xs text-text-secondary space-y-2 mb-6 flex-1 text-left">
              <li>&#x2022; 5 additional generations</li>
              <li>&#x2022; Everything in Free</li>
              <li>&#x2022; Credits never expire</li>
              <li>&#x2022; One-time payment</li>
            </ul>
            <button
              onClick={() =>
                (window.location.href = "/?buy=credit_5")
              }
              className="block w-full py-2.5 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors"
            >
              Buy 5 Credits
            </button>
          </div>

          {/* Unlimited */}
          <div className="card p-5 text-center flex flex-col border-deep-blue ring-1 ring-deep-blue relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-deep-blue text-white text-[10px] font-medium">
              BEST VALUE
            </div>
            <p className="text-xs font-medium text-deep-blue uppercase tracking-wider mb-1">
              Unlimited
            </p>
            <p className="text-2xl font-light text-text-primary mb-1">$4.99</p>
            <p className="text-xs text-text-secondary mb-4">30 days</p>
            <ul className="text-xs text-text-secondary space-y-2 mb-6 flex-1 text-left">
              <li>&#x2022; Unlimited generations</li>
              <li>&#x2022; Everything in Free</li>
              <li>&#x2022; Save name history</li>
              <li>&#x2022; Cancel anytime</li>
            </ul>
            <button
              onClick={() =>
                (window.location.href = "/?buy=subscription")
              }
              className="block w-full py-2.5 rounded-lg bg-deep-blue text-white text-sm font-medium hover:bg-mid-blue transition-colors"
            >
              Get 30 Days
            </button>
          </div>
        </div>

        <div className="mt-10 p-5 rounded-card bg-surface border border-card-border text-center">
          <p className="text-xs text-text-secondary mb-3">
            All payments are securely processed by PayPal. Your financial data
            never touches our servers.
          </p>
          <div className="flex justify-center gap-2 text-[10px] text-mist">
            <span>&#x2022; PayPal</span>
            <span>&#x2022; Visa</span>
            <span>&#x2022; Mastercard</span>
            <span>&#x2022; Amex</span>
          </div>
        </div>
      </div>
    </main>
  );
}
