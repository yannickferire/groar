import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "GROAR Affiliate Program — Earn 40% Commission",
  description:
    "Join the GROAR affiliate program and earn 40% commission on every sale you refer — monthly and lifetime plans included.",
  alternates: { canonical: "/affiliate" },
  openGraph: {
    title: "GROAR Affiliate Program — Earn 40% Commission",
    description:
      "Join the GROAR affiliate program and earn 40% commission on every sale you refer — monthly and lifetime plans included.",
  },
};

const steps = [
  {
    number: "1",
    title: "Apply",
    description: "Send a quick email and we'll get you set up with your unique referral link.",
  },
  {
    number: "2",
    title: "Share GROAR",
    description: "Share your link with your audience, on X, in your newsletter, or wherever you talk about tools.",
  },
  {
    number: "3",
    title: "Earn 40%",
    description: "Every time someone subscribes through your link, you earn 40% of the sale. Monthly or lifetime.",
  },
];

export default function AffiliatePage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 py-8 mt-4 md:mt-10">
        <article className="max-w-2xl mx-auto">
          {/* Hero */}
          <header className="text-center mb-12 md:mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-[1.3] md:leading-[1.15] mb-4 text-balance">
              Earn 40% on every sale
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto text-balance">
              Recommend GROAR to your audience and earn a commission on every subscription — monthly and lifetime.
            </p>
          </header>

          {/* Key numbers */}
          <section className="grid grid-cols-3 gap-4 mb-12 md:mb-16">
            <div className="text-center rounded-2xl border border-border p-4 md:p-6">
              <p className="text-2xl md:text-3xl font-bold">40%</p>
              <p className="text-sm text-muted-foreground mt-1">Commission</p>
            </div>
            <div className="text-center rounded-2xl border border-border p-4 md:p-6">
              <p className="text-2xl md:text-3xl font-bold">180 days</p>
              <p className="text-sm text-muted-foreground mt-1">Cookie duration</p>
            </div>
            <div className="text-center rounded-2xl border border-border p-4 md:p-6">
              <p className="text-2xl md:text-3xl font-bold">All plans</p>
              <p className="text-sm text-muted-foreground mt-1">Monthly & lifetime</p>
            </div>
          </section>

          {/* How it works */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">How it works</h2>
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4 items-start">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Who it's for */}
          <section className="rounded-2xl border-fade p-6 md:p-8 mb-12 md:mb-16">
            <h2 className="text-lg font-semibold mb-3">Perfect for</h2>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>Indie hackers and build-in-public creators who share tools with their audience</li>
              <li>Newsletter writers covering SaaS, productivity, or creator tools</li>
              <li>Content creators on X, YouTube, or TikTok in the startup space</li>
              <li>Anyone who loves GROAR and wants to earn by recommending it</li>
            </ul>
          </section>

          {/* CTA */}
          <section className="text-center mb-12 md:mb-16">
            <a
              href="mailto:yannick@groar.app?subject=I want to join the GROAR affiliate program"
              className="inline-flex items-center justify-center rounded-full bg-foreground text-background font-semibold px-8 py-3 text-base hover:opacity-90 transition-opacity"
            >
              Apply to become an affiliate
            </a>
            <p className="text-sm text-muted-foreground mt-3">
              Free to join. No minimum payouts. You get paid for every sale.
            </p>
          </section>

          {/* FAQ-like section */}
          <section className="mb-12 md:mb-16 space-y-6">
            <h2 className="text-2xl font-bold">Common questions</h2>

            <div>
              <h3 className="font-semibold mb-1">How do I get paid?</h3>
              <p className="text-muted-foreground text-sm">
                Payouts are handled through Creem (our payment platform). You can choose bank transfer or USDC. Payouts are processed regularly.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Do I earn on lifetime plans too?</h3>
              <p className="text-muted-foreground text-sm">
                Yes. You earn 40% on both monthly subscriptions and one-time lifetime purchases.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">How long does the cookie last?</h3>
              <p className="text-muted-foreground text-sm">
                180 days. If someone clicks your link and subscribes within 180 days, the sale is attributed to you.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Can I track my referrals?</h3>
              <p className="text-muted-foreground text-sm">
                Yes. You get access to a dashboard showing your clicks, conversions, and earnings in real time.
              </p>
            </div>
          </section>

          {/* Bottom link */}
          <p className="text-sm text-muted-foreground text-center">
            <Link href="/pricing" className="underline hover:text-foreground transition-colors">
              See pricing
            </Link>{" "}&middot;{" "}
            <Link href="/" className="underline hover:text-foreground transition-colors">
              Back to home
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
