"use client";

import XLogo from "@/components/icons/XLogo";
import { FadeIn } from "@/components/ui/motion";
import LovedBy from "@/components/LovedBy";

export default function Hero() {
  return (
    <section className="max-w-3xl text-balance text-center flex flex-col gap-6 mx-auto">
      <FadeIn delay={0.25} duration={0.6}>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Make your social metrics <span className="highlighted">Roaaar</span>
        </h1>
      </FadeIn>
      <FadeIn delay={0.35} duration={0.6}>
        <p className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">
          Turn cold data analytics into high-signal visuals.<br className="hidden md:block" />
          Share your wins and watch the engagement grow.
        </p>
      </FadeIn>
      <FadeIn delay={0.45} duration={0.6}>
        <LovedBy />
      </FadeIn>
      <FadeIn delay={0.5} duration={0.6}>
        <p className="-mt-2 text-sm text-muted-foreground flex items-center justify-center gap-1">
          For now only available for <XLogo className="mx-1" /><span className="sr-only">X (ex Twitter)</span>
        </p>
      </FadeIn>
    </section>
  );
}
