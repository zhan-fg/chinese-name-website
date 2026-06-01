import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Shan Shui terms of service and conditions of use.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-light text-text-primary mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Last updated: June 2026
        </p>

        <div className="space-y-5 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Shan Shui, you agree to be bound by these
              Terms of Service. If you do not agree, please do not use the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              2. Service Description
            </h2>
            <p>
              Shan Shui provides AI-generated Chinese name suggestions based on
              user-provided inputs. Names are generated using artificial
              intelligence and reference classical Chinese texts. We strive for
              accuracy but make no guarantees about the cultural appropriateness,
              meaning, or pronunciation of generated names.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              3. User Responsibilities
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                You are responsible for the inputs you provide to the service.
              </li>
              <li>
                Do not use the service to generate offensive, harmful, or
                inappropriate content.
              </li>
              <li>
                Do not abuse the API with excessive automated requests.
              </li>
              <li>
                Generated names are suggestions — you are responsible for
                verifying their appropriateness before use.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              4. Intellectual Property
            </h2>
            <p>
              The name suggestions, cultural explanations, and stories generated
              by Shan Shui are AI-generated content. You may freely use names
              generated for you personally. The underlying code, design, and
              curated fallback content are proprietary. Classical source texts
              cited in name generations are in the public domain.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              5. Limitation of Liability
            </h2>
            <p>
              Shan Shui is provided &ldquo;as is&rdquo; without warranties of any
              kind. We are not liable for any damages arising from the use of the
              service, including but not limited to: inaccurate name suggestions,
              cultural misunderstandings, or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              6. Service Availability
            </h2>
            <p>
              We reserve the right to modify, suspend, or discontinue the service
              at any time. We may impose usage limits to protect service quality.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              7. Changes to Terms
            </h2>
            <p>
              We may update these terms at any time. Continued use of the service
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-text-primary mb-2">
              8. Contact
            </h2>
            <p>
              For questions about these terms, contact us through{" "}
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
