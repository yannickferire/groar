"use client";

import { useEffect, useRef } from "react";

export default function SectionTracker({ name, children }: { name: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || tracked.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true;
          import("posthog-js").then(({ default: posthog }) => {
            // Only track for anonymous users (no distinct_id set = not logged in)
            const props = posthog.get_distinct_id();
            const isIdentified = posthog.get_property("$user_id");
            if (!isIdentified) {
              posthog.capture("section_viewed", { section: name });
            }
          }).catch(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [name]);

  return <div ref={ref}>{children}</div>;
}
