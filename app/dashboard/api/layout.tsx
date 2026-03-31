import type { Metadata } from "next";
import ProGate from "@/components/dashboard/ProGate";

export const metadata: Metadata = {
  title: "API — Generate card images",
};

export default function ApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProGate proOnly>{children}</ProGate>;
}
