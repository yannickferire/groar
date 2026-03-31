import type { Metadata } from "next";
import ProGate from "@/components/dashboard/ProGate";

export const metadata: Metadata = {
  title: "Analytics — Track your growth",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProGate>{children}</ProGate>;
}
