"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Rocket01Icon, PencilEdit01Icon, CodeIcon, UserMultiple02Icon } from "@hugeicons/core-free-icons";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const personas = [
  {
    icon: Rocket01Icon,
    title: "Indie Hackers",
    quote: "Just hit $1K MRR!",
    description: "Revenue milestones that get likes, not just impressions.",
  },
  {
    icon: PencilEdit01Icon,
    title: "Content Creators",
    quote: "10K followers!",
    description: "Celebrate growth and attract new followers.",
  },
  {
    icon: CodeIcon,
    title: "Open Source",
    quote: "500 GitHub stars!",
    description: "Stars, forks, contributors! Shareable in one image.",
  },
  {
    icon: UserMultiple02Icon,
    title: "Founders",
    quote: "Monthly growth recap",
    description: "Real numbers build trust with investors and users.",
  },
];

export default function WhoItsFor() {
  return (
    <section id="who" className="w-full max-w-5xl mx-auto py-4 px-4 scroll-mt-18">
      <FadeInView>
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
            Built for people building in public
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-balance">
            Makers, founders, creators! Anyone who shares their journey deserves visuals that match their ambition.
          </p>
        </div>
      </FadeInView>

      <StaggerContainer className="grid grid-cols-1 min-[450px]:grid-cols-2 md:grid-cols-4 gap-4" staggerDelay={0.1} amount={0}>
        {personas.map((persona) => (
          <StaggerItem
            key={persona.title}
            className="rounded-2xl border-fade p-5 flex flex-col items-center text-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HugeiconsIcon icon={persona.icon} size={20} strokeWidth={1.5} className="text-primary" />
            </div>
            <h3 className="text-base font-heading font-semibold">{persona.title}</h3>
            <p className="text-sm text-primary font-medium">&ldquo;{persona.quote}&rdquo;</p>
            <p className="text-sm text-muted-foreground text-balance">{persona.description}</p>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
