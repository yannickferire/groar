"use client";

import Link from "next/link";
import { Dialog as RadixDialog, VisuallyHidden } from "radix-ui";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick01Icon,
  StarIcon,
  Cancel01Icon,
  Clock01Icon,
  CrownIcon,
  SquareUnlock02Icon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { PLANS, ProTierInfo, fetchProTierInfo } from "@/lib/plans";

const FREE_WEEKLY_LIMIT = PLANS.free.maxExportsPerWeek;

type UpgradeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportCount: number;
  reason?: "limit" | "premium-features";
  premiumFeatures?: string[];
};

export default function UpgradeModal({
  open,
  onOpenChange,
  exportCount,
  reason = "limit",
  premiumFeatures = [],
}: UpgradeModalProps) {
  const remaining = Math.max(0, FREE_WEEKLY_LIMIT - exportCount);
  const isAtLimit = remaining === 0;
  const isPremiumBlock = reason === "premium-features";
  const [proTierInfo, setProTierInfo] = useState<ProTierInfo | null>(null);

  useEffect(() => {
    if (open) {
      fetchProTierInfo()
        .then(setProTierInfo)
        .catch(() => {});
    }
  }, [open]);

  const proPrice = proTierInfo?.price ?? PLANS.pro.price;

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
                {/* Accessible title for screen readers */}
                <VisuallyHidden.Root>
                  <RadixDialog.Title>Upgrade to Groar Pro</RadixDialog.Title>
                </VisuallyHidden.Root>

                {/* Main card - light background */}
                <div className="relative rounded-2xl bg-card shadow-2xl overflow-hidden">
                  {/* Close button */}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-3 top-3 rounded-full w-8 h-8 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors z-20"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
                    <span className="sr-only">Close</span>
                  </button>

                  {/* Header - light */}
                  <div className="p-6 pb-5">
                    <div className="flex items-center gap-4">
                      {isPremiumBlock ? (
                        <>
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={CrownIcon} size={24} strokeWidth={2} className="text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-heading font-bold text-foreground leading-tight">This is a Pro feature</h3>
                            <p className="text-sm text-muted-foreground leading-tight">Upgrade to unlock it</p>
                          </div>
                        </>
                      ) : isAtLimit ? (
                        <>
                          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Clock01Icon} size={24} strokeWidth={2} className="text-amber-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-heading font-bold text-foreground leading-tight">You&apos;ve used your {FREE_WEEKLY_LIMIT} free exports</h3>
                            <p className="text-sm text-muted-foreground leading-tight">Upgrade to go unlimited</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Tick01Icon} size={24} strokeWidth={2.5} className="text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-heading font-bold text-foreground leading-tight">Image downloaded!</h3>
                            <p className="text-sm text-muted-foreground leading-tight">
                              Export {exportCount} of {FREE_WEEKLY_LIMIT} this week
                              {remaining === 1 && <span className="text-amber-600 font-medium"> — last one!</span>}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pro section - dark background with spacing */}
                  <div className="px-5 pb-5">
                    <div className="relative bg-foreground text-background p-6 rounded-xl overflow-hidden">
                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full z-20 flex items-center gap-1">
                      <HugeiconsIcon icon={StarIcon} size={12} strokeWidth={2} />
                      Popular
                    </div>

                    {/* Gradient effect */}
                    <motion.div
                      className="absolute -bottom-20 -right-40 w-80 h-60 bg-linear-to-tl from-primary/40 via-primary/20 to-transparent blur-3xl rotate-[-25deg]"
                      style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    />

                    <div className="relative z-10">
                      {/* Pro title */}
                      <div className="mb-5">
                        <h4 className="text-xl font-heading font-bold leading-tight">
                          <span className="inline-block">🐯</span> GROAR Pro
                        </h4>
                        <p className="text-sm text-background/60 leading-tight">
                          Starting at ${proPrice}/month
                        </p>
                        {proTierInfo && proTierInfo.spotsLeft !== null && proTierInfo.nextPrice !== null && (
                          <p className="text-xs text-background/40 mt-1">
                            <span className="text-primary font-medium">{proTierInfo.spotsLeft} spots left</span> at this price
                          </p>
                        )}
                      </div>

                      {/* Unlock line */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-7 h-7 rounded-lg bg-background/10 flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={SquareUnlock02Icon} size={14} strokeWidth={1.5} className="text-primary" />
                        </div>
                        <p className="text-sm font-medium leading-tight text-background/80">Unlimited exports + every Pro feature</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button asChild variant="defaultReverse" size="lg" className="w-full">
                          <Link href="/pricing">
                            Upgrade to Pro
                          </Link>
                        </Button>
                        <button
                          onClick={() => onOpenChange(false)}
                          className="text-sm text-background/50 hover:text-background/70 transition-colors py-1.5"
                        >
                          {isPremiumBlock ? "Go back to the editor" : isAtLimit ? "Come back next week" : "Maybe later"}
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

export { FREE_WEEKLY_LIMIT };
