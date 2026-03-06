import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Testimonials from "@/components/Testimonials";
import VsFaq from "@/components/VsFaq";
import { faqs } from "@/lib/faqs";
import { FadeInView } from "@/components/ui/motion";
import VsCta from "@/components/VsCta";
import PublicLeaderboardClient from "./client";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See who's leading the 🐯 GROAR community leaderboard.",
};

export default function PublicLeaderboardPage() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 flex flex-col items-center py-8 md:py-16 mt-4 md:mt-10">
        <FadeInView direction="up" distance={32}>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-4">
              Leaderboard
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto text-balance">
              Top 10 of the 🐯 GROAR community. Export visuals, log in daily, and climb the ranks.
            </p>
          </div>
        </FadeInView>

        <div className="w-full max-w-5xl">
          <PublicLeaderboardClient />
        </div>

        <div className="w-full max-w-3xl mt-12">
          <VsCta title="Want to join the leaderboard?" />
        </div>

        <div className="w-full mt-24">
          <Testimonials />
        </div>

        <section className="w-full max-w-3xl mt-24 mb-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
          <VsFaq faqs={faqs} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
