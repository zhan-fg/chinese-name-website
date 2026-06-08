import type { Metadata } from "next";
import { ClaimForm } from "./ClaimForm";
import { PendingName } from "./PendingName";

export const metadata: Metadata = {
  title: "Claim Your Purchase — Shan Shui",
  description: "Enter your email to claim your Chinese name report or credits.",
};

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-xl font-light text-text-primary mb-2">
            Almost there!
          </h1>
          <p className="text-sm text-text-secondary mb-2">
            Enter the email you used on Gumroad to unlock your purchase.
          </p>
          <PendingName />
          <ClaimForm />
          <p className="text-xs text-mist mt-4">
            Already have credits?{" "}
            <a href="/" className="text-deep-blue hover:underline">
              Go to the name generator →
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
