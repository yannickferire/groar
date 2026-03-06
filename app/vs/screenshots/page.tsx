import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VsCta from "@/components/VsCta";
import VsFaq from "@/components/VsFaq";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "GROAR vs Screenshots — Stop Screenshotting Your Analytics",
  description:
    "Screenshots of your analytics look messy and get ignored. GROAR turns your metrics into clean, branded visuals that actually get engagement — in 10 seconds.",
  alternates: { canonical: "/vs/screenshots" },
  openGraph: {
    title: "GROAR vs Screenshots — Stop Screenshotting Your Analytics",
    description:
      "Screenshots of your analytics look messy and get ignored. GROAR turns your metrics into clean, branded visuals that actually get engagement — in 10 seconds.",
  },
};

type Feature = {
  name: string;
  groar: boolean | string;
  screenshots: boolean | string;
};

const features: Feature[] = [
  { name: "Professional, branded visuals", groar: true, screenshots: false },
  { name: "Auto-import metrics from your accounts", groar: true, screenshots: false },
  { name: "Consistent look across posts", groar: true, screenshots: false },
  { name: "Optimized for social media engagement", groar: true, screenshots: false },
  { name: "Custom backgrounds & fonts", groar: true, screenshots: false },
  { name: "Multiple aspect ratios (post, square, banner)", groar: true, screenshots: false },
  { name: "No sensitive data accidentally exposed", groar: true, screenshots: false },
  { name: "Zero effort required", groar: "10 seconds", screenshots: "Crop, annotate, blur..." },
  { name: "Works on any device", groar: true, screenshots: true },
  { name: "Free to start", groar: true, screenshots: true },
];

const faqs = [
  {
    question: "What's wrong with sharing analytics screenshots?",
    answer: "Screenshots look messy — they include UI clutter, inconsistent formatting, and often expose sensitive data you didn't mean to share. They're also hard to read on mobile and don't match your brand. A clean, designed visual gets 2-3x more engagement than a raw screenshot.",
  },
  {
    question: "How is GROAR different from just taking a screenshot?",
    answer: "GROAR connects to your accounts and auto-imports your metrics. You pick a template, choose a background, and export a clean, branded visual in 10 seconds. No cropping, no blurring, no manual typing — and you control exactly what data is shown.",
  },
  {
    question: "Can I still show real data from my analytics?",
    answer: "Absolutely. GROAR pulls real data from X (Twitter), GitHub, Reddit, and SaaS platforms like Stripe (via TrustMRR). Your metrics are auto-filled and always accurate — but presented in a way that's clean and engaging.",
  },
  {
    question: "Is GROAR free?",
    answer: "Yes, GROAR has a free plan that includes the full editor, 3 exports per week, and 5 backgrounds. Pro starts at $5/month (or a one-time payment for lifetime access) and unlocks unlimited exports, all backgrounds, and removes the watermark.",
  },
  {
    question: "Do I need design skills to use GROAR?",
    answer: "No. GROAR is designed so anyone can create professional metric visuals in seconds. Pick a template, choose a background, export — that's it. If you can take a screenshot, you can use GROAR (but the result looks 10x better).",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://groar.app" },
    { "@type": "ListItem", position: 2, name: "GROAR vs Screenshots", item: "https://groar.app/vs/screenshots" },
  ],
};

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium">{value}</span>;
  }
  return value ? (
    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={2} className="text-emerald-500" />
  ) : (
    <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} className="text-muted-foreground/40" />
  );
}

export default function VsScreenshotsPage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main className="flex-1 py-8 mt-4 md:mt-10">
        <article className="max-w-3xl mx-auto">
          {/* Hero */}
          <header className="text-center mb-12 md:mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-[1.3] md:leading-[1.15] mb-4 text-balance">
              Stop screenshotting your analytics
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Raw screenshots look messy, expose data you didn&apos;t mean to share, and get scrolled past.
              <br /><br />
              GROAR turns your metrics into clean, branded visuals that actually get engagement — in 10 seconds.
            </p>
          </header>

          {/* Before / After visual */}
          <section className="mb-8 md:mb-10">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="rounded-xl border border-border bg-muted/30 aspect-video flex items-center justify-center p-3 md:p-5">
                <div className="text-center space-y-1.5">
                  <p className="text-xl md:text-2xl">📸</p>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">Raw screenshot</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground/60">Messy UI, tiny text, sensitive data visible</p>
                </div>
              </div>
              <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 aspect-video flex items-center justify-center p-3 md:p-5">
                <div className="text-center space-y-1.5">
                  <Image
                    src="/groar-logo.png"
                    alt="Groar"
                    width={80}
                    height={22}
                    className="h-auto w-20 md:w-24 mx-auto"
                  />
                  <p className="text-xs md:text-sm font-medium text-emerald-600">Clean, branded visual</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground/60">Only the metrics you choose to share</p>
                </div>
              </div>
            </div>
          </section>

          {/* TL;DR */}
          <section className="rounded-2xl border-fade p-6 md:p-8 mb-12 md:mb-16">
            <h2 className="text-lg font-semibold mb-3">TL;DR</h2>
            <p className="text-muted-foreground leading-relaxed">
              Screenshots are quick but look unprofessional, expose sensitive data, and get ignored in feeds.{" "}
              <strong className="text-foreground">GROAR gives you clean, branded metric visuals</strong> — auto-filled from your accounts, optimized for social media, ready in 10 seconds.
            </p>
          </section>

          {/* Comparison table */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-6">Feature comparison</h2>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Feature</th>
                    <th className="px-4 py-3 text-sm font-bold text-center w-32">GROAR</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-center w-32">Screenshots</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, i) => (
                    <tr key={feature.name} className={i < features.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-4 py-3 text-sm">{feature.name}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <FeatureCell value={feature.groar} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <FeatureCell value={feature.screenshots} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Key problems with screenshots */}
          <section className="mb-12 md:mb-16 space-y-8">
            <h2 className="text-2xl font-bold">Why screenshots hurt your engagement</h2>

            <div>
              <h3 className="text-lg font-semibold mb-2">They look messy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Analytics dashboards are designed to be functional, not shareable. Screenshots include navigation bars, sidebars, tooltips, and tiny text that&apos;s unreadable on mobile. Your followers see clutter — not your achievement.
                <br /><br />
                GROAR strips everything down to the metrics that matter, presented in a clean, readable format optimized for social feeds.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">They expose data you didn&apos;t mean to share</h3>
              <p className="text-muted-foreground leading-relaxed">
                Forgot to blur your revenue? Your email? A competitor can see your exact traffic sources? Screenshots expose everything on screen — and once it&apos;s posted, it&apos;s too late.
                <br /><br />
                With GROAR, you choose exactly which metrics to display. Nothing else leaks.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">They don&apos;t stand out in the feed</h3>
              <p className="text-muted-foreground leading-relaxed">
                A screenshot of Google Analytics looks like every other screenshot of Google Analytics. It blends into the noise and gets scrolled past.
                <br /><br />
                A branded, designed visual with a bold background and clear metrics stops the scroll. That&apos;s the difference between 5 likes and 50.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">They&apos;re inconsistent</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every screenshot looks different — different sizes, different UIs, different zoom levels. Your profile becomes a visual mess with no recognizable style.
                <br /><br />
                With GROAR, every export follows your template, background, and brand settings. Your audience recognizes your posts at a glance.
              </p>
            </div>
          </section>

          {/* When screenshots are fine */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-4">When a screenshot is fine</h2>
            <p className="text-muted-foreground leading-relaxed">
              Screenshots work for quick replies, DMs, or internal Slack messages where aesthetics don&apos;t matter. If you&apos;re sharing analytics with your team or debugging something, a screenshot does the job.
              <br /><br />
              But when you&apos;re posting publicly — on X, LinkedIn, or your community — and you want people to notice, engage, and follow your journey, a designed visual wins every time.
            </p>
          </section>

          {/* FAQ */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
            <VsFaq faqs={faqs} />
          </section>

          {/* Cross-link */}
          <section className="mb-12 md:mb-16">
            <p className="text-sm text-muted-foreground text-center">
              See also:{" "}
              <Link href="/vs/canva" className="underline hover:text-foreground transition-colors">
                GROAR vs Canva
              </Link>{" "}&middot;{" "}
              <Link href="/vs" className="underline hover:text-foreground transition-colors">
                Compare
              </Link>
            </p>
          </section>

          {/* CTA */}
          <VsCta />
        </article>
      </main>
      <Footer />
    </div>
  );
}
