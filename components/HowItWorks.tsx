"use client";

import { FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const steps = [
  {
    number: "1",
    title: "Enter your metrics",
    description: "Add your handle and input your data.",
  },
  {
    number: "2",
    title: "Customize the style",
    description: "Choose a background and pick your colors.",
  },
  {
    number: "3",
    title: "Download & share",
    description: "Export as PNG and share your wins.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="w-full max-w-4xl mx-auto py-4 px-4 scroll-mt-18">
      <FadeInView>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
            Share your growth in 10 seconds
          </h2>
          <p className="text-muted-foreground">
            No design skills needed. Just three simple steps.
          </p>
        </div>
      </FadeInView>

      <StaggerContainer className="flex flex-col md:flex-row items-stretch gap-0" staggerDelay={0.15}>
        {steps.map((step, index) => (
          <StaggerItem
            key={index}
            className="flex-1 flex flex-col items-center text-center px-6 py-6 relative"
          >
            <span className="text-5xl font-bold font-heading text-primary/60 mb-2">{step.number}</span>
            <h3 className="text-base font-semibold mb-1">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-border" />
            )}
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
