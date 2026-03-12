import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";

export const metadata: Metadata = {
  title: "Community Wall",
  description:
    "Browse visuals created by the GROAR community. See how creators share their growth metrics and milestones.",
  alternates: { canonical: "/wall" },
  openGraph: {
    title: "Community Wall — GROAR",
    description:
      "Browse visuals created by the GROAR community. See how creators share their growth metrics and milestones.",
    url: `${siteUrl}/wall`,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Groar" }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
