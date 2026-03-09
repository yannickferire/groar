"use client";

import { useEffect, useRef } from "react";

const SCROLL_GOALS: Record<string, string> = {
  editor: "scroll_to_editor",
  pricing: "scroll_to_pricing",
};

export default function DataFastFunnel() {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          const goal = SCROLL_GOALS[id];
          if (goal && !firedRef.current.has(goal)) {
            firedRef.current.add(goal);
            window?.datafast?.(goal);
          }
        }
      },
      { threshold: 0.3 }
    );

    for (const id of Object.keys(SCROLL_GOALS)) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
