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
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import { PRO_FEATURES, PRO_PRICING_TIERS, CURRENT_PRO_TIER, CURRENT_PRO_PRICE } from "@/lib/plans";

const FREE_DAILY_LIMIT = 3;

type UpgradeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportCount: number;
};

export default function UpgradeModal({
  open,
  onOpenChange,
  exportCount,
}: UpgradeModalProps) {
  const remaining = Math.max(0, FREE_DAILY_LIMIT - exportCount);
  const isAtLimit = remaining === 0;

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
                className="fixed left-[50%] top-[50%] z-50 w-full max-w-md origin-bottom"
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
                  <div className="p-5 pb-4">
                    <div className="flex items-center gap-3">
                      {isAtLimit ? (
                        <>
                          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
                            <HugeiconsIcon
                              icon={Clock01Icon}
                              size={22}
                              strokeWidth={2}
                              className="text-amber-600"
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-heading font-bold text-foreground">Daily limit reached</h3>
                            <p className="text-sm text-muted-foreground">
                              You&apos;ve used all {FREE_DAILY_LIMIT} free exports for today
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                            <HugeiconsIcon
                              icon={Tick01Icon}
                              size={22}
                              strokeWidth={2.5}
                              className="text-green-600"
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-heading font-bold text-foreground">Image downloaded!</h3>
                            <p className="text-sm text-muted-foreground">
                              Export {exportCount} of {FREE_DAILY_LIMIT} today
                              {remaining === 1 && <span className="text-amber-600 font-medium"> — last one!</span>}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pro section - dark background with spacing */}
                  <div className="px-4 pb-4">
                    <div className="relative bg-foreground text-background p-5 rounded-xl overflow-hidden">
                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full z-20 flex items-center gap-1">
                      <HugeiconsIcon icon={StarIcon} size={12} strokeWidth={2} />
                      Popular
                    </div>

                    {/* Gradient effect */}
                    <motion.div
                      className="absolute -bottom-16 -right-32 w-64 h-48 bg-gradient-to-tl from-primary/40 via-primary/20 to-transparent blur-3xl rotate-[-25deg]"
                      style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    />

                    <div className="relative z-10">
                      {/* Pro title */}
                      <div className="mb-4">
                        <h4 className="text-lg font-heading font-bold">
                          <span className="inline-block">🐯</span> GROAR Pro
                        </h4>
                        <p className="text-sm text-background/60">Unlimited exports + premium features</p>
                        {(() => {
                          const tier = PRO_PRICING_TIERS[CURRENT_PRO_TIER];
                          const nextTier = PRO_PRICING_TIERS[CURRENT_PRO_TIER + 1];
                          if (tier && tier.spots !== null && nextTier) {
                            return (
                              <p className="text-xs text-background/40 mt-1">
                                Launch price – <span className="text-primary font-medium">{tier.spots} spots left</span> – Next: ${nextTier.price}/mo
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Premium features list */}
                      <div className="grid grid-cols-2 gap-2.5 mb-5">
                        {PRO_FEATURES.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-background/10 flex items-center justify-center shrink-0">
                              <HugeiconsIcon icon={feature.icon} size={14} strokeWidth={1.5} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium leading-tight truncate">{feature.title}</p>
                              <p className="text-[10px] text-background/50 leading-tight truncate">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button asChild variant="defaultReverse" size="lg" className="w-full">
                          <Link href="/pricing">
                            Upgrade to Pro — ${CURRENT_PRO_PRICE}/month
                          </Link>
                        </Button>
                        <button
                          onClick={() => onOpenChange(false)}
                          className="text-sm text-background/50 hover:text-background/70 transition-colors py-1.5"
                        >
                          {isAtLimit ? "Come back tomorrow" : "Maybe later"}
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

export { FREE_DAILY_LIMIT };
