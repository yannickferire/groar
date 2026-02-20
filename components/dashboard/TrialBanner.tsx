"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProTierInfo, TRIAL_DURATION_DAYS, LIFETIME_PRICE } from "@/lib/plans";

type TrialBannerProps = {
  isTrialing: boolean;
  trialEnd: string | null;
  plan?: string;
  proTierInfo?: ProTierInfo | null;
  hasUsedTrial?: boolean;
};

export default function TrialBanner({ isTrialing, trialEnd, plan, proTierInfo, hasUsedTrial }: TrialBannerProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  // Free user who never had a trial → offer trial
  if (plan === "free" && !hasUsedTrial && !trialEnd) {
    const handleStartTrial = async () => {
      setStarting(true);
      try {
        const res = await fetch("/api/user/trial", { method: "POST" });
        if (res.ok) {
          // Redirect to editor so the user can start creating immediately
          router.push("/dashboard/editor");
        }
      } finally {
        setStarting(false);
      }
    };

    return (
      <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={CrownIcon} size={20} strokeWidth={2} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">
              Try Pro free for {TRIAL_DURATION_DAYS} days — no credit card required
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {proTierInfo?.spotsLeft
                ? <>Launch price: ${proTierInfo.price}/mo or ${LIFETIME_PRICE} one-time — {proTierInfo.spotsLeft} spots left{proTierInfo.nextPrice ? `, then $${proTierInfo.nextPrice}/mo` : ""}</>
                : <>Then ${proTierInfo?.price ?? 5}/mo or ${LIFETIME_PRICE} one-time</>
              }
            </p>
          </div>
        </div>
        <Button variant="default" size="sm" className="shrink-0" onClick={handleStartTrial} disabled={starting}>
          <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
          {starting ? "Starting..." : "Start free trial"}
        </Button>
      </div>
    );
  }

  if (!trialEnd) return null;

  const daysLeft = Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const daysLabel = daysLeft === 1 ? "day" : "days";

  // Active trial
  if (isTrialing) {
    return (
      <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={CrownIcon} size={20} strokeWidth={2} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">
              Pro trial — {daysLeft} {daysLabel} remaining
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {proTierInfo?.spotsLeft
                ? <>Launch price: ${proTierInfo.price}/mo or ${LIFETIME_PRICE} one-time — {proTierInfo.spotsLeft} spots left{proTierInfo.nextPrice ? `, then $${proTierInfo.nextPrice}/mo` : ""}</>
                : <>From ${proTierInfo?.price ?? 5}/mo or ${LIFETIME_PRICE} one-time</>
              }
            </p>
          </div>
        </div>
        <Button asChild variant="default" size="sm" className="shrink-0">
          <Link href="/pricing">
            <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
            Claim your spot
          </Link>
        </Button>
      </div>
    );
  }

  // Expired trial — hide after 7 days
  const daysSinceExpiry = (Date.now() - new Date(trialEnd).getTime()) / (1000 * 60 * 60 * 24);
  if (plan === "free" && daysSinceExpiry <= 7) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={CrownIcon} size={20} strokeWidth={2} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Your Pro trial has ended — upgrade to keep your premium features
            </p>
            <p className="text-xs text-amber-700/70 mt-0.5">
              {proTierInfo?.spotsLeft
                ? <>Launch price: ${proTierInfo.price}/mo or ${LIFETIME_PRICE} one-time — {proTierInfo.spotsLeft} spots left{proTierInfo.nextPrice ? `, then $${proTierInfo.nextPrice}/mo` : ""}</>
                : <>From ${proTierInfo?.price ?? 5}/mo or ${LIFETIME_PRICE} one-time</>
              }
            </p>
          </div>
        </div>
        <Button asChild variant="default" size="sm" className="shrink-0">
          <Link href="/pricing">
            <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
            Claim your spot
          </Link>
        </Button>
      </div>
    );
  }

  return null;
}
