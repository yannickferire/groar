import type { Metadata } from "next";
import PremiumGate from "@/components/dashboard/PremiumGate";

export const metadata: Metadata = {
  title: "Analytics — Track your growth",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PremiumGate>{children}</PremiumGate>;
}
