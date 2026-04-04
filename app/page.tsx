import dynamic from "next/dynamic";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/Hero";

import EditorShowcase from "@/components/EditorShowcase";
import DataFastFunnel from "@/components/DataFastFunnel";
import { Suspense } from "react";
import { faqs } from "@/lib/faqs";

const MetricsUniverse = dynamic(() => import("@/components/MetricsUniverse"));
const ProofSection = dynamic(() => import("@/components/ProofSection"));
const HowItWorks = dynamic(() => import("@/components/HowItWorks"));
const WhoItsFor = dynamic(() => import("@/components/WhoItsFor"));
const MadeBy = dynamic(() => import("@/components/MadeBy"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
const Pricing = dynamic(() => import("@/components/Pricing"));
const CommunityHighlights = dynamic(() => import("@/components/CommunityHighlights"));
const VsFaq = dynamic(() => import("@/components/VsFaq"));

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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Groar",
  url: "https://groar.app",
  description:
    "Your analytics deserve better than a screenshot. Create eye-catching visuals of your milestones, growth metrics and wins in 10 seconds. Built for creators who build in public.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "19",
    priceCurrency: "USD",
    offerCount: 3,
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "5",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "5",
          priceCurrency: "USD",
          unitText: "MONTH",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitCode: "MON",
          },
        },
      },
      {
        "@type": "Offer",
        name: "Pro (Lifetime)",
        price: "19",
        priceCurrency: "USD",
      },
    ],
  },
  featureList: [
    "Social media metrics visualization",
    "Beautiful shareable visuals",
    "Unlimited exports",
    "Custom backgrounds library",
    "No watermark",
    "Multi-account support",
    "Brand presets per client",
    "API for programmatic card generation",
  ],
  screenshot: "https://groar.app/og.png",
  author: {
    "@type": "Person",
    name: "Yannick Ferire",
    url: "https://x.com/yannick_ferire",
  },
};

export default async function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <DataFastFunnel />
      <main className="flex-1 flex flex-col gap-10 md:gap-16 mt-6 md:mt-10 overflow-x-hidden">
        <Hero />
        <EditorShowcase />
        <div className="relative z-50 flex flex-col">
        <div className="hidden [@media(min-width:1024px)_and_(min-height:600px)]:block h-72 bg-gradient-to-b from-transparent via-background/50 to-background [mask-image:radial-gradient(ellipse_90%_100%_at_50%_100%,black_50%,transparent_100%)]" />
        <div className="bg-background flex flex-col gap-10 md:gap-24 pt-8 md:pt-20">
        <MetricsUniverse />
        <ProofSection />
        <HowItWorks />
        <WhoItsFor />
        <MadeBy />
        <Testimonials />
        <Pricing />
        <Suspense>
          <CommunityHighlights />
        </Suspense>
        <section className="max-w-3xl mx-auto w-full mt-4 px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
          <VsFaq faqs={faqs} />
          <p className="text-sm text-muted-foreground mt-4 text-center">
            See how GROAR compares:{" "}
            <Link href="/vs/canva" className="underline hover:text-foreground transition-colors">
              vs Canva
            </Link>{", "}
            <Link href="/vs/screenshots" className="underline hover:text-foreground transition-colors">
              vs Screenshots
            </Link>{", "}
            <Link href="/vs/spreadsheets" className="underline hover:text-foreground transition-colors">
              vs Spreadsheets
            </Link>{", "}
            <Link href="/vs/build-in-public" className="underline hover:text-foreground transition-colors">
              Build in Public Tools
            </Link>{", or "}
            <Link href="/vs" className="underline hover:text-foreground transition-colors">
              all comparisons
            </Link>.
            {" "}Or browse our{" "}
            <Link href="/milestone" className="underline hover:text-foreground transition-colors">
              milestone post templates
            </Link>.
          </p>
        </section>
        <Footer />
        </div>
        </div>
      </main>
    </div>
  );
}
