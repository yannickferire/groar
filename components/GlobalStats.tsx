"use client";

import { useCallback, useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon, UserLove01Icon, DashboardSquare01Icon, Image01Icon } from "@hugeicons/core-free-icons";
import { FadeInView, StaggerContainer, StaggerItem, AnimatedCounter } from "@/components/ui/motion";
import { AnimatePresence, motion } from "framer-motion";
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

  // Listen for real-time export events from Editor
  const handleExport = useCallback((e: Event) => {
    const { followers } = (e as CustomEvent).detail;
    setStats((prev) => ({
      totalExports: prev.totalExports + 1,
      totalFollowers: prev.totalFollowers + (followers || 0),
    }));
  }, []);

  useEffect(() => {
    window.addEventListener("groar:export", handleExport);
    return () => window.removeEventListener("groar:export", handleExport);
  }, [handleExport]);

  // +1 for solid color preset
  const backgroundCount = BACKGROUNDS.length + 1;

  return (
    <FadeInView delay={0.3} duration={0.6}>
      <section className="w-full max-w-5xl mx-auto -mb-6 md:-mt-6 md:-mb-12">
        <div className="rounded-3xl border-fade border-fade-reverse p-6 md:p-8">
          <StaggerContainer
            staggerDelay={0.15}
            delayChildren={0.2}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-center"
          >
            <StaggerItem>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
                <HugeiconsIcon icon={Download04Icon} size={18} strokeWidth={2} />
                Visuals exported
              </p>
              <div className="text-2xl sm:text-3xl font-mono font-bold mt-1.5 sm:mt-3 flex justify-center">
                <AnimatePresence mode="wait">
                  {loaded ? (
                    <motion.span key="value" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      <AnimatedCounter value={stats.totalExports} formatter={numberFormatter} />
                    </motion.span>
                  ) : (
                    <motion.span key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="inline-block h-9 w-16 rounded-lg bg-muted-foreground/10 animate-pulse" />
                  )}
                </AnimatePresence>
              </div>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
                <HugeiconsIcon icon={UserLove01Icon} size={18} strokeWidth={2} />
                Followers announced
              </p>
              <div className="text-2xl sm:text-3xl font-mono font-bold mt-1.5 sm:mt-3 flex justify-center">
                <AnimatePresence mode="wait">
                  {loaded ? (
                    <motion.span key="value" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      <AnimatedCounter value={stats.totalFollowers} formatter={numberFormatter} />
                    </motion.span>
                  ) : (
                    <motion.span key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="inline-block h-9 w-16 rounded-lg bg-muted-foreground/10 animate-pulse" />
                  )}
                </AnimatePresence>
              </div>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
                <HugeiconsIcon icon={DashboardSquare01Icon} size={18} strokeWidth={2} />
                Templates
              </p>
              <div className="text-2xl sm:text-3xl font-mono font-bold mt-1.5 sm:mt-3 flex justify-center">
                <AnimatePresence mode="wait">
                  {loaded ? (
                    <motion.span key="value" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      <AnimatedCounter value={3} />
                    </motion.span>
                  ) : (
                    <motion.span key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="inline-block h-9 w-8 rounded-lg bg-muted-foreground/10 animate-pulse" />
                  )}
                </AnimatePresence>
              </div>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-2">
                <HugeiconsIcon icon={Image01Icon} size={18} strokeWidth={2} />
                Backgrounds
              </p>
              <div className="text-2xl sm:text-3xl font-mono font-bold mt-1.5 sm:mt-3 flex justify-center">
                <AnimatePresence mode="wait">
                  {loaded ? (
                    <motion.span key="value" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      <AnimatedCounter value={backgroundCount} /><span>+</span>
                    </motion.span>
                  ) : (
                    <motion.span key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="inline-block h-9 w-10 rounded-lg bg-muted-foreground/10 animate-pulse" />
                  )}
                </AnimatePresence>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
    </FadeInView>
  );
}
