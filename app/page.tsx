import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/Hero";

import Editor from "@/components/Editor";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import ProofSection from "@/components/ProofSection";
import Testimonials from "@/components/Testimonials";
import VsFaq from "@/components/VsFaq";
import { faqs } from "@/lib/faqs";

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
    "Your X (Twitter) analytics deserve better than a screenshot. Create eye-catching visuals of your milestones, growth metrics and wins in 10 seconds. Built for creators who build in public.",
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
            Want to see how GROAR compares to other tools? Check out{" "}
            <Link href="/vs/canva" className="underline hover:text-foreground transition-colors">
              GROAR vs Canva
            </Link>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
