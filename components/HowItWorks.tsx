import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon, PaintBrush01Icon, Share08Icon } from "@hugeicons/core-free-icons";

const steps = [
  {
    icon: Edit02Icon,
    title: "Enter your metrics",
    description: "Add your handle and input your analytics data.",
  },
  {
    icon: PaintBrush01Icon,
    title: "Customize the style",
    description: "Choose a background and pick your colors.",
  },
  {
    icon: Share08Icon,
    title: "Download & share",
    description: "Export as PNG and share to celebrate your wins.",
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full max-w-4xl mx-auto py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Create in seconds
        </h2>
        <p className="text-muted-foreground">
          No design skills needed. Just three simple steps.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex-1 relative p-6 rounded-2xl border border-border bg-card"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={step.icon} size={24} strokeWidth={1.5} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
                </div>
                <h3 className="text-base font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
