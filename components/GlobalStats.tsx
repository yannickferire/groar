"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon, UserLove01Icon, EyeIcon } from "@hugeicons/core-free-icons";
import { FadeInView, StaggerContainer, StaggerItem, AnimatedCounter } from "@/components/ui/motion";

type GlobalStatsData = {
  totalExports: number;
  totalFollowers: number;
  totalImpressions: number;
};

const numberFormatter = (n: number) => n.toLocaleString("fr-FR");

export default function GlobalStats() {
  const [stats, setStats] = useState<GlobalStatsData>({
    totalExports: 0,
    totalFollowers: 0,
    totalImpressions: 0,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const statsResponse = await fetch("/api/stats");
        const statsData = await statsResponse.json();

        if (!cancelled) {
          setStats({
            totalExports: Number(statsData.totalExports ?? 0),
            totalFollowers: Number(statsData.totalFollowers ?? 0),
            totalImpressions: Number(statsData.totalImpressions ?? 0),
          });
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FadeInView delay={0.3} duration={0.6}>
      <section className="w-full max-w-5xl mx-auto">
        <div className="rounded-3xl border-fade p-6 md:p-8">
          <StaggerContainer
            staggerDelay={0.15}
            delayChildren={0.2}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
          >
            <StaggerItem>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
                <HugeiconsIcon icon={Image01Icon} size={18} strokeWidth={2} />
                Images created
              </p>
              <p className="text-3xl font-heading font-bold mt-3">
                {loaded ? (
                  <AnimatedCounter value={stats.totalExports} formatter={numberFormatter} />
                ) : (
                  "0"
                )}
              </p>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
                <HugeiconsIcon icon={UserLove01Icon} size={18} strokeWidth={2} />
                Followers announced
              </p>
              <p className="text-3xl font-heading font-bold mt-3">
                {loaded ? (
                  <AnimatedCounter value={stats.totalFollowers} formatter={numberFormatter} />
                ) : (
                  "0"
                )}
              </p>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
                <HugeiconsIcon icon={EyeIcon} size={18} strokeWidth={2} />
                Impressions announced
              </p>
              <p className="text-3xl font-heading font-bold mt-3">
                {loaded ? (
                  <AnimatedCounter value={stats.totalImpressions} formatter={numberFormatter} />
                ) : (
                  "0"
                )}
              </p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
    </FadeInView>
  );
}
