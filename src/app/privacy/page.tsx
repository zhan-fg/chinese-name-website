import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Shan Shui privacy policy — how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-light text-text-primary mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Last updated: June 2026
        </p>

        <div className="space-y-5 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              1. Information We Collect
            </h2>
            <p>
              When you use Shan Shui, we may collect:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Name generation inputs:</strong> The English name,
                descriptive word, birth date, birth time, and location you
                optionally provide to personalize your Chinese name.
              </li>
              <li>
                <strong>Usage data:</strong> Anonymous analytics including pages
                visited, time spent, and interactions — collected via Google
                Analytics (if enabled). This data cannot identify you personally.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser type, device
                type, and operating system — standard web server logs.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                To generate personalized Chinese names based on your inputs
              </li>
              <li>
                To improve our name generation algorithms and user experience
              </li>
              <li>To analyze site traffic and usage patterns (via Google Analytics)</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              3. Data Storage & Retention
            </h2>
            <p>
              Name generation inputs are processed in real-time and are NOT
              permanently stored on our servers. Usage analytics data is retained
              according to Google Analytics&apos; data retention policies
              (typically 14-26 months). Server logs are automatically rotated and
              deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              4. Third-Party Services
            </h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>DeepSeek AI:</strong> Name generation requests are sent
                to DeepSeek&apos;s API. See{" "}
                <a
                  href="https://platform.deepseek.com/privacy"
                  className="text-deep-blue hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DeepSeek&apos;s Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Google Analytics:</strong> Anonymous usage analytics (if
                enabled). See{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className="text-deep-blue hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google&apos;s Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Vercel:</strong> Hosting and serverless functions. See{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  className="text-deep-blue hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vercel&apos;s Privacy Policy
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              5. Cookies
            </h2>
            <p>
              Shan Shui itself does NOT use cookies. However, Google Analytics
              may set cookies for anonymous tracking purposes. You can disable
              cookies in your browser settings or use the{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                className="text-deep-blue hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              6. Your Rights
            </h2>
            <p>
              Depending on your jurisdiction, you may have the right to access,
              correct, or delete personal data we hold about you. Since we do not
              store name generation inputs permanently, there is typically no
              stored personal data to access. For analytics data, please refer to
              Google&apos;s privacy controls.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              7. Contact
            </h2>
            <p>
              For privacy-related questions, contact us through the GitHub
              repository at{" "}
              <a
                href="https://github.com/zhan-fg/chinese-name-website"
                className="text-deep-blue hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/zhan-fg/chinese-name-website
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
