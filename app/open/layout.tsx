import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Startup Stats — Revenue, Users & Growth",
  description:
    "Groar builds in public. See live revenue, user count, MRR, growth metrics and the full tech stack — updated daily.",
  keywords: ["open startup dashboard", "transparent saas metrics", "build in public revenue", "open startup stats"],
  alternates: { canonical: "/open" },
  openGraph: {
    title: "Open Startup Stats — Groar",
    description:
      "Groar builds in public. See live revenue, user count, MRR, growth metrics and the full tech stack — updated daily.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Groar" }],
  },
};

export default function OpenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
