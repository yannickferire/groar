import type { Metadata } from "next";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VsCta from "@/components/VsCta";
import VsFaq from "@/components/VsFaq";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "🐯 GROAR vs Canva — Best Tool for X Metrics Visuals",
  description:
    "Compare GROAR and Canva for creating X (Twitter) metrics visuals. See why creators choose GROAR to turn their analytics into shareable images in seconds.",
  alternates: { canonical: "/vs/canva" },
  openGraph: {
    title: "🐯 GROAR vs Canva — Best Tool for X Metrics Visuals",
    description:
      "Compare GROAR and Canva for creating X (Twitter) metrics visuals. See why creators choose GROAR to turn their analytics into shareable images in seconds.",
  },
};

type Feature = {
  name: string;
  groar: boolean | string;
  competitor: boolean | string;
};

const features: Feature[] = [
  { name: "Built for X metrics visuals", groar: true, competitor: false },
  { name: "Connect your X account", groar: true, competitor: false },
  { name: "Auto-import followers, following, posts", groar: true, competitor: false },
  { name: "One-click metric cards", groar: true, competitor: false },
  { name: "Templates optimized for X engagement", groar: true, competitor: false },
  { name: "Export ready for social sharing", groar: true, competitor: true },
  { name: "Custom backgrounds", groar: true, competitor: true },
  { name: "General-purpose design", groar: false, competitor: true },
  { name: "Presentations & documents", groar: false, competitor: true },
  { name: "Video editing", groar: false, competitor: true },
  { name: "Free plan", groar: true, competitor: true },
  { name: "Starting price", groar: "$5/mo", competitor: "$15/mo" },
];

const faqs = [
  {
    question: "What is the main difference between GROAR and Canva?",
    answer: "GROAR is purpose-built for turning your X (Twitter) metrics into shareable visuals — it connects to your account and auto-imports your data. Canva is a general-purpose design tool where you create everything manually from scratch.",
  },
  {
    question: "Is GROAR free to use?",
    answer: "Yes, GROAR has a free plan that includes full access to the editor, 3 exports per week, and 5 backgrounds. The Pro plan at $5/month unlocks unlimited exports, all backgrounds, and removes the watermark.",
  },
  {
    question: "Can I use GROAR to create visuals for X (Twitter)?",
    answer: "Absolutely — that's exactly what GROAR is built for. Connect your X account, pick a ready-to-use template, and your metric visual is ready to export in under 10 seconds. GROAR automatically pulls your followers, following, and post count.",
  },
  {
    question: "How much does GROAR cost compared to Canva?",
    answer: "GROAR Pro is $5/month. Canva Pro starts at $15/month — that's 3x more expensive. And with Canva, you still have to design everything yourself, while GROAR gives you ready-to-export metric visuals in seconds.",
  },
  {
    question: "Do I need design skills to use GROAR?",
    answer: "No. GROAR is designed so anyone can create professional metric visuals without any design experience. Pick a template, choose a background, and export — that's it.",
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
    { "@type": "ListItem", position: 2, name: "GROAR vs Canva", item: "https://groar.app/vs/canva" },
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

export default function VsCanvaPage() {
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
            <h1 className="flex items-center justify-center gap-3 sm:gap-4 mb-4">
              <Image
                src="/groar-logo.png"
                alt="Groar"
                width={180}
                height={48}
                className="h-auto w-28 sm:w-36 md:w-44"
              />
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-muted-foreground/40">vs</span>
              <Image
                src="/logos/canva-logo.svg"
                alt="Canva"
                width={80}
                height={30}
                className="h-auto w-20 sm:w-24 md:w-28"
              />
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              GROAR gives you ready-to-use templates to turn your X (Twitter) metrics into shareable visuals — in under 10 seconds, zero design skills required.
              <br /><br />
              Canva is a powerful all-in-one design tool, but you have to build everything from scratch.
            </p>
          </header>

          {/* TL;DR */}
          <section className="rounded-2xl border-fade p-6 md:p-8 mb-12 md:mb-16">
            <h2 className="text-lg font-semibold mb-3">TL;DR</h2>
            <p className="text-muted-foreground leading-relaxed">
              Want to grow on X by sharing your milestones? <strong className="text-foreground">GROAR has ready-to-use templates</strong> — connect your X account, pick a template, export. Under 10 seconds, no design skills needed.
              <br className="hidden sm:block" /><br className="hidden sm:block" />
              Need a general design tool for presentations, videos, or marketing assets? <strong className="text-foreground">Canva is great</strong> for that.
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
                    <th className="px-4 py-3 text-sm font-bold text-center w-28">🐯 GROAR</th>
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-center w-28">Canva</th>
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
            <h2 className="text-2xl font-bold">Why creators pick 🐯 GROAR over Canva for metrics</h2>

            <div>
              <h3 className="text-lg font-semibold mb-2">Your X data, connected</h3>
              <p className="text-muted-foreground leading-relaxed">
                GROAR connects directly to your X account — your followers, following count, and posts flow in automatically. No manual typing, no screenshots, no copy-paste.
                <br /><br />
                With Canva, you&apos;d have to create everything from scratch and type every number yourself.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Ready-to-use templates that grow your audience</h3>
              <p className="text-muted-foreground leading-relaxed">
                GROAR templates are ready-to-use and specifically designed for X milestone posts — the kind that get likes, retweets, and replies. Pick one, and your visual is done. No resizing, no font tweaking, no color matching. Every layout is optimized for the feed and built to help you grow.
                <br /><br />
                Canva templates are generic and designed for a hundred different use cases — you still have to customize everything yourself.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Under 10 seconds, not 15 minutes</h3>
              <p className="text-muted-foreground leading-relaxed">
                With GROAR: pick a template, choose your background, export. Done in under 10 seconds. No design skills, no learning curve — if you can click a button, you can create a metric visual.
                <br /><br />
                With Canva, you start from a blank canvas, pick a template, resize elements, tweak fonts, and manually enter your data. That&apos;s 15 minutes of design work every time you want to post.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">3x cheaper</h3>
              <p className="text-muted-foreground leading-relaxed">
                GROAR Pro is $5/month and includes everything you need: unlimited exports, premium backgrounds, and no watermark.
                <br /><br />
                Canva Pro starts at $15/month — and you still have to do all the design work yourself.
              </p>
            </div>
          </section>

          {/* When to use Canva */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-4">When Canva is the better choice</h2>
            <p className="text-muted-foreground leading-relaxed">
              Canva excels at general-purpose design. If you need to create presentations, edit videos, design logos, or build marketing assets from scratch, Canva is the right tool.
              <br /><br />
              GROAR doesn&apos;t try to replace it — it complements it for the specific use case of turning your X analytics into shareable visuals that drive engagement. Many creators use both: Canva for their brand assets and GROAR for their metric posts.
            </p>
          </section>

          {/* FAQ */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
            <VsFaq faqs={faqs} />
          </section>

          {/* CTA — hidden if logged in */}
          <VsCta />
        </article>
      </main>
      <Footer />
    </div>
  );
}
