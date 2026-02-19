// Font configuration for the editor

export type FontFamily = "bricolage" | "inter" | "space-grotesk" | "dm-mono" | "averia-serif-libre" | "dm-serif-display";

export type FontConfig = {
  name: string;
  variable: string;
  premium: boolean;
};

export const FONTS: Record<FontFamily, FontConfig> = {
  "dm-mono": {
    name: "DM Mono",
    variable: "--font-dm-mono",
    premium: false,
  },
  bricolage: {
    name: "Bricolage Grotesque",
    variable: "--font-bricolage",
    premium: false,
  },
  inter: {
    name: "Inter",
    variable: "--font-inter",
    premium: true,
  },
  "space-grotesk": {
    name: "Space Grotesk",
    variable: "--font-space-grotesk",
    premium: true,
  },
  "averia-serif-libre": {
    name: "Averia Serif Libre",
    variable: "--font-averia-serif-libre",
    premium: true,
  },
  "dm-serif-display": {
    name: "DM Serif Display",
    variable: "--font-dm-serif-display",
    premium: true,
  },
};

export const FONT_LIST = Object.entries(FONTS).map(([id, config]) => ({
  id: id as FontFamily,
  ...config,
}));

export const FREE_FONTS = FONT_LIST.filter((f) => !f.premium);
export const PREMIUM_FONTS = FONT_LIST.filter((f) => f.premium);
