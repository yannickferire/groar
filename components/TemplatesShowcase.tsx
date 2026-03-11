"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartLineData02Icon, CrownIcon, Target01Icon, Menu02Icon } from "@hugeicons/core-free-icons";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const templates = [
  {
    name: "Metrics",
    tagline: "Show your key numbers at a glance",
    description: "Followers, MRR, stars, karma — display up to 6 metrics on one visual.",
    icon: ChartLineData02Icon,
    image: "/proof-backgrounds/metrics.jpg",
    alt: "Metrics template showing monthly growth recap with followers, impressions, and engagement",
  },
  {
    name: "Milestone",
    tagline: "Celebrate your wins publicly",
    description: "Hit 1K followers? $10K MRR? Make it a moment your audience remembers.",
    icon: CrownIcon,
    image: "/proof-backgrounds/milestone.jpg",
    alt: "Milestone template celebrating 2,000 followers achievement",
  },
  {
    name: "Progress",
    tagline: "Track your goals visually",
    description: "Show how far you've come with a progress bar — from 0 to your next big goal.",
    icon: Target01Icon,
    image: "/proof-backgrounds/progress.jpg",
    alt: "Progress template showing 1M impressions goal tracker",
  },
  {
    name: "List",
    tagline: "Announce features & updates",
    description: "Ship a new feature? List what's new and share it with your community.",
    icon: Menu02Icon,
    image: null,
    alt: "",
  },
];

export default function TemplatesShowcase() {
  return (
    <section className="w-full max-w-6xl mx-auto py-4">
      <FadeInView>
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
            4 templates to cover every occasion
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-balance">
            Whether you&apos;re celebrating a milestone, sharing growth, or shipping updates — there&apos;s a template for that.
          </p>
        </div>
      </FadeInView>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" staggerDelay={0.12}>
        {templates.map((template) => (
          <StaggerItem
            key={template.name}
            className="group relative rounded-3xl border-fade overflow-hidden"
          >
            {/* Image */}
            {template.image ? (
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={template.image}
                  alt={template.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="relative aspect-[16/9] bg-sidebar flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-2.5 rounded-full bg-border" style={{ width: `${60 + i * 20}px` }} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-2.5 rounded-full bg-border" style={{ width: `${80 - i * 15}px` }} />
                    ))}
                  </div>
                  <p className="text-xs mt-1">Coming with your own content</p>
                </div>
              </div>
            )}

            {/* Text overlay */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <HugeiconsIcon icon={template.icon} size={18} strokeWidth={2} className="text-primary" />
                <h3 className="text-base font-heading font-semibold">{template.name}</h3>
              </div>
              <p className="text-sm font-medium mb-0.5">{template.tagline}</p>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
