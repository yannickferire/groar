"use client";

import XLogo from "@/components/icons/XLogo";
import GithubLogo from "@/components/icons/GithubLogo";
import RedditLogo from "@/components/icons/RedditLogo";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FadeIn } from "@/components/ui/motion";
import LovedBy from "@/components/LovedBy";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, DashboardSquare01Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import PeerPushBanner from "@/components/layout/PeerPushBanner";
const logoContainerClass = "w-8! h-8! sm:w-9! sm:h-9! md:w-14! md:h-14! rounded-lg! md:rounded-xl!";
const xSvgClass = "[&>svg]:w-4! [&>svg]:h-4! sm:[&>svg]:w-4.5! sm:[&>svg]:h-4.5! md:[&>svg]:w-7! md:[&>svg]:h-7!";
const platformSvgClass = "[&>svg]:w-5! [&>svg]:h-5! sm:[&>svg]:w-5.5! sm:[&>svg]:h-5.5! md:[&>svg]:w-9! md:[&>svg]:h-9!";

export default function Hero() {
  const { data: session } = authClient.useSession();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="max-w-3xl text-balance text-center flex flex-col gap-4 md:gap-6 mx-auto px-4">
      <FadeIn delay={0.2} duration={0.6}>
        <div className="flex justify-center">
          <PeerPushBanner />
        </div>
      </FadeIn>
      <FadeIn delay={0.25} duration={0.6}>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-[1.3] md:leading-[1.15]">
          Turn your{" "}
            <span className="group inline-flex items-center -space-x-2 sm:-space-x-2.5 md:-space-x-4 align-middle -mt-1 ml-1.5 mr-0.5">
              <XLogo className={`${logoContainerClass} ${xSvgClass} -rotate-2 group-hover:rotate-0 group-hover:-translate-x-1 md:group-hover:-translate-x-2 relative z-30 transition-transform duration-300 ease-out`} />
              <RedditLogo className={`${logoContainerClass} ${platformSvgClass} rotate-4 group-hover:rotate-0 relative z-20 transition-transform duration-300 ease-out`} />
              <GithubLogo className={`${logoContainerClass} ${platformSvgClass} -rotate-1 group-hover:rotate-0 group-hover:translate-x-1 md:group-hover:translate-x-2 relative z-10 transition-transform duration-300 ease-out`} />
            </span>
            <span className="sr-only">X, Reddit, GitHub and SaaS</span>{" "}
            growth into visuals that <span className="highlighted">Roaaar</span>
        </h1>
      </FadeIn>
      <FadeIn delay={0.35} duration={0.6}>
        <p className="text-base md:text-xl max-w-2xl mx-auto text-muted-foreground text-balance">
          Your analytics deserve better than a screenshot.<br/>Get eye-catching visuals in 10 seconds.
        </p>
      </FadeIn>
      <FadeIn delay={0.45} duration={0.6}>
        <LovedBy />
      </FadeIn>
      <FadeIn delay={0.5} duration={0.6}>
        <figure className="-mt-3 flex items-center justify-center gap-3">
          <Image
            src="/testimonials/marc-lou.jpg"
            alt="Marc Lou"
            width={36}
            height={36}
            className="w-9 h-9 rounded-full"
          />
          <blockquote className="text-sm text-muted-foreground">
            &ldquo;I love the design!&rdquo;
            <span className="ml-1.5 font-medium text-foreground">— @marclou</span>
          </blockquote>
        </figure>
      </FadeIn>
      <FadeIn delay={0.55} duration={0.6}>
        <div className="mt-4">
          {mounted && session ? (
            <Button asChild variant="default" size="lg">
              <Link href="/dashboard">
                <HugeiconsIcon icon={DashboardSquare01Icon} size={18} strokeWidth={2} aria-hidden="true" />
                Go to Dashboard
              </Link>
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              data-fast-goal="hero_cta_clicked"
              onClick={() => {
                import("posthog-js").then(({ default: posthog }) => {
                  posthog.capture("hero_cta_clicked");
                }).catch(() => {});
                localStorage.setItem("groar-trial-intent", "true");
                router.push("/login?callbackUrl=%2Fdashboard%3Ftrial%3Dstart");
              }}
            >
              <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2} aria-hidden="true" />
              Create your first visual
            </Button>
          )}
          {mounted && !session && (
            <p className="text-[11px] text-muted-foreground/60 mt-1.5">
              Free trial · No card needed
            </p>
          )}
        </div>
      </FadeIn>
    </section>
  );
}
