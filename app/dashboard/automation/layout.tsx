import type { Metadata } from "next";
import ProGate from "@/components/dashboard/ProGate";

export const metadata: Metadata = {
  title: "Automation — Auto-post milestones",
};

export default function AutomationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProGate proOnly>{children}</ProGate>;
}
