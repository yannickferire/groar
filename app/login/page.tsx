import dynamic from "next/dynamic";
import Link from "next/link";
import LoginForm from "./LoginForm";

const Testimonials = dynamic(() => import("@/components/Testimonials"));

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Login form - centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-20 md:py-28">
        <LoginForm />
      </div>

      {/* SEO content below the fold */}
      <div className="space-y-12 pb-16">
        {/* Testimonials - full width */}
        <Testimonials />

        {/* Value props + internal links */}
        <section className="text-center space-y-4 px-4">
          <h2 className="text-lg font-heading font-semibold text-muted-foreground">Turn your analytics into visuals that stand out</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto text-balance">
            GROAR helps creators, founders, and indie hackers create beautiful shareable visuals from their X, GitHub, Reddit and SaaS metrics. No design skills needed — pick your stats, choose a background, and export in seconds.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href="/" className="underline hover:text-foreground transition-colors">Home</Link>
            <Link href="/pricing" className="underline hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/vs/canva" className="underline hover:text-foreground transition-colors">GROAR vs Canva</Link>
            <Link href="/vs/screenshots" className="underline hover:text-foreground transition-colors">GROAR vs Screenshots</Link>
            <Link href="/terms" className="underline hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="underline hover:text-foreground transition-colors">Privacy</Link>
          </nav>
        </section>
      </div>
    </div>
  );
}
