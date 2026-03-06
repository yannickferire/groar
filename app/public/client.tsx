"use client";

import LeaderboardTable from "@/components/dashboard/LeaderboardTable";

export default function PublicLeaderboardClient() {
  return <LeaderboardTable apiUrl="/api/leaderboard/public" />;
}
