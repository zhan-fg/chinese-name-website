import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Chinese Name Generator",
  description:
    "Simple, fair pricing for your Chinese name journey. 3 free generations, then choose from affordable credit packs or monthly unlimited access. Secure payments via PayPal.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
