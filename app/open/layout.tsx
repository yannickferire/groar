import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Stats",
  description:
    "Groar is an open startup. Live metrics, revenue, growth and stack — full transparency.",
  alternates: { canonical: "/open" },
  openGraph: {
    title: "Open Stats — Groar",
    description:
      "Groar is an open startup. Live metrics, revenue, growth and stack — full transparency.",
  },
};

export default function OpenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
