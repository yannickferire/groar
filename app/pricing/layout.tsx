import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for Groar. Choose Free, Pro, or Agency plans to turn your social metrics into shareable visuals.",
  alternates: { canonical: "/pricing" },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Groar Pricing",
  description: "Simple, transparent pricing for Groar.",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://groar.app" },
      { "@type": "ListItem", position: 2, name: "Pricing", item: "https://groar.app/pricing" },
    ],
  },
  mainEntity: {
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
        description: "Full access to the editor, 3 exports per week, 5 backgrounds, Groar watermark",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "5",
        priceCurrency: "USD",
        description: "Unlimited exports, unlimited backgrounds, no watermark, connect 2 accounts per platform",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "5",
          priceCurrency: "USD",
          unitText: "MONTH",
          referenceQuantity: { "@type": "QuantitativeValue", value: "1", unitCode: "MON" },
        },
      },
      {
        "@type": "Offer",
        name: "Agency",
        price: "19",
        priceCurrency: "USD",
        description: "Everything in Pro, connect 10 accounts per platform, brand presets per client, priority support",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "19",
          priceCurrency: "USD",
          unitText: "MONTH",
          referenceQuantity: { "@type": "QuantitativeValue", value: "1", unitCode: "MON" },
        },
      },
    ],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      {children}
    </>
  );
}
