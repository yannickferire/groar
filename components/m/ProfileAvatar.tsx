"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  fallbackChar: string;
  handle?: string | null; // X handle (without @) — used for live unavatar fallback
};

export default function ProfileAvatar({ src, alt, fallbackChar, handle }: Props) {
  // Stage 0: stored URL → Stage 1: unavatar by handle → Stage 2: initials
  const [stage, setStage] = useState<0 | 1 | 2>(src ? 0 : handle ? 1 : 2);

  if (stage === 2) {
    return (
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
        {fallbackChar}
      </div>
    );
  }

  const currentSrc =
    stage === 0
      ? src!
      : `https://unavatar.io/x/${handle}?fallback=false`;

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={80}
      height={80}
      loading="lazy"
      onError={() => setStage(stage === 0 && handle ? 1 : 2)}
      className="w-20 h-20 rounded-full object-cover"
    />
  );
}
