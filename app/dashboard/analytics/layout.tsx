import PremiumGate from "@/components/dashboard/PremiumGate";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PremiumGate>{children}</PremiumGate>;
}
