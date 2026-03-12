import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VsCta from "@/components/VsCta";
import VsFaq from "@/components/VsFaq";
import Testimonials from "@/components/Testimonials";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "Best Build in Public Tools for Sharing Growth Metrics",
  description:
    "Build in public? GROAR turns your growth metrics into eye-catching visuals for X and social media. Share milestones, MRR, followers, and more in 10 seconds.",
  alternates: { canonical: "/vs/build-in-public" },
  openGraph: {
    title: "Best Build in Public Tools for Sharing Growth Metrics",
    description:
      "Build in public? GROAR turns your growth metrics into eye-catching visuals for X and social media. Share milestones, MRR, followers, and more in 10 seconds.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Groar" }],
  },
};

type Feature = {
  name: string;
  groar: boolean | string;
  competitor: boolean | string;
};

const features: Feature[] = [
  { name: "Purpose-built for growth metrics", groar: true, competitor: false },
  { name: "Auto-import from X, GitHub, Reddit", groar: true, competitor: false },
  { name: "MRR & revenue from Stripe (via TrustMRR)", groar: true, competitor: false },
  { name: "Ready-to-use milestone templates", groar: true, competitor: false },
  { name: "Optimized for social media feeds", groar: true, competitor: false },
  { name: "Custom backgrounds & branding", groar: true, competitor: false },
  { name: "Consistent visual identity", groar: true, competitor: false },
  { name: "Ready in 10 seconds", groar: true, competitor: false },
  { name: "Free to start", groar: true, competitor: true },
  { name: "Design skills needed", groar: "None", competitor: "Canva/Figma/etc." },
];

const faqs = [
  {
    question: "What is build in public?",
    answer: "Build in public is a movement where founders, indie hackers, and creators share their journey transparently: revenue, users, lessons, failures. It builds trust, attracts customers, and creates a community around your product.",
  },
  {
    question: "How does GROAR help with building in public?",
    answer: "GROAR auto-imports your metrics from X, GitHub, Reddit, and Stripe, and gives you ready-to-use templates for milestone posts, metric updates, and progress shares. You create professional visuals in 10 seconds instead of spending time in design tools.",
  },
  {
    question: "What metrics can I share with GROAR?",
    answer: "Followers, posts, engagement (from X), stars, repos (from GitHub), karma, posts (from Reddit), MRR, revenue, customers (from Stripe via TrustMRR). Plus you can enter any custom metric manually.",
  },
  {
    question: "Is GROAR free for build in public creators?",
    answer: "Yes. The free plan includes full editor access, 3 exports per week, and 5 backgrounds. Pro starts at $5/month (or a one-time lifetime payment) for unlimited exports, all backgrounds, and no watermark.",
  },
  {
    question: "Do I need design skills?",
    answer: "No. Every template is pre-designed and optimized for social media. Pick a template, enter your numbers (or let them auto-fill), choose a background, export. If you can tweet, you can use GROAR.",
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
    { "@type": "ListItem", position: 2, name: "Build in Public Tools", item: "https://groar.app/vs/build-in-public" },
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

export default function VsBuildInPublicPage() {
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
              The build in public visual toolkit
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Building in public means sharing your journey. But screenshots of dashboards don&apos;t cut it anymore.
              <br /><br />
              GROAR turns your metrics into shareable visuals that get engagement and grow your audience.
            </p>
          </header>

          {/* TL;DR */}
          <section className="rounded-2xl border-fade p-6 md:p-8 mb-12 md:mb-16">
            <h2 className="text-lg font-semibold mb-3">TL;DR</h2>
            <p className="text-muted-foreground leading-relaxed">
              Building in public? You need to share milestones, revenue updates, and follower growth regularly. <strong className="text-foreground">GROAR auto-imports your metrics from X, GitHub, Reddit, and Stripe (via TrustMRR)</strong> and gives you ready-to-use templates — export in 10 seconds, zero design skills needed.
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
                    <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-center w-32">Manual sharing</th>
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
            <h2 className="text-2xl font-bold">Why builders choose GROAR</h2>

            <div>
              <h3 className="text-lg font-semibold mb-2">Share milestones that stop the scroll</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you hit 1K followers, $1K MRR, or 100 GitHub stars, you want to celebrate. A plain text tweet gets lost. A branded visual with your metrics front and center gets 3-5x more engagement.
                <br /><br />
                GROAR templates are designed specifically for milestone posts.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Your metrics, auto-imported</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect your X account and Stripe (via TrustMRR), and your followers, MRR, revenue, customers are automatically filled in. No screenshots, no manual typing, no spreadsheets.
                <br /><br />
                Your data flows directly into designed templates.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Consistent brand, zero effort</h3>
              <p className="text-muted-foreground leading-relaxed">
                Build in public is a long game. When your posts have a consistent, recognizable visual style, people start associating your brand with growth.
                <br /><br />
                GROAR ensures every metric post looks professional and on-brand, automatically.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">10 seconds, not 10 minutes</h3>
              <p className="text-muted-foreground leading-relaxed">
                No Canva. No Figma. No &ldquo;let me just quickly design something.&rdquo; Pick a template, choose a background, export. Your visual is ready before you finish writing the tweet.
              </p>
            </div>
          </section>

          {/* When other tools are better */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-4">When other tools are better</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you need detailed infographics, presentations, or custom designs, tools like Canva or Figma are better suited. If you need chart APIs for automated reports, Image-Charts works. GROAR is specifically built for the moment you want to share your growth on social media and get engagement.
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
