"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Analytics01Icon, Clock01Icon, Setting06Icon, ColorsIcon, SparklesIcon, Mail01Icon, FlashIcon, MoreHorizontalIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { motion } from "framer-motion";

const features = [
  {
    icon: FlashIcon,
    title: "Automation",
    description: "Auto-fetch your metrics",
  },
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
    description: "Add your logo and remove watermark",
  },
  {
    icon: MoreHorizontalIcon,
    title: "And more...",
    description: "Many more features coming soon",
  },
];

type FormStatus = "idle" | "loading" | "success" | "error";

export default function Premium() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to subscribe");
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <FadeInView direction="up" distance={32}>
      <section className="w-full max-w-4xl mx-auto py-4">
        <div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-8 md:p-12">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
            <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} aria-hidden="true" />
            Coming soon
          </div>

          <div className="max-w-2xl relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Groar Premium <span className="inline-block">🐯</span>
            </h2>
            <p className="text-background/70 mb-8">
              We&apos;re building powerful features to help you track, manage, and showcase your growth like never before.
            </p>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10" staggerDelay={0.1}>
              {features.map((feature, index) => (
                <StaggerItem key={index} direction="up" distance={16}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={feature.icon} size={20} strokeWidth={1.5} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-0.5">{feature.title}</h3>
                      <p className="text-sm text-background/60">{feature.description}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <div className="pt-6 border-t border-background/10">
              <p className="text-sm text-background/60 mb-3">Be the first to know when Premium launches</p>
              {status === "success" ? (
                <div className="flex items-center gap-2 text-primary">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-sm font-medium">You&apos;re in! We&apos;ll let you know when Premium is ready.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-md">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={18}
                        strokeWidth={1.5}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={status === "loading"}
                        className="pl-10 bg-background/10 border-background/20 text-background placeholder:text-background/40 disabled:opacity-50"
                      />
                    </div>
                    <Button type="submit" variant="defaultReverse" disabled={status === "loading" || !email} className="disabled:opacity-100 disabled:cursor-not-allowed">
                      {status === "loading" ? "..." : "Get early access"}
                    </Button>
                  </div>
                  <p className="text-xs text-background/60">Early subscribers get 20% off for life</p>
                  {status === "error" && (
                    <p className="text-sm text-red-400">{errorMessage}</p>
                  )}
                </form>
              )}
            </div>
          </div>

          <motion.div
            className="absolute -bottom-20 -right-80 w-200 h-140 bg-linear-to-tl from-primary/30 via-primary/20 to-transparent blur-3xl rotate-[-25deg]"
            style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 1.2,
              delay: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </div>
      </section>
    </FadeInView>
  );
}
