import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";

export const metadata: Metadata = {
  title: "Community Wall",
  description:
    "Browse visuals created by the GROAR community. See how creators share their growth metrics and milestones.",
  keywords: ["creator visuals gallery", "growth metrics showcase", "build in public examples", "metrics visual inspiration"],
  alternates: { canonical: "/wall" },
  openGraph: {
    title: "Community Wall — GROAR",
    description:
      "Browse visuals created by the GROAR community. See how creators share their growth metrics and milestones.",
    url: `${siteUrl}/wall`,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Groar" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Groar Community Wall",
  description:
    "A gallery of growth visuals created by the Groar community — follower milestones, MRR updates, and analytics cards shared by founders and creators.",
  url: `${siteUrl}/wall`,
  isPartOf: {
    "@type": "WebSite",
    name: "Groar",
    url: siteUrl,
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Community Wall", item: `${siteUrl}/wall` },
    ],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
