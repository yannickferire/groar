"use client";

import LeaderboardTable, { type LeaderboardEntry } from "@/components/dashboard/LeaderboardTable";

export default function PublicLeaderboardClient({ initialLeaderboard }: { initialLeaderboard: LeaderboardEntry[] }) {
  return <LeaderboardTable apiUrl="/api/leaderboard/public" initialData={initialLeaderboard} />;
}
