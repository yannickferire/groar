import PremiumGate from "@/components/dashboard/PremiumGate";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PremiumGate>{children}</PremiumGate>;
}
