"use client";

import Image from "next/image";
import Link from "next/link";
import { EditorSettings, BackgroundPreset, FontFamily, AspectRatioType } from "../Editor";
import { Input } from "@/components/ui/input";
import { isValidHexColor } from "@/lib/validation";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockIcon } from "@hugeicons/core-free-icons";
import { FONT_LIST } from "@/lib/fonts";
import { ASPECT_RATIO_LIST } from "@/lib/aspect-ratios";
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
};

export default function StyleControls({ settings, onSettingsChange, backgrounds, isPremium = false }: StyleControlsProps) {
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

  // Reorder backgrounds: image backgrounds first, solid color last
  const orderedBackgrounds = [
    ...backgrounds.filter(b => !b.color),
    ...backgrounds.filter(b => b.color),
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {/* Background presets */}
      <div className="flex items-center gap-2">
        {orderedBackgrounds.map((preset) => (
          preset.color ? (
            // Solid color preset - integrated color picker
            <div
              key={preset.id}
              className={`relative w-10 h-10 rounded-lg overflow-hidden transition-all shadow-md ${
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
            // Image preset
            preset.premium && !isPremium ? (
              // Premium background - locked for free users
              <Link
                key={preset.id}
                href="/pricing"
                className={`relative w-10 h-10 rounded-lg overflow-hidden transition-all shadow-md opacity-60 hover:opacity-80`}
                title={`${preset.name} - Upgrade to unlock`}
              >
                {preset.image && (
                  <Image
                    src={preset.image}
                    alt={preset.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <HugeiconsIcon icon={LockIcon} size={16} className="text-white" strokeWidth={2} />
                </div>
              </Link>
            ) : (
              // Free or unlocked background
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id)}
                className={`w-10 h-10 rounded-lg overflow-hidden transition-all shadow-md ${
                  settings.background.presetId === preset.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                    : "hover:ring-2 hover:ring-foreground/30"
                }`}
                title={preset.name}
              >
                {preset.image && (
                  <Image
                    src={preset.image}
                    alt={preset.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            )
          )
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Text color */}
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
          className="w-10 h-10 p-0 cursor-pointer border-0 rounded-lg overflow-hidden shadow-md [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
          aria-label="Text color picker"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Font selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Font</span>
        <Select
          value={settings.font || "bricolage"}
          onValueChange={(value) => {
            const font = FONT_LIST.find(f => f.id === value);
            if (font?.premium && !isPremium) {
              // Don't allow selecting premium fonts for free users
              return;
            }
            updateSetting("font", value as FontFamily);
          }}
        >
          <SelectTrigger className="w-[140px] h-10 bg-white shadow-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_LIST.map((font) => (
              <SelectItem
                key={font.id}
                value={font.id}
                disabled={font.premium && !isPremium}
                className="flex items-center justify-between"
              >
                <span style={{ fontFamily: `var(${font.variable})` }}>
                  {font.name}
                </span>
                {font.premium && !isPremium && (
                  <HugeiconsIcon icon={LockIcon} size={12} className="ml-2 text-muted-foreground" strokeWidth={2} />
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Aspect ratio selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Size</span>
        <div className="flex gap-1">
          {ASPECT_RATIO_LIST.map((ratio) => {
            const isSelected = (settings.aspectRatio || "post") === ratio.id;
            const isLocked = ratio.premium && !isPremium;

            if (isLocked) {
              return (
                <Link
                  key={ratio.id}
                  href="/pricing"
                  className="relative px-3 py-1.5 text-xs rounded-md bg-muted/50 text-muted-foreground opacity-60 hover:opacity-80 transition-opacity"
                  title={`${ratio.label} - Upgrade to unlock`}
                >
                  {ratio.label}
                  <HugeiconsIcon
                    icon={LockIcon}
                    size={10}
                    className="absolute -top-1 -right-1 text-muted-foreground"
                    strokeWidth={2}
                  />
                </Link>
              );
            }

            return (
              <button
                key={ratio.id}
                type="button"
                onClick={() => updateSetting("aspectRatio", ratio.id as AspectRatioType)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-white text-muted-foreground hover:bg-muted shadow-md"
                }`}
              >
                {ratio.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
