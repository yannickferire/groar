import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for Groar. Choose Free, Pro, or Agency plans to turn your social metrics into shareable visuals.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
