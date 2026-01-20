"use client";

import Image from "next/image";
import { BackgroundSettings, BackgroundPreset } from "../Editor";

type BackgroundCanvasProps = {
  settings: BackgroundSettings;
  backgrounds: BackgroundPreset[];
  className?: string;
};

export default function BackgroundCanvas({ settings, backgrounds, className }: BackgroundCanvasProps) {
  const preset = backgrounds.find(p => p.id === settings.presetId) || backgrounds[0];

  if (!preset) {
    return null;
  }

  // Solid color background
  if (preset.id === "solid-color") {
    return (
      <div
        className={`absolute inset-0 ${className || ""}`}
        style={{ backgroundColor: settings.solidColor || preset.color }}
      />
    );
  }

  // Image background
  if (!preset.image) {
    return null;
  }

  return (
    <Image
      src={preset.image}
      alt={preset.name}
      fill
      className={`object-cover ${className || ""}`}
      priority
    />
  );
}
