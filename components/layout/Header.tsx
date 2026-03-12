"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, DashboardSquare02Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";

function scrollToElement(id: string, offset: number) {
  const el = document.getElementById(id);
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const isHome = pathname === "/";

  function navigateTo(id: string) {
    if (isHome) {
      scrollToElement(id, 72);
    } else {
      router.push(`/#${id}`);
    }
  }

  return (
    <div className="md:sticky md:top-0 z-[100] md:bg-background/80 md:backdrop-blur-lg">
      <FadeIn delay={0} duration={0.6} direction="none">
        <header className="w-full max-w-5xl mx-auto flex items-center justify-center md:justify-between py-4 px-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigateTo("what")}
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              What?
            </button>
            <button
              onClick={() => navigateTo("how")}
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              How?
            </button>
            <button
              onClick={() => navigateTo("who")}
              className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Who?
            </button>
            {isHome ? (
              <button
                onClick={() => scrollToElement("pricing", 72)}
                className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Pricing!
              </button>
            ) : (
              <Link
                href="/pricing"
                className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing!
              </Link>
            )}
            <div className="hidden md:block">
              {session ? (
                <Button asChild variant="default" size="default">
                  <Link href="/dashboard">
                    <HugeiconsIcon icon={DashboardSquare02Icon} size={18} strokeWidth={2} aria-hidden="true" />
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <Button variant="default" size="default" onClick={() => {
                  localStorage.setItem("groar-trial-intent", "true");
                  router.push("/login?callbackUrl=%2Fdashboard%3Ftrial%3Dstart");
                }}>
                  <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2} aria-hidden="true" />
                  Start for free
                </Button>
              )}
            </div>
          </nav>
        </header>
      </FadeIn>
    </div>
  );
}
