"use client";

import Image from "next/image";
import LeaderboardTable, { type LeaderboardEntry } from "@/components/dashboard/LeaderboardTable";

type FastestBuyer = {
  name: string | null;
  image: string | null;
  xUsername: string | null;
  secondsToBuy: number;
  startupWebsite: string | null;
};

function getHiResAvatar(url: string): string {
  if (url.includes("googleusercontent.com")) return url.replace(/=s\d+-c/, "=s256-c");
  if (url.includes("pbs.twimg.com")) return url.replace("_normal", "_200x200");
  return url;
}

function BuyerAvatar({ image, name }: { image: string | null; name: string | null }) {
  if (image) {
    return (
      <Image
        src={getHiResAvatar(image)}
        alt={name || "User"}
        width={80}
        height={80}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

function formatBuyTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hours < 24) return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours > 0 ? `${days}d ${remainHours}h` : `${days}d`;
}

export default function PublicLeaderboardClient({
  initialLeaderboard,
  fastestBuyers,
}: {
  initialLeaderboard: LeaderboardEntry[];
  fastestBuyers: FastestBuyer[];
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 min-w-0 w-full">
        <LeaderboardTable apiUrl="/api/leaderboard/public" initialData={initialLeaderboard} compact />
      </div>

      {fastestBuyers.length > 0 && (
        <div className="w-full lg:w-72 shrink-0">
          <p className="text-xs text-muted-foreground text-right mb-3">All time</p>
          <div className="rounded-2xl border-fade overflow-hidden">
            <div className="px-4 md:px-5 py-3 bg-sidebar text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Fastest Buyers
            </div>
            {fastestBuyers.map((buyer, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 md:px-5 py-3 border-t border-border/50"
              >
                <span className="text-lg w-7 text-center shrink-0">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </span>
                <BuyerAvatar image={buyer.image} name={buyer.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {buyer.name || (buyer.xUsername ? `@${buyer.xUsername}` : "Anonymous")}
                  </p>
                  {buyer.xUsername && buyer.name && (
                    <p className="text-xs text-muted-foreground truncate">@{buyer.xUsername}</p>
                  )}
                  {buyer.startupWebsite && (
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {buyer.startupWebsite.split(", ").filter(Boolean).map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Image
                            src={`https://www.google.com/s2/favicons?domain=${url.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}&sz=32`}
                            alt=""
                            width={14}
                            height={14}
                            className="rounded-sm shrink-0"
                          />
                          <span className="truncate">{url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-sm font-mono font-bold text-primary shrink-0">
                  {formatBuyTime(buyer.secondsToBuy)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
