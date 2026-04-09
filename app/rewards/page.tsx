import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import VsCta from "@/components/VsCta";

export const metadata: Metadata = {
  title: "Rewards Program — Get Paid to Share GROAR",
  description:
    "Earn rewards by sharing GROAR. Get reposted, get refunded, earn 30% affiliate commission on every sale.",
  alternates: { canonical: "/rewards" },
  openGraph: {
    title: "Rewards Program — Get Paid to Share GROAR",
    description:
      "Earn rewards by sharing GROAR. Get reposted, get refunded, earn 30% affiliate commission on every sale.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Groar Rewards" }],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://groar.app" },
    { "@type": "ListItem", position: 2, name: "Rewards Program", item: "https://groar.app/rewards" },
  ],
};

export default function RewardsPage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main className="flex-1 py-8 mt-4 md:mt-10">
        <article className="max-w-2xl mx-auto">
          {/* Hero */}
          <header className="text-center mb-14 md:mb-20">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-[1.3] md:leading-[1.15] mb-4 text-balance">
              Rewards program
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto text-balance">
              Three ways to earn by spreading the word about 🐯 GROAR.
            </p>
          </header>

          {/* ─── 1. Affiliate ─── */}
          <section className="mb-14 md:mb-20">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold shrink-0">1</span>
              <h2 className="text-xl md:text-2xl font-bold">Affiliate program</h2>
            </div>
            <div className="rounded-2xl border border-border p-5 md:p-6">
              <p className="text-muted-foreground text-sm mb-4">
                Share your unique referral link and earn <span className="text-foreground font-semibold">30% commission</span> on every 🐯 GROAR sale. Monthly and lifetime plans included.
              </p>
              <Button asChild variant="default" size="lg">
                <a href="https://affiliates.creem.io/join/early-affiliate-program" target="_blank" rel="noopener noreferrer">
                  Get your affiliate link
                </a>
              </Button>
            </div>
          </section>

          {/* ─── 2. Repost ─── */}
          <section className="mb-14 md:mb-20">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold shrink-0">2</span>
              <h2 className="text-xl md:text-2xl font-bold">Post on X with 🐯 GROAR, get reposted</h2>
            </div>
            <div className="rounded-2xl border border-border p-5 md:p-6">
              <p className="text-muted-foreground text-sm mb-2">
                Create a visual with your Pro account (or free trial), share it on X, and tag{" "}
                <a href="https://x.com/yannick_ferire" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@yannick_ferire</a>.
              </p>
              <p className="text-foreground text-sm font-medium">
                I repost every single one. No conditions, no minimum followers.
              </p>
            </div>
          </section>

          {/* ─── 3. Dedicated post ─── */}
          <section className="mb-14 md:mb-20">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold shrink-0">3</span>
              <h2 className="text-xl md:text-2xl font-bold">Talk about 🐯 GROAR, get paid</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Write a post on X about your experience with 🐯 GROAR and how it helps you boost engagement on your posts. Tag{" "}
              <a href="https://x.com/yannick_ferire" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@yannick_ferire</a>.
              The more reach you get, the bigger the reward:
            </p>
            <div className="space-y-3">
              {/* Tier: repost */}
              <div className="rounded-2xl border border-border p-5 flex items-center gap-4">
                <span className="text-2xl shrink-0">🔁</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Any dedicated post</p>
                  <p className="text-muted-foreground text-xs mt-0.5">I&apos;ll repost you to my audience</p>
                </div>
              </div>

              {/* Tier: 5K impressions */}
              <div className="rounded-2xl border border-border p-5 flex items-center gap-4">
                <span className="text-2xl shrink-0">🎯</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">5,000+ impressions</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Lifetime users: full refund. Monthly users: 1 month free.</p>
                </div>
              </div>

              {/* Tier: 50K impressions */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
                <span className="text-2xl shrink-0">🚀</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">50,000+ impressions</p>
                  <p className="text-muted-foreground text-xs mt-0.5">$50 cash reward on top</p>
                </div>
              </div>
            </div>
          </section>

          {/* How to claim */}
          <section className="rounded-2xl border-fade p-6 md:p-8 mb-12 md:mb-16">
            <h2 className="text-lg font-semibold mb-3">How to claim</h2>
            <ol className="text-muted-foreground space-y-2 text-sm list-decimal list-inside">
              <li>Post on X with a 🐯 GROAR visual or about your experience with GROAR</li>
              <li>Tag <a href="https://x.com/yannick_ferire" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@yannick_ferire</a></li>
              <li>For the 5K/50K rewards: DM me with a screenshot once you hit the threshold</li>
              <li>I&apos;ll verify and send your reward within 48h</li>
            </ol>
          </section>

          {/* CTA */}
          <VsCta />
        </article>
      </main>
      <Footer />
    </div>
  );
}
