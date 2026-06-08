import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Shan Shui refund policy — eligibility, process, and terms.",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-light text-text-primary mb-2">
          Refund Policy
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Last updated: June 2026
        </p>

        <div className="space-y-5 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              1. Digital Product Nature
            </h2>
            <p>
              Shan Shui provides AI-generated digital content (Chinese name
              suggestions, cultural stories, and related materials). All
              products are delivered instantly in digital form. Once a name
              generation credit is consumed or subscription benefits are
              accessed, the digital content has been delivered and generally
              cannot be returned.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              2. Refund Eligibility
            </h2>
            <p className="mb-2">
              We offer refunds in the following circumstances:
            </p>

            <h3 className="text-sm font-medium text-text-primary mt-3 mb-1">
              Credit Packs (One-Time Purchases)
            </h3>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>
                <strong>Full refund</strong> within 7 days of purchase if
                <strong> none</strong> of the credits have been used.
              </li>
              <li>
                <strong>Partial refund</strong> within 7 days if some credits
                were used but a technical issue on our side prevented you from
                receiving the intended service (e.g., generation failures due
                to our server error).
              </li>
              <li>
                Credits used to successfully generate names are
                non-refundable, as the digital content has been delivered.
              </li>
            </ul>

            <h3 className="text-sm font-medium text-text-primary mt-3 mb-1">
              Subscriptions (50/Day Plan)
            </h3>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>
                <strong>Full refund</strong> within 7 days of the initial
                subscription purchase if you have not used the service during
                that period.
              </li>
              <li>
                <strong>Cancellation:</strong> You may cancel your subscription
                at any time. Cancellation stops future billing. Your access
                continues until the end of the current billing period.
              </li>
              <li>
                Subscription renewals are non-refundable after the billing
                date, but you can cancel before the next renewal to avoid
                future charges.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              3. Non-Refundable Situations
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Credits that have been successfully used to generate names.
              </li>
              <li>
                Subscription periods that have already been accessed or used.
              </li>
              <li>
                Dissatisfaction with the creative output of the AI (names are
                AI-generated suggestions and subjective by nature).
              </li>
              <li>
                Refund requests submitted more than 7 days after purchase.
              </li>
              <li>
                Purchases made through unauthorized or fraudulent means.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              4. How to Request a Refund
            </h2>
            <p className="mb-2">
              To request a refund, contact us with the following information:
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>The email address used during purchase</li>
              <li>Date and amount of the transaction</li>
              <li>Reason for the refund request</li>
            </ul>
            <p>
              Contact us at{" "}
              <a
                href="mailto:shanshui.name@gmail.com"
                className="text-deep-blue hover:underline"
              >
                shanshui.name@gmail.com
              </a>
              . We aim to respond to all refund requests within 2 business
              days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              5. Processing
            </h2>
            <p>
              Approved refunds are processed through our payment provider
              (Paddle) and will be returned to your original payment method.
              Processing time depends on your bank or card issuer, typically
              5–10 business days after approval. Paddle may require additional
              verification for refund requests.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              6. Chargebacks
            </h2>
            <p>
              If you believe an unauthorized charge has been made, please
              contact us first at{" "}
              <a
                href="mailto:shanshui.name@gmail.com"
                className="text-deep-blue hover:underline"
              >
                shanshui.name@gmail.com
              </a>{" "}
              before initiating a chargeback with your bank. We can resolve
              most issues faster than the formal chargeback process.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              7. Changes to This Policy
            </h2>
            <p>
              We may update this refund policy from time to time. Changes
              apply to purchases made after the update date. The version in
              effect at the time of your purchase governs that transaction.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
