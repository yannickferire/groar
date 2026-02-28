export type PeriodType = "day" | "week" | "month" | "year";

export type MetricType = "followers" | "verifiedFollowers" | "followings" | "posts" | "impressions" | "replies" | "engagementRate" | "engagement" | "profileVisits" | "likes" | "reposts" | "bookmarks";

export type Metric = {
  type: MetricType;
  value: number;
  prefix?: string;
};

export const METRIC_LABELS: Record<MetricType, string> = {
  followers: "Followers",
  verifiedFollowers: "Verified Followers",
  followings: "Followings",
  posts: "Posts",
  impressions: "Impressions",
  replies: "Replies",
  engagementRate: "Engagement Rate",
  engagement: "Engagement",
  profileVisits: "Profile Visits",
  likes: "Likes",
  reposts: "Reposts",
  bookmarks: "Bookmarks",
};

export type BackgroundPreset = {
  id: string;
  name: string;
  image?: string;
  color?: string;
  gradient?: string;
  premium?: boolean;
};

export type BackgroundSettings = {
  presetId: string;
  solidColor?: string;
};

export type PeriodSettings = {
  type: PeriodType;
  number: number;
} | null;

export type AspectRatioType = "post" | "square" | "banner";
export type FontFamily = "bricolage" | "inter" | "space-grotesk" | "dm-mono" | "averia-serif-libre" | "dm-serif-display";
export type TemplateType = "metrics" | "milestone" | "progress";

export type BrandingSettings = {
  logoUrl?: string;
  position: "left" | "center" | "right";
};

export type EditorSettings = {
  handle: string;
  period: PeriodSettings;
  metrics: Metric[];
  background: BackgroundSettings;
  textColor: string;
  aspectRatio?: AspectRatioType;
  font?: FontFamily;
  template?: TemplateType;
  branding?: BrandingSettings;
  goal?: number;
  abbreviateNumbers?: boolean;
};
