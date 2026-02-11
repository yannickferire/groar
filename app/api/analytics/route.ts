import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Get stored X analytics for the current user
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 365);
    const accountId = searchParams.get("accountId"); // Optional: filter by specific account

    // Get user's X accounts
    const accountsResult = await pool.query(
      `SELECT a.id, a."accountId" as "xUserId", u."xUsername" as username
       FROM account a
       JOIN "user" u ON a."userId" = u.id
       WHERE a."userId" = $1 AND a."providerId" = 'twitter'
       ${accountId ? 'AND a.id = $2' : ''}`,
      accountId ? [session.user.id, accountId] : [session.user.id]
    );

    if (accountsResult.rows.length === 0) {
      return NextResponse.json({
        accounts: [],
        message: "No X account connected",
      });
    }

    const accountIds = accountsResult.rows.map((a) => a.id);
    const today = new Date().toISOString().split("T")[0];

    // Check if manual refresh was already done today
    const manualFetchResult = await pool.query(
      `SELECT "accountId" FROM x_analytics_snapshot
       WHERE "accountId" = ANY($1) AND date = $2 AND "fetchType" = 'manual'`,
      [accountIds, today]
    );
    const manualFetchedAccountIds = new Set(manualFetchResult.rows.map(r => r.accountId));

    // Get analytics snapshots for the last N days
    const analyticsResult = await pool.query(
      `SELECT
        "accountId",
        date,
        "followersCount",
        "followingCount",
        "tweetCount",
        "listedCount",
        "impressionsCount",
        "likesCount",
        "retweetsCount",
        "repliesCount",
        "quotesCount",
        "bookmarksCount",
        "profileClicksCount",
        "urlClicksCount",
        "followersGained",
        "impressionsGained"
       FROM x_analytics_snapshot
       WHERE "accountId" = ANY($1)
         AND date >= CURRENT_DATE - INTERVAL '1 day' * $2
       ORDER BY "accountId", date DESC`,
      [accountIds, days]
    );

    // Group snapshots by account
    const accountsMap = new Map<string, {
      accountId: string;
      xUserId: string;
      username: string | null;
      canManualRefresh: boolean;
      snapshots: typeof analyticsResult.rows;
      latest: typeof analyticsResult.rows[0] | null;
      summary: {
        totalFollowersGained: number;
        totalImpressions: number;
        totalLikes: number;
        totalReposts: number;
        totalReplies: number;
        avgEngagementRate: number;
      };
    }>();

    // Initialize accounts
    for (const account of accountsResult.rows) {
      accountsMap.set(account.id, {
        accountId: account.id,
        xUserId: account.xUserId,
        username: account.username,
        canManualRefresh: !manualFetchedAccountIds.has(account.id),
        snapshots: [],
        latest: null,
        summary: {
          totalFollowersGained: 0,
          totalImpressions: 0,
          totalLikes: 0,
          totalReposts: 0,
          totalReplies: 0,
          avgEngagementRate: 0,
        },
      });
    }

    // Populate snapshots
    for (const snapshot of analyticsResult.rows) {
      const account = accountsMap.get(snapshot.accountId);
      if (account) {
        account.snapshots.push(snapshot);
        if (!account.latest) {
          account.latest = snapshot;
        }
      }
    }

    // Calculate summaries
    for (const account of accountsMap.values()) {
      if (account.snapshots.length > 0) {
        account.summary.totalFollowersGained = account.snapshots.reduce(
          (sum, s) => sum + (s.followersGained || 0),
          0
        );
        account.summary.totalImpressions = account.latest?.impressionsCount || 0;
        account.summary.totalLikes = account.latest?.likesCount || 0;
        account.summary.totalReposts = account.latest?.retweetsCount || 0;
        account.summary.totalReplies = account.latest?.repliesCount || 0;

        // Calculate engagement rate
        const totalEngagements =
          account.summary.totalLikes +
          account.summary.totalReposts +
          account.summary.totalReplies;
        if (account.summary.totalImpressions > 0) {
          account.summary.avgEngagementRate =
            (totalEngagements / account.summary.totalImpressions) * 100;
        }
      }
    }

    return NextResponse.json({
      accounts: Array.from(accountsMap.values()),
      period: {
        days,
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        to: new Date().toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
