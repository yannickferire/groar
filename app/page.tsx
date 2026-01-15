import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/Hero";
import Editor from "@/components/Editor";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen px-4 gap-12">
      <Header />
      <main className="flex-1 flex flex-col gap-12">
        <Hero />
        <Editor />
      </main>
      <Footer />
    </div>
  );
}
