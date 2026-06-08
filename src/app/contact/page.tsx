import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact the Shan Shui team — questions, feedback, and bug reports.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-light text-text-primary mb-2">
          Contact Us
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Questions, feedback, or just want to say hello?
        </p>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <div className="card p-5">
            <h2 className="text-base font-medium text-text-primary mb-3">
              Email
            </h2>
            <p className="mb-2">
              For bug reports, feature requests, partnership inquiries, and
              press — reach us at:
            </p>
            <a
              href="mailto:support@newchinesename.com"
              className="inline-block text-deep-blue hover:underline font-medium text-base"
            >
              support@newchinesename.com
            </a>
            <p className="mt-3 text-xs text-mist">
              We typically respond within 2-3 business days.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-medium text-text-primary mb-3">
              What to Contact Us About
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Bug reports:</strong> Found something broken? Let us
                know.
              </li>
              <li>
                <strong>Name issues:</strong> Got a name that seems inaccurate or
                inappropriate? We want to know.
              </li>
              <li>
                <strong>Feature requests:</strong> Ideas for improving Shan Shui.
              </li>
              <li>
                <strong>Cultural feedback:</strong> Corrections to classical
                sources or cultural explanations.
              </li>
              <li>
                <strong>Partnership inquiries:</strong> Interested in
                collaborating.
              </li>
              <li>
                <strong>Press & media:</strong> Want to write about or feature
                Shan Shui.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
