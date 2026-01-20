import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/Hero";
import Editor from "@/components/Editor";
import HowItWorks from "@/components/HowItWorks";
import Premium from "@/components/Premium";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 flex flex-col gap-12 md:gap-16">
        <Hero />
        <Editor />
        <HowItWorks />
        <Premium />
      </main>
      <Footer />
    </div>
  );
}
