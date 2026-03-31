import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connections — Manage your accounts",
};

export default function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
