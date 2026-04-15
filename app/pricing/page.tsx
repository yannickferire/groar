import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CommunityHighlights from "@/components/CommunityHighlights";
import VsFaq from "@/components/VsFaq";
import { faqs } from "@/lib/faqs";
import PricingClient from "./client";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-8 md:py-16 mt-4 gap-24">
        <PricingClient>
          <Suspense>
            <CommunityHighlights />
          </Suspense>

          <section className="w-full max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
            <VsFaq faqs={faqs} />
          </section>
        </PricingClient>
      </main>
      <Footer />
    </div>
  );
}
