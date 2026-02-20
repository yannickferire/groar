import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/Hero";
import GlobalStats from "@/components/GlobalStats";
import Editor from "@/components/Editor";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Groar",
  url: "https://groar.app",
  description:
    "Turn your social media metrics into beautiful, shareable visuals. Track your growth and showcase your wins.",
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
        name: "Agency",
        price: "19",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "19",
          priceCurrency: "USD",
          unitText: "MONTH",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitCode: "MON",
          },
        },
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
      <Header />
      <main className="flex-1 flex flex-col gap-10 md:gap-24 mt-6 md:mt-16">
        <Hero />
        <GlobalStats />
        <Suspense>
          <Editor />
        </Suspense>
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
