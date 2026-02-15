// Aspect ratio configuration for the editor

import { AspectRatioType } from "@/components/Editor";

export type AspectRatioConfig = {
  width: number;
  height: number;
  label: string;
  ratio: string;
  premium: boolean;
};

export const ASPECT_RATIOS: Record<AspectRatioType, AspectRatioConfig> = {
  post: {
    width: 1200,
    height: 675,
    label: "Post",
    ratio: "16/9",
    premium: false,
  },
  square: {
    width: 1200,
    height: 1200,
    label: "Square",
    ratio: "1/1",
    premium: true,
  },
  banner: {
    width: 1500,
    height: 500,
    label: "Banner",
    ratio: "3/1",
    premium: true,
  },
};

export const ASPECT_RATIO_LIST = Object.entries(ASPECT_RATIOS).map(([id, config]) => ({
  id: id as AspectRatioType,
  ...config,
}));

export const FREE_ASPECT_RATIOS = ASPECT_RATIO_LIST.filter((r) => !r.premium);
export const PREMIUM_ASPECT_RATIOS = ASPECT_RATIO_LIST.filter((r) => r.premium);
