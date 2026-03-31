import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CommunityHighlights from "@/components/CommunityHighlights";
import VsFaq from "@/components/VsFaq";
import { faqs } from "@/lib/faqs";
import PricingClient from "./client";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
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
