import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";

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
    url: `${siteUrl}/open`,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Groar" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Groar Open Startup Stats",
  description:
    "Live transparency dashboard showing Groar's revenue, user growth, MRR, exports and the full tech stack powering the product.",
  url: `${siteUrl}/open`,
  isPartOf: {
    "@type": "WebSite",
    name: "Groar",
    url: siteUrl,
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Open Stats", item: `${siteUrl}/open` },
    ],
  },
  mainEntity: {
    "@type": "Organization",
    name: "Groar",
    url: siteUrl,
    description:
      "Groar turns your analytics into eye-catching visuals in seconds. Built for founders, indie hackers and creators who build in public.",
    foundingDate: "2025",
    founder: {
      "@type": "Person",
      name: "Yannick Ferire",
      url: "https://x.com/yannick_ferire",
    },
  },
};

export default function OpenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
