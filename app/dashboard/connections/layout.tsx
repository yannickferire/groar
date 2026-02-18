import PremiumGate from "@/components/dashboard/PremiumGate";

export default function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PremiumGate>{children}</PremiumGate>;
}
