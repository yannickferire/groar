import type { Metadata } from "next";
import ProGate from "@/components/dashboard/ProGate";

export const metadata: Metadata = {
  title: "History — Your exported visuals",
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProGate>{children}</ProGate>;
}
