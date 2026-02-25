import type { Metadata } from "next";
import PremiumGate from "@/components/dashboard/PremiumGate";

export const metadata: Metadata = {
  title: "History — Your exported visuals",
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PremiumGate>{children}</PremiumGate>;
}
