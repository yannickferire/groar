import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VsCta from "@/components/VsCta";
import VsFaq from "@/components/VsFaq";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "GROAR vs Spreadsheet Charts — Share Metrics Without Ugly Excel Exports",
  description:
    "Stop exporting ugly charts from Google Sheets or Excel. GROAR turns your metrics into clean, branded visuals designed for social media — in 10 seconds.",
  alternates: { canonical: "/vs/spreadsheets" },
  openGraph: {
    title: "GROAR vs Spreadsheet Charts — Share Metrics Without Ugly Excel Exports",
    description:
      "Stop exporting ugly charts from Google Sheets or Excel. GROAR turns your metrics into clean, branded visuals designed for social media — in 10 seconds.",
  },
};

type Feature = {
  name: string;
  groar: boolean | string;
  competitor: boolean | string;
};

const features: Feature[] = [
  { name: "Designed for social media sharing", groar: true, competitor: false },
  { name: "Auto-import metrics from accounts", groar: true, competitor: false },
  { name: "Custom backgrounds & branding", groar: true, competitor: false },
  { name: "Multiple social-optimized aspect ratios", groar: true, competitor: false },
  { name: "Ready in 10 seconds", groar: true, competitor: false },
  { name: "Data analysis & formulas", groar: false, competitor: true },
  { name: "Complex charts & graphs", groar: false, competitor: true },
  { name: "Team collaboration on data", groar: false, competitor: true },
  { name: "Free to start", groar: true, competitor: true },
  { name: "Design skills needed", groar: "None", competitor: "Formatting effort" },
];

const faqs = [
  {
    question: "Why not just export a chart from Google Sheets?",
    answer: "Spreadsheet charts are designed for data analysis, not social media. They come with axis labels, gridlines, default colors, and no branding. They look functional, not shareable. GROAR creates visuals specifically designed to stop the scroll and get engagement.",
  },
  {
    question: "Can I use my spreadsheet data in GROAR?",
    answer: "GROAR auto-fills metrics from connected accounts (X, Stripe via TrustMRR). For other metrics, you enter values directly in the editor — it's faster than formatting a spreadsheet chart. Pick a template, type your numbers, export.",
  },
  {
    question: "Is GROAR better than Excel for tracking metrics?",
    answer: "No — they do different things. Spreadsheets are great for tracking and analyzing data over time. GROAR is for the moment you want to share those metrics publicly. Track in your spreadsheet, share with GROAR.",
  },
  {
    question: "Do I need design skills to make metrics look good?",
    answer: "Not with GROAR. Every template is pre-designed and optimized for social sharing. Pick a background, enter your numbers, export. With spreadsheets, you'd need to customize colors, fonts, sizing, and export settings to get anything close to shareable.",
  },
  {
    question: "Is GROAR free?",
    answer: "Yes, GROAR has a free plan with full editor access, 3 exports per week, and 5 backgrounds. Pro starts at $5/month (or a one-time lifetime payment) for unlimited exports, all backgrounds, and no watermark.",
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
    { "@type": "ListItem", position: 2, name: "GROAR vs Spreadsheets", item: "https://groar.app/vs/spreadsheets" },
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

export default function VsSpreadsheetsPage() {
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
              Stop sharing ugly spreadsheet charts
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Google Sheets and Excel charts are built for data analysis, not social media.
              <br /><br />
              GROAR turns your metrics into clean, branded visuals that actually get engagement — in 10 seconds.
            </p>
          </header>

          {/* TL;DR */}
          <section className="rounded-2xl border-fade p-6 md:p-8 mb-12 md:mb-16">
            <h2 className="text-lg font-semibold mb-3">TL;DR</h2>
            <p className="text-muted-foreground leading-relaxed">
              Spreadsheets are great for tracking your data. But when it&apos;s time to share your metrics publicly, <strong className="text-foreground">a chart export from Sheets looks like a chart export from Sheets</strong>.
              <br className="hidden sm:block" /><br className="hidden sm:block" />
              <strong className="text-foreground">GROAR gives you designed, branded visuals</strong> — pick a template, enter your numbers, export. Your metrics deserve better than a default bar chart.
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
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-center w-32">Spreadsheets</th>
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
            <h2 className="text-2xl font-bold">Why spreadsheet charts don&apos;t work on social media</h2>

            <div>
              <h3 className="text-lg font-semibold mb-2">They look like data, not content</h3>
              <p className="text-muted-foreground leading-relaxed">
                A Google Sheets chart has axis labels, gridlines, a legend, default colors, and a white background. It looks like something from a board meeting, not something that gets likes and retweets.
                <br /><br />
                GROAR visuals are designed for the feed — bold typography, curated backgrounds, clean layouts. Your metrics look like content worth engaging with.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">No branding, no personality</h3>
              <p className="text-muted-foreground leading-relaxed">
                Spreadsheet exports have zero personality. They all look the same — generic chart, white background, Arial font. There&apos;s no way to add your logo, match your brand colors, or stand out.
                <br /><br />
                With GROAR, you choose your background, font, and can add your logo. Every post is recognizably yours.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Wrong aspect ratio, wrong format</h3>
              <p className="text-muted-foreground leading-relaxed">
                Spreadsheet chart exports come in whatever size the chart happens to be. They&apos;re not optimized for any social platform — they get cropped weirdly or displayed too small.
                <br /><br />
                GROAR exports in social-optimized aspect ratios: 16:9 for posts, 1:1 for Instagram, 3:1 for banners. High-quality PNG at 3x resolution, auto-copied to clipboard.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Too much data, not enough story</h3>
              <p className="text-muted-foreground leading-relaxed">
                Charts show trends over time. But on social media, what performs is a clear, bold metric: &ldquo;$5K MRR&rdquo;, &ldquo;10,000 followers&rdquo;, &ldquo;+42% growth&rdquo;. That&apos;s what GROAR is built for — highlighting the numbers that matter, not drowning people in data.
              </p>
            </div>
          </section>

          {/* When spreadsheets are fine */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-4">When spreadsheets are the right tool</h2>
            <p className="text-muted-foreground leading-relaxed">
              Spreadsheets are unbeatable for tracking, analyzing, and visualizing data internally. Use Google Sheets or Excel for your KPI dashboards, revenue tracking, and data analysis.
              <br /><br />
              But when you want to share those metrics publicly — on X, LinkedIn, or with your community — switch to GROAR for a visual that matches the quality of your work.
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
              <Link href="/vs/screenshots" className="underline hover:text-foreground transition-colors">
                GROAR vs Screenshots
              </Link>{" "}&middot;{" "}
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
