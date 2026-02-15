// Font configuration for the editor

export type FontFamily = "bricolage" | "inter" | "playfair" | "space-grotesk";

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
  playfair: {
    name: "Playfair Display",
    variable: "--font-playfair",
    premium: true,
  },
  "space-grotesk": {
    name: "Space Grotesk",
    variable: "--font-space-grotesk",
    premium: true,
  },
};

export const FONT_LIST = Object.entries(FONTS).map(([id, config]) => ({
  id: id as FontFamily,
  ...config,
}));

export const FREE_FONTS = FONT_LIST.filter((f) => !f.premium);
export const PREMIUM_FONTS = FONT_LIST.filter((f) => f.premium);
