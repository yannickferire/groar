// Font configuration for the editor

export type FontFamily = "bricolage" | "inter" | "space-grotesk" | "dm-mono";

export type FontConfig = {
  name: string;
  variable: string;
  premium: boolean;
};

export const FONTS: Record<FontFamily, FontConfig> = {
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
  "dm-mono": {
    name: "DM Mono",
    variable: "--font-dm-mono",
    premium: false,
  },
};

export const FONT_LIST = Object.entries(FONTS).map(([id, config]) => ({
  id: id as FontFamily,
  ...config,
}));

export const FREE_FONTS = FONT_LIST.filter((f) => !f.premium);
export const PREMIUM_FONTS = FONT_LIST.filter((f) => f.premium);
