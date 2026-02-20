import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/Hero";
import GlobalStats from "@/components/GlobalStats";
import Editor from "@/components/Editor";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import VsFaq from "@/components/VsFaq";

const faqs = [
  {
    question: "What is GROAR and why should I use it?",
    answer: "GROAR is a tool built specifically for X (Twitter) creators who want to turn their metrics into shareable visuals. Instead of spending time designing in generic tools like Canva, you pick a ready-to-use template, connect your X account, and your visual is ready to export in under 10 seconds. It's built to help you celebrate milestones and grow your audience.",
  },
  {
    question: "Is GROAR free to use?",
    answer: "Yes! GROAR has a free plan that gives you full access to the editor, 3 exports per week, and 5 backgrounds. If you want unlimited exports, all backgrounds, and no watermark, the Pro plan starts at $5/month.",
  },
  {
    question: "How long does it take to create a visual?",
    answer: "Under 10 seconds. Seriously. Pick a template, choose a background, and export. No design skills required, no learning curve. If you connect your X account, your followers, following, and post count are auto-imported — you don't even have to type them.",
  },
  {
    question: "What metrics can I display?",
    answer: "Right now, GROAR auto-imports your followers count, following count, and post count from your X account. You can also manually enter any custom metric. More automated metrics are coming soon.",
  },
  {
    question: "Do I need design skills to use GROAR?",
    answer: "Not at all. Every template is ready-to-use and optimized for X engagement. You don't need to resize anything, pick fonts, or match colors. Just pick a template and a background — GROAR handles the rest.",
  },
  {
    question: "How is GROAR different from Canva or other design tools?",
    answer: "Canva is a powerful general-purpose design tool, but you have to build everything from scratch. GROAR is purpose-built for X metrics visuals — it connects to your account, auto-imports your data, and gives you ready-to-export templates in seconds. It's 3x cheaper too ($5/mo vs $15/mo).",
  },
  {
    question: "Can I connect multiple X accounts?",
    answer: "Yes! The Pro plan lets you connect up to 2 accounts per platform, and the Agency plan supports up to 10. Perfect if you manage accounts for clients.",
  },
];

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
