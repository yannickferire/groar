"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserLove01Icon,
  EyeIcon,
  FavouriteIcon,
  RepeatIcon,
  Comment01Icon,
  Bookmark01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Loading03Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";

// Simple in-memory cache for analytics data
let analyticsCache: { data: AnalyticsData | null; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

type AnalyticsSnapshot = {
  date: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  impressionsCount: number;
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  quotesCount: number;
  bookmarksCount: number;
  profileClicksCount: number;
  urlClicksCount: number;
  followersGained: number;
  impressionsGained: number;
};

type AnalyticsAccount = {
  accountId: string;
  xUserId: string;
  username: string | null;
  canManualRefresh: boolean;
  snapshots: AnalyticsSnapshot[];
  latest: AnalyticsSnapshot | null;
  summary: {
    totalFollowersGained: number;
    totalImpressions: number;
    totalLikes: number;
    totalReposts: number;
    totalReplies: number;
    avgEngagementRate: number;
  };
};

type AnalyticsData = {
  accounts: AnalyticsAccount[];
  period: {
    days: number;
    from: string;
    to: string;
  };
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function MetricCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: number;
  delta?: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-fade p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{formatNumber(value)}</p>
          </div>
        </div>
        {delta !== undefined && delta !== 0 && (
          <div
            className={`flex items-center gap-1 text-sm ${
              delta > 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            <HugeiconsIcon
              icon={delta > 0 ? ArrowUp01Icon : ArrowDown01Icon}
              size={16}
            />
            <span>{delta > 0 ? "+" : ""}{formatNumber(delta)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const fetchAnalytics = async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh && analyticsCache && Date.now() - analyticsCache.timestamp < CACHE_DURATION) {
      setData(analyticsCache.data);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/analytics?days=30");
      if (!res.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const analyticsData = await res.json();

      // Update cache
      analyticsCache = { data: analyticsData, timestamp: Date.now() };

      setData(analyticsData);
      setError(null);
    } catch (err) {
      setError("Failed to load analytics data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    try {
      // First fetch fresh data from X API
      const fetchRes = await fetch("/api/analytics/fetch", { method: "POST" });
      const fetchData = await fetchRes.json();

      if (!fetchRes.ok) {
        setError(fetchData.error || "Failed to refresh");
        return;
      }

      // Check if already fetched today
      const accountResult = fetchData.accounts?.[0];
      if (accountResult?.alreadyFetched) {
        setRefreshMessage("Already refreshed today. Next refresh available tomorrow.");
      } else if (accountResult?.success) {
        setRefreshMessage("Data refreshed successfully!");
      }

      // Reload the analytics (force refresh to bypass cache)
      await fetchAnalytics(true);
    } catch (err) {
      setError("Failed to refresh data");
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if manual refresh is available
  const canManualRefresh = () => {
    return data?.accounts?.[0]?.canManualRefresh ?? true;
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-10">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Main metrics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border-fade p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-7 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Engagement metrics skeleton */}
        <div className="rounded-2xl border-fade p-6">
          <Skeleton className="h-5 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-6 w-6 mx-auto mb-2 rounded" />
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => fetchAnalytics()}>Try again</Button>
        </div>
      </div>
    );
  }

  const account = data?.accounts?.[0];
  const latest = account?.latest;

  if (!account || !latest) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">No analytics data yet</p>
          <Button onClick={refreshData} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin mr-2" />
                Fetching...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={RefreshIcon} size={18} className="mr-2" />
                Fetch from X
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Analytics</h1>
          {account.username && (
            <p className="text-sm text-muted-foreground mt-1">@{account.username}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={isRefreshing || !canManualRefresh()}
          >
            {isRefreshing ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin mr-2" />
                Refreshing...
              </>
            ) : !canManualRefresh() ? (
              "Refreshed today"
            ) : (
              <>
                <HugeiconsIcon icon={RefreshIcon} size={18} className="mr-2" />
                Refresh
              </>
            )}
          </Button>
          {refreshMessage && (
            <p className="text-xs text-muted-foreground">{refreshMessage}</p>
          )}
        </div>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Followers"
          value={latest.followersCount}
          delta={latest.followersGained}
          icon={<HugeiconsIcon icon={UserLove01Icon} size={24} />}
        />
        <MetricCard
          label="Following"
          value={latest.followingCount}
          icon={<HugeiconsIcon icon={UserLove01Icon} size={24} />}
        />
        <MetricCard
          label="Tweets"
          value={latest.tweetCount}
          icon={<HugeiconsIcon icon={Comment01Icon} size={24} />}
        />
      </div>

      {/* Engagement metrics (from recent tweets) */}
      <div className="rounded-2xl border-fade p-6 space-y-6">
        <h2 className="text-lg font-heading font-semibold">Tweet Engagement (Last 30 days)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {latest.impressionsCount > 0 && (
            <div className="text-center p-3 rounded-xl bg-sidebar">
              <HugeiconsIcon icon={EyeIcon} size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-xl font-bold">{formatNumber(latest.impressionsCount)}</p>
              <p className="text-xs text-muted-foreground">Impressions</p>
            </div>
          )}
          <div className="text-center p-3 rounded-xl bg-sidebar">
            <HugeiconsIcon icon={FavouriteIcon} size={24} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl font-bold">{formatNumber(latest.likesCount)}</p>
            <p className="text-xs text-muted-foreground">Likes</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-sidebar">
            <HugeiconsIcon icon={RepeatIcon} size={24} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl font-bold">{formatNumber(latest.retweetsCount)}</p>
            <p className="text-xs text-muted-foreground">Reposts</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-sidebar">
            <HugeiconsIcon icon={Comment01Icon} size={24} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl font-bold">{formatNumber(latest.repliesCount)}</p>
            <p className="text-xs text-muted-foreground">Replies</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-sidebar">
            <HugeiconsIcon icon={Bookmark01Icon} size={24} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl font-bold">{formatNumber(latest.bookmarksCount)}</p>
            <p className="text-xs text-muted-foreground">Bookmarks</p>
          </div>
        </div>
      </div>

      {/* History */}
      {account.snapshots.length > 1 && (
        <div className="rounded-2xl border-fade p-6 space-y-6">
          <h2 className="text-lg font-heading font-semibold">History</h2>
          <div className="space-y-2">
            {account.snapshots.slice(0, 7).map((snapshot) => (
              <div
                key={snapshot.date}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm text-muted-foreground">
                  {new Date(snapshot.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span>{formatNumber(snapshot.followersCount)} followers</span>
                  {snapshot.followersGained !== 0 && (
                    <span
                      className={
                        snapshot.followersGained > 0
                          ? "text-green-600"
                          : "text-red-500"
                      }
                    >
                      {snapshot.followersGained > 0 ? "+" : ""}
                      {snapshot.followersGained}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(latest.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        {latest.date === new Date().toISOString().split("T")[0] && " (today)"}
      </p>
    </div>
  );
}
