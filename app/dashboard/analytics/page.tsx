"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserLove01Icon,
  UserAdd01Icon,
  News01Icon,
  EyeIcon,
  FavouriteIcon,
  RepeatIcon,
  Comment01Icon,
  Bookmark01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Loading03Icon,
  RefreshIcon,
  Link01Icon,
  ArrowDown02Icon,
} from "@hugeicons/core-free-icons";
import { IconSvgElement } from "@hugeicons/react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

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
  createdAt: string;
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
  return num.toLocaleString("en-US");
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

function ComingSoonCard({ label, icon }: { label: string; icon: IconSvgElement }) {
  return (
    <div className="text-center p-3 rounded-xl border-2 border-dashed border-muted-foreground/20 opacity-50">
      <HugeiconsIcon icon={icon} size={24} className="mx-auto mb-2 text-muted-foreground" />
      <p className="text-xl font-bold text-muted-foreground">—</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);

  const fetchAnalytics = async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh && analyticsCache && Date.now() - analyticsCache.timestamp < CACHE_DURATION) {
      setData(analyticsCache.data);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/analytics?days=30");
      if (res.status === 403) {
        setError("premium");
        setIsLoading(false);
        return;
      }
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
    setNeedsReconnect(false);
    try {
      // First fetch fresh data from X API
      const fetchRes = await fetch("/api/analytics/fetch", { method: "POST" });
      const fetchData = await fetchRes.json();

      if (!fetchRes.ok) {
        setError(fetchData.error || "Failed to refresh");
        return;
      }

      // Check for errors in account result
      const accountResult = fetchData.accounts?.[0];

      if (accountResult?.errorCode) {
        // Token expired or needs reconnection
        const errorCode = accountResult.errorCode;
        if (errorCode === "TOKEN_EXPIRED" || errorCode === "REFRESH_FAILED" || errorCode === "MISSING_SCOPE") {
          setError("Session expired");
          setNeedsReconnect(true);
          return;
        }
        setError(accountResult.error || "Failed to refresh");
        return;
      }

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
    return data?.accounts?.[selectedAccountIndex]?.canManualRefresh ?? true;
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

        {/* Coming soon skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="text-center p-3 rounded-xl border-2 border-dashed border-muted-foreground/10">
              <Skeleton className="h-6 w-6 mx-auto mb-2 rounded" />
              <Skeleton className="h-6 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full max-w-5xl mx-auto ${error === "premium" ? "flex items-center justify-center py-32" : ""}`}>
        <div className={`flex flex-col items-center justify-center ${error === "premium" ? "space-y-6 max-w-md text-center" : "h-64 gap-4"}`}>
          {error === "premium" ? (
            <>
              <p className="text-8xl">🦁</p>
              <h1 className="text-4xl font-bold font-heading">Pro feature</h1>
              <p className="text-xl text-muted-foreground">
                Only the king of the jungle can access this.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">{error}</p>
          )}
          {error === "premium" ? (
            <Button asChild size="lg">
              <Link href="/pricing">Upgrade to Pro</Link>
            </Button>
          ) : needsReconnect ? (
            <Button asChild>
              <Link href="/dashboard/connections">
                <HugeiconsIcon icon={Link01Icon} size={16} strokeWidth={2} />
                Reconnect X account
              </Link>
            </Button>
          ) : (
            <Button onClick={() => fetchAnalytics()}>Try again</Button>
          )}
        </div>
      </div>
    );
  }

  const accounts = data?.accounts || [];
  const account = accounts[selectedAccountIndex];
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

  const visibleSnapshots = showAllHistory ? account.snapshots : account.snapshots.slice(0, 7);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Analytics</h1>
          {/* Account selector / username */}
          {accounts.length > 1 ? (
            <div className="flex items-center gap-2 mt-1">
              {accounts.map((acc, i) => (
                <button
                  key={acc.accountId}
                  type="button"
                  onClick={() => { setSelectedAccountIndex(i); setShowAllHistory(false); }}
                  className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
                    i === selectedAccountIndex
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  @{acc.username}
                </button>
              ))}
            </div>
          ) : account.username ? (
            <p className="text-sm text-muted-foreground mt-1">@{account.username}</p>
          ) : null}
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

      {/* Main metrics - from X API */}
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
          icon={<HugeiconsIcon icon={UserAdd01Icon} size={24} />}
        />
        <MetricCard
          label="Posts"
          value={latest.tweetCount}
          icon={<HugeiconsIcon icon={News01Icon} size={24} />}
        />
      </div>

      {/* Coming soon - engagement metrics */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-heading font-semibold">Engagement</h2>
          <p className="text-xs text-muted-foreground mt-1">Coming soon with Chrome extension</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <ComingSoonCard label="Impressions" icon={EyeIcon} />
          <ComingSoonCard label="Likes" icon={FavouriteIcon} />
          <ComingSoonCard label="Reposts" icon={RepeatIcon} />
          <ComingSoonCard label="Replies" icon={Comment01Icon} />
          <ComingSoonCard label="Bookmarks" icon={Bookmark01Icon} />
        </div>
      </div>

      {/* History */}
      {account.snapshots.length > 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-heading font-semibold">History</h2>
            <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
              Last updated: {new Date(latest.createdAt).toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short",
              })}
            </p>
          </div>
          <div className="rounded-2xl border-fade overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-sidebar text-xs text-muted-foreground font-medium uppercase tracking-wide">
              <span>Date</span>
              <span className="text-right">Followers</span>
              <span className="text-right">Following</span>
              <span className="text-right">Posts</span>
            </div>
            {/* Rows */}
            {visibleSnapshots.map((snapshot) => (
              <div
                key={snapshot.date}
                className="grid grid-cols-4 gap-4 px-5 py-3 border-t border-border/50"
              >
                <span className="text-sm text-muted-foreground">
                  {new Date(snapshot.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="text-right text-sm">
                  <span className="font-medium">{formatNumber(snapshot.followersCount)}</span>
                  {snapshot.followersGained !== 0 && (
                    <span className={`ml-1.5 text-xs ${snapshot.followersGained > 0 ? "text-green-600" : "text-red-500"}`}>
                      {snapshot.followersGained > 0 ? "+" : ""}{snapshot.followersGained}
                    </span>
                  )}
                </div>
                <span className="text-right text-sm font-medium">{formatNumber(snapshot.followingCount)}</span>
                <span className="text-right text-sm font-medium">{formatNumber(snapshot.tweetCount)}</span>
              </div>
            ))}
          </div>
          {account.snapshots.length > 7 && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="text-muted-foreground"
              >
                <HugeiconsIcon
                  icon={ArrowDown02Icon}
                  size={16}
                  strokeWidth={1.5}
                  className={`mr-1.5 transition-transform ${showAllHistory ? "rotate-180" : ""}`}
                />
                {showAllHistory ? "Show less" : `Show all (${account.snapshots.length} days)`}
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
