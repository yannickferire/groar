"use client";

import Image from "next/image";
import { EditorSettings, BackgroundPreset, FontFamily, AspectRatioType } from "../Editor";
import { Input } from "@/components/ui/input";
import { isValidHexColor } from "@/lib/validation";
import { FONT_LIST } from "@/lib/fonts";
import { ASPECT_RATIO_LIST } from "@/lib/aspect-ratios";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon } from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StyleControlsProps = {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  backgrounds: BackgroundPreset[];
  isPremium?: boolean;
  lockPremiumFeatures?: boolean;
  onPremiumBlock?: (feature: string) => void;
};

export default function StyleControls({ settings, onSettingsChange, backgrounds, isPremium = false, lockPremiumFeatures = false, onPremiumBlock }: StyleControlsProps) {
  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const selectPreset = (presetId: string) => {
    updateSetting("background", {
      presetId,
      solidColor: settings.background.solidColor || "#f59e0b"
    });
  };

  const updateSolidColor = (color: string) => {
    updateSetting("background", { ...settings.background, solidColor: color });
  };

  const selectFont = (fontId: FontFamily) => {
    updateSetting("font", fontId);
  };

  const selectAspectRatio = (ratioId: AspectRatioType) => {
    updateSetting("aspectRatio", ratioId);
  };

  // Reorder backgrounds: image backgrounds first, solid color last
  const orderedBackgrounds = [
    ...backgrounds.filter(b => !b.color),
    ...backgrounds.filter(b => b.color),
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Row 1: Background presets */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-xs text-muted-foreground shrink-0 sr-only">Background</span>
        {orderedBackgrounds.map((preset) => (
          preset.color ? (
            <div
              key={preset.id}
              className={`relative w-10 h-10 rounded-lg overflow-hidden transition-all ${
                settings.background.presetId === preset.id
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                  : "hover:ring-2 hover:ring-foreground/30"
              }`}
              title={preset.name}
            >
              <Input
                type="color"
                value={settings.background.solidColor || preset.color}
                onChange={(e) => {
                  selectPreset(preset.id);
                  updateSolidColor(e.target.value);
                }}
                onClick={() => selectPreset(preset.id)}
                className="absolute inset-0 w-full h-full p-0 cursor-pointer border-0 rounded-lg [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg"
                aria-label="Background color picker"
              />
            </div>
          ) : (
            <button
              key={preset.id}
              type="button"
              onClick={() => { if (lockPremiumFeatures && preset.premium) { onPremiumBlock?.("Premium background"); return; } selectPreset(preset.id); }}
              className={`relative w-10 h-10 rounded-lg transition-all ${
                lockPremiumFeatures && preset.premium
                  ? "opacity-50 cursor-not-allowed"
                  : settings.background.presetId === preset.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                    : "hover:ring-2 hover:ring-foreground/30"
              }`}
              title={lockPremiumFeatures && preset.premium ? `${preset.name} (Pro)` : preset.name}
            >
              {preset.image && (
                <Image
                  src={preset.image}
                  alt={preset.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              {!isPremium && preset.premium && (
                <span className="absolute inset-0 rounded-lg bg-black/30 flex items-end justify-end p-1">
                  <HugeiconsIcon icon={CrownIcon} size={12} strokeWidth={2.5} className="text-white/80" />
                </span>
              )}
            </button>
          )
        ))}
      </div>

      {/* Row 2: Text color + Font */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Text</span>
          <Input
            type="color"
            value={settings.textColor}
            onChange={(e) => updateSetting("textColor", e.target.value)}
            onBlur={(e) => {
              if (!isValidHexColor(e.target.value)) {
                updateSetting("textColor", "#ffffff");
              }
            }}
            className="w-10 h-10 p-0 cursor-pointer border-0 rounded-lg overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
            aria-label="Text color picker"
          />
        </div>

        <div className="w-px h-6 bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Font</span>
          <Select
            value={settings.font || "bricolage"}
            onValueChange={(value) => {
              const font = FONT_LIST.find(f => f.id === value);
              if (lockPremiumFeatures && font?.premium) { onPremiumBlock?.("Premium font"); return; }
              selectFont(value as FontFamily);
            }}
          >
            <SelectTrigger className="w-56 h-10 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_LIST.map((font) => (
                <SelectItem
                  key={font.id}
                  value={font.id}
                  className={`flex items-center justify-between ${lockPremiumFeatures && font.premium ? "opacity-50" : ""}`}
                >
                  <span className="inline-flex items-center gap-1.5" style={{ fontFamily: `var(${font.variable})` }}>
                    {font.name}
                    {!isPremium && font.premium && (
                      <span className="inline-flex items-center gap-0.5 text-muted-foreground/60">
                        <HugeiconsIcon icon={CrownIcon} size={10} strokeWidth={2} />
                        <span className="text-[10px] font-medium leading-none">PRO</span>
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Aspect ratio */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Size</span>
        <div className="flex gap-2">
          {ASPECT_RATIO_LIST.map((ratio) => {
            const isSelected = (settings.aspectRatio || "post") === ratio.id;

            return (
              <button
                key={ratio.id}
                type="button"
                onClick={() => { if (lockPremiumFeatures && ratio.premium) { onPremiumBlock?.("Premium size"); return; } selectAspectRatio(ratio.id as AspectRatioType); }}
                className={`relative h-10 px-3 text-xs rounded-lg transition-all capitalize border ${
                  lockPremiumFeatures && ratio.premium
                    ? "opacity-50 cursor-not-allowed border-border"
                    : isSelected
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-white text-muted-foreground hover:bg-muted border-border"
                }`}
              >
                {ratio.label}
                {!isPremium && ratio.premium && (
                  <span className="absolute -top-2 -right-0.5 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 text-[9px] font-bold leading-none bg-card text-muted-foreground border border-border">
                    <HugeiconsIcon icon={CrownIcon} size={10} strokeWidth={2} />
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
