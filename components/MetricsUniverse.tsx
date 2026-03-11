"use client";

import XLogo from "@/components/icons/XLogo";
import GithubLogo from "@/components/icons/GithubLogo";
import RedditLogo from "@/components/icons/RedditLogo";
import { HugeiconsIcon } from "@hugeicons/react";
import { DollarSquareIcon } from "@hugeicons/core-free-icons";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const platforms = [
  {
    name: "X (Twitter)",
    logo: <XLogo className="w-10! h-10! rounded-xl! [&>svg]:w-5! [&>svg]:h-5!" />,
    metrics: ["Followers", "Posts", "Impressions", "Likes", "Reposts", "Replies", "+ more"],
  },
  {
    name: "GitHub",
    logo: <GithubLogo className="w-10! h-10! rounded-xl! [&>svg]:w-6! [&>svg]:h-6!" />,
    metrics: ["Stars", "Forks", "Contributors", "PRs Closed", "Commits", "Issues Resolved"],
  },
  {
    name: "Reddit",
    logo: <RedditLogo className="w-10! h-10! rounded-xl! [&>svg]:w-6! [&>svg]:h-6!" />,
    metrics: ["Karma", "Upvotes", "Upvote Ratio"],
  },
  {
    name: "SaaS",
    logo: (
      <span className="inline-flex items-center justify-center w-10 h-10 bg-linear-to-br from-emerald-500 to-emerald-700 text-white rounded-xl">
        <HugeiconsIcon icon={DollarSquareIcon} size={22} strokeWidth={2} />
      </span>
    ),
    metrics: ["MRR", "ARR", "Revenue", "Customers", "Churn Rate", "LTV", "New Customers", "Sales", "Valuation"],
  },
];

export default function MetricsUniverse() {
  return (
    <section id="what" className="w-full max-w-5xl mx-auto pt-8 pb-4 px-4 scroll-mt-18">
      <FadeInView>
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
            Metrics to fuel your growth
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-balance">
            Pull data from X, GitHub, Reddit, or your SaaS dashboard. All in one visual.
          </p>
        </div>
      </FadeInView>

      <StaggerContainer className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-3 md:gap-4 max-w-3xl mx-auto" staggerDelay={0.08}>
        {platforms.map((platform) => (
          <StaggerItem
            key={platform.name}
            className="rounded-2xl border-fade p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              {platform.logo}
              <span className="text-base font-semibold">{platform.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {platform.metrics.map((metric) => (
                <span
                  key={metric}
                  className="text-xs px-2 py-1 rounded-full bg-sidebar text-muted-foreground"
                >
                  {metric}
                </span>
              ))}
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
