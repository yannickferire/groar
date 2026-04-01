import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VsCta from "@/components/VsCta";
import VsFaq from "@/components/VsFaq";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import CommunityHighlights from "@/components/CommunityHighlights";
import CopyButton from "@/components/milestone/CopyButton";
import MilestoneCard from "@/components/milestone/MilestoneCard";
import {
  MILESTONE_PAGES,
  getMilestoneBySlug,
  getMilestonesByCategory,
  getNextMilestonePage,
  getPrevMilestonePage,
  CATEGORY_LABELS,
} from "@/lib/milestone-pages";
import type { MilestonePageData } from "@/lib/milestone-pages";
import { PLATFORMS, PLATFORM_INFO } from "@/lib/milestone-platform-content";

// ─── Static params ──────────────────────────────────────────────────
// Only pre-render base pages at build time; platform variants are generated on-demand and cached via ISR
export function generateStaticParams() {
  return MILESTONE_PAGES.filter((m) => !m.slug.includes("-on-")).map((m) => ({ slug: m.slug }));
}

export const dynamicParams = true;
export const revalidate = 86400; // re-check once per day

// ─── Metadata ───────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getMilestoneBySlug(slug);
  if (!page) return {};

  const ogImage = `/api/card?template=milestone&m1=${page.metricType}:${page.value}&bg=${page.cardParams.bg}&color=${encodeURIComponent(page.cardParams.color)}&font=${page.cardParams.font}&emoji=${encodeURIComponent(page.cardParams.emoji)}&emojiCount=${page.cardParams.emojiCount}&handle=${encodeURIComponent("@yannick_ferire")}`;

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: `/milestone/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: page.headline }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [ogImage],
    },
  };
}

// ─── Page ───────────────────────────────────────────────────────────

export default async function MilestonePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getMilestoneBySlug(slug);
  if (!page) notFound();

  const prev = getPrevMilestonePage(page.slug);
  const next = getNextMilestonePage(page.slug);
  const categoryLabel = CATEGORY_LABELS[page.category];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://groar.app" },
      { "@type": "ListItem", position: 2, name: "Milestones", item: "https://groar.app/milestone" },
      { "@type": "ListItem", position: 3, name: page.headline, item: `https://groar.app/milestone/${page.slug}` },
    ],
  };

  const cardImageUrl = `/api/card?template=milestone&m1=${page.metricType}:${page.value}&bg=${page.cardParams.bg}&color=${encodeURIComponent(page.cardParams.color)}&font=${page.cardParams.font}&emoji=${encodeURIComponent(page.cardParams.emoji)}&emojiCount=${page.cardParams.emojiCount}&handle=${encodeURIComponent("@yannick_ferire")}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.headline,
    description: page.description,
    image: `https://groar.app${cardImageUrl}`,
    author: { "@type": "Organization", name: "GROAR", url: "https://groar.app" },
    publisher: { "@type": "Organization", name: "GROAR", url: "https://groar.app" },
    datePublished: "2026-04-01",
    dateModified: "2026-04-01",
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://groar.app/milestone/${page.slug}` },
  };

  return (
    <div className="flex flex-col min-h-screen px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
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
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6">
            <Link href="/milestone" className="hover:text-foreground transition-colors">Milestones</Link>
            <span className="mx-2">/</span>
            <span>{page.shortValue} {categoryLabel}</span>
          </nav>

          {/* Hero */}
          <header className="mb-10 md:mb-14">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-balance">{page.headline}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{page.intro}</p>
          </header>

          {/* Card preview */}
          <section className="mb-12 md:mb-16">
            <MilestoneCard
              src={cardImageUrl}
              alt={`${page.shortValue} ${categoryLabel} milestone card`}
            />
            <p className="text-sm text-muted-foreground text-center mt-3">
              Example milestone card —{" "}
              <Link href="/login?callbackUrl=%2Fdashboard%3Ftrial%3Dstart" className="underline hover:text-foreground transition-colors">
                create yours in under 10 seconds
              </Link>
            </p>
          </section>

          {/* What it means */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-4">What {page.shortValue} {categoryLabel.toLowerCase()} means</h2>
            <p className="text-muted-foreground leading-relaxed">{page.whatItMeans}</p>
          </section>

          {/* Tips */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-4">Tips for your {page.shortValue} {categoryLabel.toLowerCase()} milestone post</h2>
            <ul className="space-y-3">
              {page.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-muted-foreground">
                  <span className="text-foreground font-semibold shrink-0">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA mid */}
          <VsCta title={`Create your ${page.shortValue} ${categoryLabel.toLowerCase()} card`} />

          {/* Caption ideas */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-6">Post ideas</h2>
            <div className="space-y-4">
              {page.captionIdeas.map((caption, i) => (
                <div key={i} className="rounded-xl border border-border p-4 flex items-start gap-3">
                  <p className="text-sm text-muted-foreground flex-1 leading-relaxed whitespace-pre-line">{caption}</p>
                  <CopyButton text={caption} />
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <div className="mb-12 md:mb-16">
            <HowItWorks />
          </div>

          {/* CTA create */}
          <VsCta title="Ready to celebrate your milestone?" />
        </article>

        {/* Testimonials — full width */}
        <div className="py-12 md:py-16">
          <Testimonials />
        </div>

        {/* Community highlights */}
        <div className="py-12 md:py-16">
          <CommunityHighlights />
        </div>

        <article className="max-w-3xl mx-auto">

          {/* FAQ */}
          {page.faqs.length > 0 && (
            <section className="mb-12 md:mb-16">
              <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
              <VsFaq faqs={page.faqs} />
            </section>
          )}

          {/* Prev / Next navigation */}
          <nav className="mb-12 md:mb-16 flex items-center justify-between gap-4">
            {prev ? (
              <Link href={`/milestone/${prev.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← {prev.shortValue} {CATEGORY_LABELS[prev.category]}
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/milestone/${next.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {next.shortValue} {CATEGORY_LABELS[next.category]} →
              </Link>
            ) : <span />}
          </nav>

          {/* Platform links (only on base pages) */}
          {!page.slug.includes("-on-") && (
            <section className="mb-12 md:mb-16 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Get platform-specific tips for this milestone:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {PLATFORMS.map((pl) => (
                  <Link
                    key={pl}
                    href={`/milestone/${page.slug}-on-${PLATFORM_INFO[pl].slug}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-foreground/20 hover:bg-muted/30 transition-colors"
                  >
                    {PLATFORM_INFO[pl].shortName}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Hub link */}
          <section className="mb-12 md:mb-16 text-center">
            <Link href="/milestone" className="text-sm text-muted-foreground underline hover:text-foreground transition-colors">
              Browse all milestones
            </Link>
          </section>

          {/* CTA bottom */}
          <VsCta />
        </article>
      </main>
      <Footer />
    </div>
  );
}

