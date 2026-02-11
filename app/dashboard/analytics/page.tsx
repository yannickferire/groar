"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardContent className="p-4">
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
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics?days=30");
      if (!res.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const analyticsData = await res.json();
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

      // Reload the analytics
      await fetchAnalytics();
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
      <div className="flex items-center justify-center h-64">
        <HugeiconsIcon
          icon={Loading03Icon}
          size={32}
          className="animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchAnalytics}>Try again</Button>
      </div>
    );
  }

  const account = data?.accounts?.[0];
  const latest = account?.latest;

  if (!account || !latest) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          {account.username && (
            <p className="text-muted-foreground">@{account.username}</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tweet Engagement (Last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {latest.impressionsCount > 0 && (
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <HugeiconsIcon icon={EyeIcon} size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-xl font-bold">{formatNumber(latest.impressionsCount)}</p>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </div>
            )}
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <HugeiconsIcon icon={FavouriteIcon} size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-xl font-bold">{formatNumber(latest.likesCount)}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <HugeiconsIcon icon={RepeatIcon} size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-xl font-bold">{formatNumber(latest.retweetsCount)}</p>
              <p className="text-xs text-muted-foreground">Reposts</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <HugeiconsIcon icon={Comment01Icon} size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-xl font-bold">{formatNumber(latest.repliesCount)}</p>
              <p className="text-xs text-muted-foreground">Replies</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <HugeiconsIcon icon={Bookmark01Icon} size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-xl font-bold">{formatNumber(latest.bookmarksCount)}</p>
              <p className="text-xs text-muted-foreground">Bookmarks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {account.snapshots.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">History</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
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
