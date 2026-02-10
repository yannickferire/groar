import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/Hero";
import GlobalStats from "@/components/GlobalStats";
import Editor from "@/components/Editor";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 flex flex-col gap-16 md:gap-24">
        <Hero />
        <GlobalStats />
        <Editor />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
