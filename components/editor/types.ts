export type PeriodType = "day" | "week" | "month" | "year";

export type MetricType = "followers" | "verifiedFollowers" | "followings" | "posts" | "impressions" | "replies" | "engagementRate" | "engagement" | "profileVisits" | "likes" | "reposts" | "bookmarks" | "builders" | "mrr" | "arr" | "valuation" | "revenue" | "churnRate" | "ltv" | "newCustomers" | "totalCustomers" | "sales" | "domainRating" | "githubStars" | "githubCommits" | "githubForks" | "githubContributors" | "githubPRsClosed" | "githubIssuesResolved" | "redditKarma" | "redditUpvotes" | "visitors" | "redditUpvoteRatio";

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
  builders: "Builders",
  mrr: "MRR",
  arr: "ARR",
  valuation: "Valuation",
  revenue: "Revenue",
  churnRate: "Churn Rate",
  ltv: "LTV",
  newCustomers: "New Customers",
  totalCustomers: "Total Customers",
  sales: "Sales",
  visitors: "Visitors",
  domainRating: "Domain Rating",
  githubStars: "Stars",
  githubCommits: "Commits",
  githubForks: "Forks",
  githubContributors: "Contributors",
  githubPRsClosed: "PRs Closed",
  githubIssuesResolved: "Issues Resolved",
  redditKarma: "Karma",
  redditUpvotes: "Upvotes",
  redditUpvoteRatio: "Upvote Ratio",
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

export type HeadingType = "period" | "last" | "date-range" | "quote" | "custom";

export type HeadingSettings = {
  type: HeadingType;
  // Period mode (handles both single "Week 1" and range "Week 1–4")
  periodType?: PeriodType;
  periodFrom?: number;
  periodTo?: number; // when set, renders "Week 1–4" range style
  // Last mode ("Last 7 days")
  lastCount?: number;
  lastUnit?: PeriodType;
  // Date range mode ("Jan 1 – Mar 2")
  dateFrom?: string; // ISO date string "2026-01-01"
  dateTo?: string;   // ISO date string "2026-03-02"
  // Headline / Quote / Custom mode
  text?: string;
} | null;

export type AspectRatioType = "post" | "square" | "banner";
export type FontFamily = "bricolage" | "inter" | "space-grotesk" | "dm-mono" | "averia-serif-libre" | "dm-serif-display";
export type TemplateType = "metrics" | "milestone" | "progress" | "announcement";

export type BrandingLogo = {
  id: string;
  url: string;
  createdAt: string;
};

export type BrandingSettings = {
  logoUrl?: string;
  position: "left" | "center" | "right";
  logoSize?: number; // height in px, 20–60, default 40
  enabled?: boolean; // default true when logoUrl is set
};

export type EditorSettings = {
  handle: string;
  period: PeriodSettings;
  heading: HeadingSettings;
  metrics: Metric[];
  background: BackgroundSettings;
  textColor: string;
  aspectRatio?: AspectRatioType;
  font?: FontFamily;
  template?: TemplateType;
  branding?: BrandingSettings;
  goal?: number;
  announcements?: { emoji?: string; text: string }[];
  abbreviateNumbers?: boolean;
  milestoneEmoji?: string;
  milestoneEmojiCount?: number; // 0–10, default 3
};
