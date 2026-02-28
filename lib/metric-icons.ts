import { MetricType } from "@/components/Editor";
import { UserLove01Icon, CheckmarkBadge02Icon, UserAdd01Icon, News01Icon, EyeIcon, Comment01Icon, Activity01Icon, Tap01Icon, UserCircleIcon, FavouriteIcon, RepeatIcon, Bookmark01Icon } from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";

export const METRIC_ICONS: Record<MetricType, IconSvgElement> = {
  followers: UserLove01Icon,
  verifiedFollowers: CheckmarkBadge02Icon,
  followings: UserAdd01Icon,
  posts: News01Icon,
  impressions: EyeIcon,
  replies: Comment01Icon,
  engagementRate: Activity01Icon,
  engagement: Tap01Icon,
  profileVisits: UserCircleIcon,
  likes: FavouriteIcon,
  reposts: RepeatIcon,
  bookmarks: Bookmark01Icon,
};
