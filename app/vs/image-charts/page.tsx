import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VsCta from "@/components/VsCta";
import VsFaq from "@/components/VsFaq";
import Testimonials from "@/components/Testimonials";
import VsBeforeAfter from "@/components/VsBeforeAfter";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "GROAR vs Image-Charts — No-Code Metrics Visuals vs Chart API",
  description:
    "Compare GROAR and Image-Charts for creating metrics visuals. Image-Charts is a developer API for chart images. GROAR is a no-code tool that creates shareable visuals in 10 seconds.",
  alternates: { canonical: "/vs/image-charts" },
  openGraph: {
    title: "GROAR vs Image-Charts — No-Code Metrics Visuals vs Chart API",
    description:
      "Compare GROAR and Image-Charts for creating metrics visuals. Image-Charts is a developer API for chart images. GROAR is a no-code tool that creates shareable visuals in 10 seconds.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Groar" }],
  },
};

type Feature = {
  name: string;
  groar: boolean | string;
  competitor: boolean | string;
};

const features: Feature[] = [
  { name: "No coding required", groar: true, competitor: false },
  { name: "Ready-to-share social media visuals", groar: true, competitor: false },
  { name: "Auto-import metrics from accounts", groar: true, competitor: false },
  { name: "Custom backgrounds & branding", groar: true, competitor: false },
  { name: "Multiple templates (metrics, milestone, progress)", groar: true, competitor: false },
  { name: "Embeddable in emails & reports", groar: false, competitor: true },
  { name: "API / programmatic access", groar: false, competitor: true },
  { name: "Chart types (bar, pie, line, radar)", groar: false, competitor: true },
  { name: "Free plan", groar: true, competitor: true },
  { name: "Starting price", groar: "From $5/mo or lifetime", competitor: "$49/mo" },
];

const faqs = [
  {
    question: "What is the main difference between GROAR and Image-Charts?",
    answer: "Image-Charts is a developer API that generates chart images from URL parameters — you need to code the chart configuration. GROAR is a no-code web app where you pick a template, enter or auto-fill your metrics, and export a designed visual in 10 seconds. Completely different audiences and use cases.",
  },
  {
    question: "Can I use Image-Charts to share metrics on social media?",
    answer: "Image-Charts generates raw chart images (bar charts, pie charts, etc.) — they look like basic data visualizations, not designed social media content. GROAR creates visuals specifically optimized for social feeds with custom backgrounds, fonts, and branding.",
  },
  {
    question: "Do I need to code to use GROAR?",
    answer: "No. GROAR is entirely no-code. Open the editor, pick a template, enter your metrics (or let them auto-fill from your connected accounts), choose a background, and export. No API keys, no URL parameters, no development setup.",
  },
  {
    question: "Is Image-Charts better for automated reporting?",
    answer: "Yes. If you need to embed charts in automated emails, PDF reports, or Slack bots, Image-Charts' API approach is the right fit. GROAR is designed for manual, creative social sharing — when you want your metrics to look good and get engagement.",
  },
  {
    question: "How much does each tool cost?",
    answer: "GROAR Pro is $5/month or a one-time lifetime payment. Image-Charts' paid plans start at $49/month for extended features. GROAR also has a free plan with 1 export per week.",
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
    { "@type": "ListItem", position: 2, name: "GROAR vs Image-Charts", item: "https://groar.app/vs/image-charts" },
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

export default function VsImageChartsPage() {
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
              No-code metrics visuals vs chart API
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Image-Charts is a developer API that generates chart images from URL parameters.
              <br /><br />
              GROAR is a no-code tool that turns your metrics into beautiful, shareable visuals — in 10 seconds.
            </p>
          </header>

          <VsBeforeAfter competitor="Image-Charts" />

          {/* TL;DR */}
          <section className="rounded-2xl border-fade p-6 md:p-8 mb-12 md:mb-16">
            <h2 className="text-lg font-semibold mb-3">TL;DR</h2>
            <p className="text-muted-foreground leading-relaxed">
              Need to embed charts in automated emails or reports via API? <strong className="text-foreground">Image-Charts is built for that</strong>.
              <br className="hidden sm:block" /><br className="hidden sm:block" />
              Want to share your growth metrics on social media with a designed visual? <strong className="text-foreground">GROAR does it in 10 seconds</strong> — no code, no API keys, just pick a template and export.
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
                    <th className="px-4 py-3 text-sm font-bold text-center w-28">GROAR</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-center w-32">Image-Charts</th>
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
                          <FeatureCell value={feature.competitor} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Key differences */}
          <section className="mb-12 md:mb-16 space-y-8">
            <h2 className="text-2xl font-bold">Two very different tools</h2>

            <div>
              <h3 className="text-lg font-semibold mb-2">No code vs API-first</h3>
              <p className="text-muted-foreground leading-relaxed">
                Image-Charts requires you to build chart URLs with parameters — chart type, data, colors, labels, all encoded in the URL. It&apos;s a developer tool that generates static chart images programmatically.
                <br /><br />
                GROAR is a visual editor. Open it, pick a template, enter your metrics, choose a background, export. No technical knowledge required.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Designed for social vs designed for embedding</h3>
              <p className="text-muted-foreground leading-relaxed">
                Image-Charts outputs basic chart images — bar graphs, pie charts, line charts. They&apos;re functional but not designed for social media engagement. They look like data, not content.
                <br /><br />
                GROAR outputs visuals optimized for social feeds — with curated backgrounds, custom fonts, branding, and layouts that stop the scroll. The output is a share-ready image, not a data visualization.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Connected accounts vs manual data</h3>
              <p className="text-muted-foreground leading-relaxed">
                GROAR connects to your X account and Stripe (via TrustMRR) to auto-fill your metrics — followers, MRR, revenue, and more. Image-Charts requires you to pass all data manually through API parameters.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">10x cheaper for creators</h3>
              <p className="text-muted-foreground leading-relaxed">
                GROAR Pro starts at $5/month (or a one-time lifetime payment). Image-Charts&apos; paid plans start at $49/month — designed for businesses embedding charts at scale, not individual creators sharing their growth.
              </p>
            </div>
          </section>

          {/* When to use Image-Charts */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-4">When Image-Charts is the better choice</h2>
            <p className="text-muted-foreground leading-relaxed">
              Image-Charts is great when you need to generate chart images programmatically — embedding them in automated email reports, Slack notifications, PDF documents, or dashboards. If you need an API that returns a chart image from a URL, that&apos;s exactly what it does.
              <br /><br />
              But if you&apos;re a creator, founder, or indie hacker who wants to share growth metrics on social media with a visual that actually gets engagement — GROAR is the faster, simpler, and cheaper option.
            </p>
          </section>

          <div className="mb-12 md:mb-16 -mx-4 md:mx-0">
            <Testimonials />
          </div>

          {/* FAQ */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
            <VsFaq faqs={faqs} />
          </section>

          {/* Cross-link */}
          <section className="mb-12 md:mb-16">
            <p className="text-sm text-muted-foreground text-center">
              See also:{" "}
              <Link href="/vs/piktochart" className="underline hover:text-foreground transition-colors">
                GROAR vs Piktochart
              </Link>{" "}&middot;{" "}
              <Link href="/vs/spreadsheets" className="underline hover:text-foreground transition-colors">
                GROAR vs Spreadsheets
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
