"use client";

import { useState } from "react";

export default function MilestoneCard({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-muted/20 max-w-[600px] mx-auto">
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        {!loaded && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-2xl" />
        )}
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
