import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Free & Pro Plans",
  description:
    "Simple, transparent pricing. Create stunning growth visuals for free or unlock unlimited exports, analytics dashboard & custom branding with Pro — from $5/mo or $19 lifetime.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Groar Pricing — Free & Pro Plans",
    description:
      "Create stunning growth visuals for free or unlock unlimited exports, analytics dashboard & custom branding with Pro — from $5/mo or $19 lifetime.",
  },
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
        description: "Full access to the editor, 1 export per week, 5 backgrounds, Groar watermark",
      },
      {
        "@type": "Offer",
        name: "Pro (Monthly)",
        price: "5",
        priceCurrency: "USD",
        description: "Unlimited exports, unlimited backgrounds, no watermark",
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
        name: "Pro (Lifetime)",
        price: "19",
        priceCurrency: "USD",
        description: "Everything in Pro, one-time payment, lifetime access",
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
