import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VsCta from "@/components/VsCta";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "GROAR vs Other Tools — Comparisons for Metrics Visuals",
  description:
    "See how GROAR compares to screenshots, Canva, and other tools for creating shareable analytics visuals. Find the best way to showcase your growth.",
  alternates: { canonical: "/vs" },
  openGraph: {
    title: "GROAR vs Other Tools — Comparisons for Metrics Visuals",
    description:
      "See how GROAR compares to screenshots, Canva, and other tools for creating shareable analytics visuals.",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://groar.app" },
    { "@type": "ListItem", position: 2, name: "Compare", item: "https://groar.app/vs" },
  ],
};

type ComparisonPoint = { feature: string; groar: boolean; other: boolean };

const comparisons = [
  {
    href: "/vs/screenshots",
    title: "GROAR vs Screenshots",
    summary:
      "Raw screenshots look messy, expose sensitive data, and get scrolled past. GROAR turns your metrics into clean, branded visuals that actually get engagement.",
    highlights: ["No sensitive data leaks", "Consistent branded look", "Optimized for social feeds"],
    points: [
      { feature: "Professional, branded visuals", groar: true, other: false },
      { feature: "Auto-import metrics", groar: true, other: false },
      { feature: "No sensitive data exposed", groar: true, other: false },
      { feature: "Consistent look across posts", groar: true, other: false },
      { feature: "Free to start", groar: true, other: true },
    ] as ComparisonPoint[],
    otherLabel: "Screenshots",
  },
  {
    href: "/vs/canva",
    title: "GROAR vs Canva",
    summary:
      "Canva is a powerful all-in-one design tool, but you have to build everything from scratch. GROAR gives you ready-to-use templates and auto-imports your metrics.",
    highlights: ["10 seconds vs 15 minutes", "Auto-fill from your accounts", "3x cheaper"],
    points: [
      { feature: "Purpose-built for metrics visuals", groar: true, other: false },
      { feature: "Auto-import your metrics", groar: true, other: false },
      { feature: "Ready in 10 seconds", groar: true, other: false },
      { feature: "General-purpose design", groar: false, other: true },
      { feature: "Free plan", groar: true, other: true },
    ] as ComparisonPoint[],
    otherLabel: "Canva",
  },
  {
    href: "/vs/piktochart",
    title: "GROAR vs Piktochart",
    summary:
      "Piktochart is a powerful infographic maker for reports and presentations. GROAR is built for one thing: sharing your growth metrics on social media in seconds.",
    highlights: ["Purpose-built for metrics", "Auto-fill from accounts", "3x cheaper"],
    points: [
      { feature: "Purpose-built for metrics visuals", groar: true, other: false },
      { feature: "Auto-import your metrics", groar: true, other: false },
      { feature: "Ready in 10 seconds", groar: true, other: false },
      { feature: "Infographics & reports", groar: false, other: true },
      { feature: "Free plan", groar: true, other: true },
    ] as ComparisonPoint[],
    otherLabel: "Piktochart",
  },
  {
    href: "/vs/image-charts",
    title: "GROAR vs Image-Charts",
    summary:
      "Image-Charts is a developer API for generating chart images from URL parameters. GROAR is a no-code tool for creating shareable visuals — no coding required.",
    highlights: ["No code required", "Designed for social", "10x cheaper"],
    points: [
      { feature: "No coding required", groar: true, other: false },
      { feature: "Social media optimized", groar: true, other: false },
      { feature: "Auto-import metrics", groar: true, other: false },
      { feature: "API / programmatic access", groar: false, other: true },
      { feature: "Free plan", groar: true, other: true },
    ] as ComparisonPoint[],
    otherLabel: "Image-Charts",
  },
  {
    href: "/vs/spreadsheets",
    title: "GROAR vs Spreadsheets",
    summary:
      "Google Sheets and Excel are great for tracking data, but chart exports look like data — not content. GROAR makes your metrics shareable.",
    highlights: ["Designed for social feeds", "Branded visuals", "No formatting needed"],
    points: [
      { feature: "Designed for social sharing", groar: true, other: false },
      { feature: "Custom branding & backgrounds", groar: true, other: false },
      { feature: "Social-optimized aspect ratios", groar: true, other: false },
      { feature: "Data analysis & formulas", groar: false, other: true },
      { feature: "Free to start", groar: true, other: true },
    ] as ComparisonPoint[],
    otherLabel: "Spreadsheets",
  },
  {
    href: "/vs/build-in-public",
    title: "Build in Public Tools",
    summary:
      "Building in public means sharing milestones, MRR, and growth regularly. GROAR is the visual toolkit built for that.",
    highlights: ["Auto-import from X, GitHub, Stripe", "Milestone templates", "10 seconds to share"],
    points: [
      { feature: "Purpose-built for growth metrics", groar: true, other: false },
      { feature: "Auto-import your metrics", groar: true, other: false },
      { feature: "Ready-to-use milestone templates", groar: true, other: false },
      { feature: "Consistent visual identity", groar: true, other: false },
      { feature: "Free to start", groar: true, other: true },
    ] as ComparisonPoint[],
    otherLabel: "Manual",
  },
];

export default function VsIndexPage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main className="flex-1 py-8 mt-4 md:mt-10">
        <article className="max-w-3xl mx-auto">
          <header className="text-center mb-12 md:mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-[1.3] md:leading-[1.15] mb-4 text-balance">
              How GROAR compares
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              There are many ways to share your metrics. Here&apos;s why creators choose GROAR over the alternatives.
            </p>
          </header>

          <section className="space-y-6 mb-12 md:mb-16">
            {comparisons.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl border border-border p-6 md:p-8 hover:border-foreground/20 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover:underline">{item.title}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">{item.summary}</p>
                    <div className="mt-4 rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="px-3 py-2 font-medium text-muted-foreground text-xs"></th>
                            <th className="px-3 py-2 font-bold text-xs text-center w-20">GROAR</th>
                            <th className="px-3 py-2 font-medium text-muted-foreground text-xs text-center w-24">{item.otherLabel}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.points.map((pt, i) => (
                            <tr key={pt.feature} className={i < item.points.length - 1 ? "border-b border-border" : ""}>
                              <td className="px-3 py-2 text-xs">{pt.feature}</td>
                              <td className="px-3 py-2 text-center">
                                <HugeiconsIcon
                                  icon={pt.groar ? CheckmarkCircle02Icon : Cancel01Icon}
                                  size={16}
                                  strokeWidth={pt.groar ? 2 : 1.5}
                                  className={pt.groar ? "text-emerald-500 mx-auto" : "text-muted-foreground/40 mx-auto"}
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <HugeiconsIcon
                                  icon={pt.other ? CheckmarkCircle02Icon : Cancel01Icon}
                                  size={16}
                                  strokeWidth={pt.other ? 2 : 1.5}
                                  className={pt.other ? "text-emerald-500 mx-auto" : "text-muted-foreground/40 mx-auto"}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={24}
                    strokeWidth={2}
                    className="text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0 mt-1"
                  />
                </div>
              </Link>
            ))}
          </section>

          <VsCta />
        </article>
      </main>
      <Footer />
    </div>
  );
}
