"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon, UserLove01Icon, DashboardSquare01Icon, Image01Icon } from "@hugeicons/core-free-icons";
import { FadeInView, StaggerContainer, StaggerItem, AnimatedCounter } from "@/components/ui/motion";
import { BACKGROUNDS } from "@/lib/backgrounds";

type GlobalStatsData = {
  totalExports: number;
  totalFollowers: number;
};

const numberFormatter = (n: number) => n.toLocaleString("en-US");

export default function GlobalStats() {
  const [stats, setStats] = useState<GlobalStatsData>({
    totalExports: 0,
    totalFollowers: 0,
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

  // +1 for solid color preset
  const backgroundCount = BACKGROUNDS.length + 1;

  return (
    <FadeInView delay={0.3} duration={0.6}>
      <section className="w-full max-w-5xl mx-auto -mb-6 md:-mb-12">
        <div className="rounded-3xl border-fade border-fade-reverse p-6 md:p-8">
          <StaggerContainer
            staggerDelay={0.15}
            delayChildren={0.2}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
          >
            <StaggerItem>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
                <HugeiconsIcon icon={Download04Icon} size={18} strokeWidth={2} />
                Visuals exported
              </p>
              <p className="text-3xl font-mono font-bold mt-3">
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
                Followers gained
              </p>
              <p className="text-3xl font-mono font-bold mt-3">
                {loaded ? (
                  <AnimatedCounter value={stats.totalFollowers} formatter={numberFormatter} />
                ) : (
                  "0"
                )}
              </p>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
                <HugeiconsIcon icon={DashboardSquare01Icon} size={18} strokeWidth={2} />
                Templates
              </p>
              <p className="text-3xl font-mono font-bold mt-3">
                {loaded ? (
                  <AnimatedCounter value={3} />
                ) : (
                  "0"
                )}
              </p>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
                <HugeiconsIcon icon={Image01Icon} size={18} strokeWidth={2} />
                Backgrounds
              </p>
              <p className="text-3xl font-mono font-bold mt-3">
                {loaded ? (
                  <><AnimatedCounter value={backgroundCount} /><span>+</span></>
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
