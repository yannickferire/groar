import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/Hero";

import Editor from "@/components/Editor";
import HowItWorks from "@/components/HowItWorks";
import ProofSection from "@/components/ProofSection";
import { faqs } from "@/lib/faqs";

const Testimonials = dynamic(() => import("@/components/Testimonials"));
const Pricing = dynamic(() => import("@/components/Pricing"));
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
  ],
  screenshot: "https://groar.app/og-image.png",
  author: {
    "@type": "Person",
    name: "Yannick Ferire",
    url: "https://x.com/yannick_ferire",
  },
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <main className="flex-1 flex flex-col gap-10 md:gap-24 mt-6 md:mt-16 overflow-x-hidden">
        <Hero />
        <Suspense fallback={null}>
          <Editor />
        </Suspense>
        <ProofSection />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <section className="max-w-3xl mx-auto w-full mt-4">
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
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
