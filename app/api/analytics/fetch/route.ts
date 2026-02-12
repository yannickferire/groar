import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { fetchAccountAnalytics, getUserXAccounts } from "@/lib/analytics";

// Manual fetch - called by user from dashboard or editor
export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accounts = await getUserXAccounts(session.user.id);

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: "No X account connected" },
        { status: 404 }
      );
    }

    const results = [];
    const today = new Date().toISOString().split("T")[0];

    for (const account of accounts) {
      const { id: accountDbId, accountId: xUserId, accessToken, refreshToken } = account;

      if (!accessToken) {
        results.push({
          accountId: accountDbId,
          error: "No access token",
          errorCode: "TOKEN_EXPIRED",
        });
        continue;
      }

      const result = await fetchAccountAnalytics(
        accountDbId,
        xUserId,
        accessToken,
        "manual", // Manual fetch type
        refreshToken // Pass refresh token for auto-refresh
      );

      results.push(result);
    }

    return NextResponse.json({
      success: true,
      date: today,
      fetchType: "manual",
      accounts: results,
    });
  } catch (error) {
    console.error("Error fetching X analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
