import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VsCta from "@/components/VsCta";
import {
  getMilestonesByCategory,
  CATEGORY_LABELS,
} from "@/lib/milestone-pages";
import type { MilestoneCategory } from "@/lib/milestone-pages";

export const metadata: Metadata = {
  title: "Milestone Post Templates — Celebrate Your Growth with GROAR",
  description:
    "Browse milestone templates for followers, MRR, revenue, GitHub stars, and customers. Create professional milestone visuals for your social media posts in seconds.",
  keywords: [
    "milestone post template",
    "celebrate milestone",
    "growth milestone visual",
    "followers milestone",
    "mrr milestone",
    "github stars milestone",
    "saas milestone",
  ],
  alternates: { canonical: "/milestone" },
  openGraph: {
    title: "Milestone Post Templates — Celebrate Your Growth with GROAR",
    description:
      "Browse milestone templates for followers, MRR, revenue, GitHub stars, and customers. Create professional milestone visuals in seconds.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Groar Milestones" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Milestone Post Templates — Celebrate Your Growth with GROAR",
    description:
      "Browse milestone templates for followers, MRR, revenue, GitHub stars, and customers. Create professional milestone visuals in seconds.",
    images: ["/og.png"],
  },
};

const CATEGORIES: MilestoneCategory[] = ["followers", "mrr", "revenue", "github-stars", "customers"];

const CATEGORY_DESCRIPTIONS: Record<MilestoneCategory, string> = {
  followers: "Celebrate your X (Twitter) follower milestones with shareable visuals.",
  mrr: "Turn your monthly recurring revenue milestones into social proof.",
  revenue: "Share your total revenue milestones and inspire other builders.",
  "github-stars": "Show off your open source GitHub stars milestones.",
  customers: "Celebrate your growing customer base with professional visuals.",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://groar.app" },
    { "@type": "ListItem", position: 2, name: "Milestones", item: "https://groar.app/milestone" },
  ],
};

export default function MilestoneHubPage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main className="flex-1 py-8 mt-4 md:mt-10">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Milestone Post Templates</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Hit a growth milestone? Create a professional visual to celebrate and share it on social media — in under 10 seconds.
            </p>
          </header>

          <div className="space-y-12 md:space-y-16">
            {CATEGORIES.map((cat) => {
              const basePages = getMilestonesByCategory(cat).filter((p) => !p.slug.includes("-on-"));
              return (
                <section key={cat}>
                  <h2 className="text-2xl font-bold mb-2">{CATEGORY_LABELS[cat]} Milestones</h2>
                  <p className="text-muted-foreground mb-4">{CATEGORY_DESCRIPTIONS[cat]}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {basePages.map((page) => (
                      <Link
                        key={page.slug}
                        href={`/milestone/${page.slug}`}
                        className="rounded-xl border border-border p-4 text-center hover:border-foreground/20 hover:bg-muted/30 transition-colors"
                      >
                        <span className="text-xl md:text-2xl font-bold block">{page.shortValue}</span>
                        <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[page.category]}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>


          <VsCta title="Ready to celebrate your milestone?" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
