import { HugeiconsIcon } from "@hugeicons/react";
import { Analytics01Icon, Clock01Icon, Setting06Icon, ColorsIcon, SparklesIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const features = [
  {
    icon: Analytics01Icon,
    title: "Dashboard",
    description: "Track all your metrics in one place",
  },
  {
    icon: Clock01Icon,
    title: "History",
    description: "Access your past visuals anytime",
  },
  {
    icon: ColorsIcon,
    title: "More backgrounds",
    description: "Unlock exclusive premium designs",
  },
  {
    icon: Setting06Icon,
    title: "Custom branding",
    description: "Add your logo and brand colors",
  },
];

export default function Premium() {
  return (
    <section className="w-full max-w-4xl mx-auto py-16">
      <div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-8 md:p-12">
        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
          <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
          Coming soon
        </div>

        <div className="max-w-2xl relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Groar Premium <span className="inline-block">🐯</span>
          </h2>
          <p className="text-background/70 mb-8">
            We&apos;re building powerful features to help you track, manage, and showcase your growth like never before.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={feature.icon} size={20} strokeWidth={1.5} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-0.5">{feature.title}</h3>
                  <p className="text-sm text-background/60">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-background/10">
            <p className="text-sm text-background/60 mb-3">Get notified when we launch</p>
            <form className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={18}
                  strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10 bg-background/10 border-background/20 text-background placeholder:text-background/40"
                />
              </div>
              <Button type="submit" variant="default">
                Notify me
              </Button>
            </form>
          </div>
        </div>

        <div
          className="absolute -bottom-16 -right-24 w-125 h-64 bg-linear-to-tl from-primary/30 via-primary/20 to-transparent blur-3xl rotate-[-15deg]"
          style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
        />
      </div>
    </section>
  );
}
