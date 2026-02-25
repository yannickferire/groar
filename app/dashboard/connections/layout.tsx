import type { Metadata } from "next";
import PremiumGate from "@/components/dashboard/PremiumGate";

export const metadata: Metadata = {
  title: "Connections — Manage your X accounts",
};

export default function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PremiumGate>{children}</PremiumGate>;
}
