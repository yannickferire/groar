"use client";

import XLogo from "@/components/icons/XLogo";
import { FadeIn } from "@/components/ui/motion";
import LovedBy from "@/components/LovedBy";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, DashboardSquare01Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";

export default function Hero() {
  const { data: session } = authClient.useSession();

  return (
    <section className="max-w-3xl text-balance text-center flex flex-col gap-4 md:gap-6 mx-auto">
      <FadeIn delay={0.25} duration={0.6}>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">
          Make your <XLogo className="w-7! h-7! sm:w-8! sm:h-8! md:w-12! md:h-12! rounded-lg! md:rounded-xl! align-middle -mt-1 -rotate-2 [&>svg]:w-3.5! [&>svg]:h-3.5! sm:[&>svg]:w-4! sm:[&>svg]:h-4! md:[&>svg]:w-6! md:[&>svg]:h-6!" /> social metrics <span className="highlighted">Roaaar</span>
        </h1>
      </FadeIn>
      <FadeIn delay={0.35} duration={0.6}>
        <p className="text-base md:text-xl max-w-2xl mx-auto text-muted-foreground">
          Turn cold data analytics into high-signal visuals.<br className="hidden md:block" />
          Share your wins and watch the engagement grow.
        </p>
      </FadeIn>
      <FadeIn delay={0.45} duration={0.6}>
        <LovedBy />
      </FadeIn>
      {/* TODO: uncomment when Marc Lou confirms
      <FadeIn delay={0.5} duration={0.6}>
        <figure className="-mt-3 flex items-center justify-center gap-3">
          <Image
            src="/testimonials/marc-lou.jpg"
            alt="Marc Lou"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
          <blockquote className="text-sm text-muted-foreground">
            &ldquo;I love the design!&rdquo;
            <span className="ml-1.5 font-medium text-foreground">— @marclou</span>
          </blockquote>
        </figure>
      </FadeIn>
      */}
      <FadeIn delay={0.55} duration={0.6}>
        <div className="mt-4">
          {session ? (
            <Button asChild variant="default" size="lg">
              <Link href="/dashboard">
                <HugeiconsIcon icon={DashboardSquare01Icon} size={18} strokeWidth={2} aria-hidden="true" />
                Go to Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild variant="default" size="lg">
              <Link href="/login">
                <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2} aria-hidden="true" />
                Get started for free
              </Link>
            </Button>
          )}
        </div>
      </FadeIn>
    </section>
  );
}
