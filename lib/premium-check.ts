import { EditorSettings, BackgroundPreset } from "@/components/Editor";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { FONTS } from "@/lib/fonts";
import { TEMPLATES } from "@/lib/templates";
import { ASPECT_RATIOS } from "@/lib/aspect-ratios";

export type PremiumUsage = {
  isPremium: boolean;
  features: string[];
};

export function checkPremiumFeatures(
  settings: EditorSettings,
  allBackgrounds: BackgroundPreset[]
): PremiumUsage {
  const features: string[] = [];

  // Check background
  const bg = allBackgrounds.find((b) => b.id === settings.background.presetId);
  if (bg?.premium) {
    features.push("Premium background");
  }

  // Check font
  const fontKey = settings.font;
  if (fontKey && FONTS[fontKey]?.premium) {
    features.push(`${FONTS[fontKey].name} font`);
  }

  // Check template
  const templateKey = settings.template || "metrics";
  if (TEMPLATES[templateKey]?.premium) {
    features.push(`${TEMPLATES[templateKey].name} template`);
  }

  // Check aspect ratio
  const ratioKey = settings.aspectRatio || "post";
  if (ASPECT_RATIOS[ratioKey]?.premium) {
    features.push(`${ASPECT_RATIOS[ratioKey].label} format`);
  }

  return {
    isPremium: features.length > 0,
    features,
  };
}
