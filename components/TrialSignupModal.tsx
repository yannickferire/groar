"use client";

import { Dialog as RadixDialog, VisuallyHidden } from "radix-ui";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CrownIcon,
  Clock01Icon,
  Tick01Icon,
  Loading03Icon,
  GoogleIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { PRO_FEATURES, PLANS, TRIAL_DURATION_DAYS, LIFETIME_PRICE, ProTierInfo } from "@/lib/plans";
import posthog from "posthog-js";

const FREE_WEEKLY_LIMIT = PLANS.free.maxExportsPerWeek;

type TrialSignupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "limit" | "premium-features";
  exportCount?: number;
  premiumFeatures?: string[];
};

export default function TrialSignupModal({
  open,
  onOpenChange,
  reason,
  exportCount = 0,
  premiumFeatures = [],
}: TrialSignupModalProps) {
  const isPremiumBlock = reason === "premium-features";
  const isAtLimit = reason === "limit";
  const remaining = Math.max(0, FREE_WEEKLY_LIMIT - exportCount);
  const [loading, setLoading] = useState<"google" | "twitter" | null>(null);
  const [proTierInfo, setProTierInfo] = useState<ProTierInfo | null>(null);

  useEffect(() => {
    if (open) {
      posthog.capture("trial_signup_modal_viewed", { reason });
      // Set trial intent now so that if the user dismisses this modal and
      // later signs up via "Get Started", the onboarding auto-starts the trial.
      try { localStorage.setItem("groar-trial-intent", "true"); } catch {}
      fetch("/api/pricing")
        .then((res) => res.json())
        .then((data) => setProTierInfo(data.proTier))
        .catch(() => {});
    }
  }, [open, reason]);

  const proPrice = proTierInfo?.price ?? PLANS.pro.price;
  const callbackURL = "/dashboard?trial=start";

  const handleTwitter = () => {
    setLoading("twitter");
    try { localStorage.setItem("groar-pending-export", "true"); } catch {}
    authClient.signIn.social({ provider: "twitter", callbackURL });
  };

  const handleGoogle = () => {
    setLoading("google");
    try { localStorage.setItem("groar-pending-export", "true"); } catch {}
    authClient.signIn.social({ provider: "google", callbackURL });
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            {/* Overlay */}
            <RadixDialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </RadixDialog.Overlay>

            {/* Content - centered */}
            <RadixDialog.Content asChild>
              <motion.div
                className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg origin-bottom"
                style={{ translateX: "-50%", translateY: "-50%" }}
                initial={{
                  opacity: 0,
                  y: 60,
                  rotateX: 8,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 60,
                  rotateX: 8,
                  scale: 0.96,
                }}
                transition={{
                  type: "spring",
                  damping: 28,
                  stiffness: 350,
                  mass: 0.8,
                }}
              >
                <VisuallyHidden.Root>
                  <RadixDialog.Title>Start your free trial</RadixDialog.Title>
                </VisuallyHidden.Root>

                <div className="relative rounded-2xl bg-card shadow-2xl overflow-hidden">
                  {/* Close button */}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-3 top-3 rounded-full w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors z-20"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
                    <span className="sr-only">Close</span>
                  </button>

                  {/* Header */}
                  <div className="p-6 pb-5">
                    <div className="flex items-center gap-4">
                      {isPremiumBlock ? (
                        <>
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={CrownIcon} size={24} strokeWidth={2} className="text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-heading font-bold text-foreground">Your design uses Pro features</h3>
                            <p className="text-sm text-muted-foreground">{premiumFeatures.join(" · ")}</p>
                          </div>
                        </>
                      ) : isAtLimit ? (
                        <>
                          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Clock01Icon} size={24} strokeWidth={2} className="text-amber-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-heading font-bold text-foreground">Weekly limit reached</h3>
                            <p className="text-sm text-muted-foreground">You&apos;ve used all {FREE_WEEKLY_LIMIT} free exports this week</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Tick01Icon} size={24} strokeWidth={2.5} className="text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-heading font-bold text-foreground">Image downloaded!</h3>
                            <p className="text-sm text-muted-foreground">
                              {remaining === 0
                                ? "That was your last free export this week"
                                : remaining === 1
                                  ? <>Only <span className="text-amber-600 font-medium">1 export left</span> this week</>
                                  : `${remaining} free exports left this week`
                              }
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Trial offer - dark section */}
                  <div className="px-5 pb-5">
                    <div className="relative bg-foreground text-background p-6 rounded-3xl overflow-hidden">
                      {/* Gradient effect */}
                      <motion.div
                        className="absolute -bottom-20 -right-40 w-80 h-60 bg-linear-to-tl from-primary/40 via-primary/20 to-transparent blur-3xl rotate-[-25deg]"
                        style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      />

                      {/* Badge */}
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full z-20 flex items-center gap-1">
                        <HugeiconsIcon icon={SparklesIcon} size={12} strokeWidth={2} />
                        {TRIAL_DURATION_DAYS} days free trial
                      </div>

                      <div className="relative z-10">
                        {/* Trial title */}
                        <div className="mb-5">
                          <h4 className="text-xl font-heading font-bold">
                            <span className="inline-block">🐯</span> GROAR Pro
                          </h4>
                          <p className="text-sm text-background/60">
                            $0 trial, then ${proPrice}/mo or ${LIFETIME_PRICE}$ one-time
                          </p>
                          <p className="text-xs text-background/40">
                            No credit card required
                          </p>
                        </div>

                        {/* Premium features list */}
                        <div className="space-y-2 mb-6">
                          {PRO_FEATURES.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-background/10 flex items-center justify-center shrink-0">
                                <HugeiconsIcon icon={feature.icon} size={14} strokeWidth={1.5} className="text-primary" />
                              </div>
                              <p className="text-sm font-medium leading-tight text-background/80">{feature.title}</p>
                            </div>
                          ))}
                        </div>

                        {/* Auth buttons */}
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={handleTwitter}
                            variant="defaultReverse"
                            size="lg"
                            className="w-full"
                            disabled={loading !== null}
                          >
                            {loading === "twitter" ? (
                              <HugeiconsIcon icon={Loading03Icon} size={20} strokeWidth={2} className="animate-spin" />
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                className="w-5 h-5"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                            )}
                            Start your free trial with X
                          </Button>

                          <Button
                            onClick={handleGoogle}
                            variant="outline"
                            size="lg"
                            className="w-full bg-background/10 border-background/20 text-background hover:bg-background/20"
                            disabled={loading !== null}
                          >
                            {loading === "google" ? (
                              <HugeiconsIcon icon={Loading03Icon} size={20} strokeWidth={2} className="animate-spin" />
                            ) : (
                              <HugeiconsIcon icon={GoogleIcon} size={20} strokeWidth={1.5} />
                            )}
                            Start your free trial with Google
                          </Button>

                          <button
                            onClick={() => onOpenChange(false)}
                            className="text-sm text-background/50 hover:text-background/70 transition-colors py-1.5"
                          >
                            Go back to the editor
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
