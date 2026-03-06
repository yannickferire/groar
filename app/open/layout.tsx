import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Startup Stats — Revenue, Users & Growth",
  description:
    "Groar builds in public. See live revenue, user count, MRR, growth metrics and the full tech stack — updated daily.",
  alternates: { canonical: "/open" },
  openGraph: {
    title: "Open Startup Stats — Groar",
    description:
      "Groar builds in public. See live revenue, user count, MRR, growth metrics and the full tech stack — updated daily.",
  },
};

export default function OpenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
