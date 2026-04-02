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
  title: "GROAR vs Piktochart — Best Tool for Sharing Your Metrics",
  description:
    "Compare GROAR and Piktochart for creating metrics visuals. Piktochart is great for infographics, but GROAR is purpose-built for sharing growth metrics on social media.",
  keywords: ["piktochart alternative", "piktochart vs groar", "metrics infographic maker", "share growth metrics social media"],
  alternates: { canonical: "/vs/piktochart" },
  openGraph: {
    title: "GROAR vs Piktochart — Best Tool for Sharing Your Metrics",
    description:
      "Compare GROAR and Piktochart for creating metrics visuals. Piktochart is great for infographics, but GROAR is purpose-built for sharing growth metrics on social media.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Groar" }],
  },
};

type Feature = {
  name: string;
  groar: boolean | string;
  competitor: boolean | string;
};

const features: Feature[] = [
  { name: "Purpose-built for metrics visuals", groar: true, competitor: false },
  { name: "Auto-import metrics from your accounts", groar: true, competitor: false },
  { name: "Ready in 10 seconds", groar: true, competitor: false },
  { name: "Templates optimized for social sharing", groar: true, competitor: false },
  { name: "Infographics & reports", groar: false, competitor: true },
  { name: "Presentations & printables", groar: false, competitor: true },
  { name: "Custom backgrounds & fonts", groar: true, competitor: true },
  { name: "Multiple export formats", groar: "PNG", competitor: "PNG, PDF, HTML" },
  { name: "Free plan", groar: true, competitor: true },
  { name: "Starting price", groar: "From $5/mo or lifetime", competitor: "$14/mo" },
];

const faqs = [
  {
    question: "What is the main difference between GROAR and Piktochart?",
    answer: "GROAR is purpose-built for turning your growth metrics into shareable social media visuals in 10 seconds. Piktochart is a general infographic and report maker designed for longer-form visual content like presentations, reports, and posters. If you want to share your MRR, followers, or GitHub stars on X — GROAR is faster and simpler.",
  },
  {
    question: "Can Piktochart create metrics visuals for social media?",
    answer: "Technically yes, but you'd have to start from a blank template, manually enter every number, design the layout yourself, and export it. It's built for infographics and reports, not quick metric cards. With GROAR, you pick a template, your data is auto-filled, and you export in seconds.",
  },
  {
    question: "Is GROAR cheaper than Piktochart?",
    answer: "Yes. GROAR Pro starts at $5/month (or a one-time payment for lifetime access). Piktochart Pro is $14/month. And with GROAR, your metrics are auto-imported — no manual work.",
  },
  {
    question: "Do I need design skills to use GROAR?",
    answer: "No. GROAR templates are ready to use — pick one, choose a background, export. No drag-and-drop editing, no element positioning, no font matching. If you can click a button, you can create a metric visual.",
  },
  {
    question: "When should I use Piktochart instead of GROAR?",
    answer: "Use Piktochart when you need to create detailed infographics, multi-page reports, presentations, or printable materials. It's a powerful visual content tool for long-form design work. Use GROAR when you want to share your growth metrics on social media quickly.",
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
    { "@type": "ListItem", position: 2, name: "GROAR vs Piktochart", item: "https://groar.app/vs/piktochart" },
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

export default function VsPiktochartPage() {
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
              GROAR vs Piktochart for metrics visuals
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Piktochart is a powerful infographic maker for reports and presentations.
              <br /><br />
              GROAR is built for one thing: turning your metrics into shareable visuals — in 10 seconds, zero design skills required.
            </p>
          </header>

          <VsBeforeAfter competitor="Piktochart" />

          {/* TL;DR */}
          <section className="rounded-2xl border-fade p-6 md:p-8 mb-12 md:mb-16">
            <h2 className="text-lg font-semibold mb-3">TL;DR</h2>
            <p className="text-muted-foreground leading-relaxed">
              Need detailed infographics, reports, or presentations? <strong className="text-foreground">Piktochart is great</strong> for that.
              <br className="hidden sm:block" /><br className="hidden sm:block" />
              Want to share your growth metrics on social media in seconds? <strong className="text-foreground">GROAR is purpose-built for that</strong> — connect your accounts, pick a template, export. Done.
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
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-center w-28">Piktochart</th>
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
            <h2 className="text-2xl font-bold">Why creators pick GROAR over Piktochart for metrics</h2>

            <div>
              <h3 className="text-lg font-semibold mb-2">Built for metrics, not infographics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Piktochart is designed for creating infographics, reports, and presentations. It&apos;s a canvas-based editor where you drag, drop, and design from scratch or adapt templates.
                <br /><br />
                GROAR skips all of that. Pick a template (metrics, milestone, progress, or list), enter your numbers, choose a background — done. Every template is specifically designed for social media sharing.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Your data, auto-filled</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect your X account or Stripe (via TrustMRR), and your followers, MRR, revenue, and other metrics are automatically populated. No typing, no copy-pasting from dashboards.
                <br /><br />
                Piktochart has no account integrations for social metrics — every number has to be entered manually.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">10 seconds vs 15 minutes</h3>
              <p className="text-muted-foreground leading-relaxed">
                GROAR&apos;s workflow is: pick template, customize, export. Under 10 seconds. The output is a high-quality PNG optimized for social feeds, auto-copied to your clipboard, with a direct &ldquo;Share to X&rdquo; button.
                <br /><br />
                With Piktochart, you&apos;re in a full design editor — positioning elements, adjusting fonts, resizing text boxes. Great for a report, overkill for a metric post.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">3x cheaper</h3>
              <p className="text-muted-foreground leading-relaxed">
                GROAR Pro is $5/month or a one-time lifetime payment. Piktochart Pro starts at $14/month — and you still have to do all the design work yourself.
              </p>
            </div>
          </section>

          {/* When to use Piktochart */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-4">When Piktochart is the better choice</h2>
            <p className="text-muted-foreground leading-relaxed">
              Piktochart shines for detailed infographics, multi-page reports, presentations, and printable materials. If you need to create a data-rich visual report for stakeholders or a long-form infographic for your blog, Piktochart is the right tool.
              <br /><br />
              GROAR doesn&apos;t try to replace it — it&apos;s built for the specific moment when you want to share your metrics on social media and make people stop scrolling.
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
              <Link href="/vs/canva" className="underline hover:text-foreground transition-colors">
                GROAR vs Canva
              </Link>{" "}&middot;{" "}
              <Link href="/vs/screenshots" className="underline hover:text-foreground transition-colors">
                GROAR vs Screenshots
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
