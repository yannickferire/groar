import Image from "next/image";
import Link from "next/link";
import { pool } from "@/lib/db";
import { ADMIN_USER_ID } from "@/lib/api-auth";
import XIcon from "@/components/icons/XIcon";

type LeaderboardUser = {
  name: string | null;
  image: string | null;
  xUsername: string | null;
  score: number;
  startupWebsite: string | null;
};

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

function Avatar({ image, name }: { image: string | null; name: string | null }) {
  if (image) {
    return (
      <Image
        src={getHiResAvatar(image)}
        alt={name || "User"}
        width={80}
        height={80}
        className="w-9 h-9 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return null;
}

function ProjectLinks({ startupWebsite }: { startupWebsite: string | null }) {
  if (!startupWebsite) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap mt-0.5">
      {startupWebsite.split(", ").filter(Boolean).map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
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

async function getTopLeaderboard(): Promise<LeaderboardUser[]> {
  try {
    const result = await pool.query(
      `SELECT
        u.name, u.image, u."xUsername",
        COALESCE(dp.score, 0)::int AS "score",
        tmrr.website AS "startupWebsite"
      FROM "user" u
      INNER JOIN user_stats s ON s."userId" = u.id
      LEFT JOIN LATERAL (
        SELECT SUM(points) AS score FROM daily_points
        WHERE "userId" = u.id AND date > CURRENT_DATE - 30
      ) dp ON true
      LEFT JOIN LATERAL (
        SELECT "startupName", website FROM trustmrr_snapshot
        WHERE "userId" = u.id AND "startupName" IS NOT NULL
        ORDER BY date DESC, "createdAt" DESC LIMIT 1
      ) tmrr ON true
      WHERE COALESCE(dp.score, 0) > 0 AND u.id != $1
      ORDER BY dp.score DESC, s."updatedAt" ASC
      LIMIT 3`,
      [ADMIN_USER_ID]
    );
    return result.rows;
  } catch {
    return [];
  }
}

async function getFastestBuyers(): Promise<FastestBuyer[]> {
  try {
    const result = await pool.query(
      `SELECT
        u.name, u.image, u."xUsername",
        EXTRACT(EPOCH FROM (s."updatedAt" - s."trialStart"))::int as "secondsToBuy",
        tmrr.website AS "startupWebsite"
      FROM "user" u
      JOIN subscription s ON s."userId" = u.id
      LEFT JOIN LATERAL (
        SELECT "startupName", website FROM trustmrr_snapshot
        WHERE "userId" = u.id AND "startupName" IS NOT NULL
        ORDER BY date DESC, "createdAt" DESC LIMIT 1
      ) tmrr ON true
      WHERE s."externalCustomerId" IS NOT NULL
        AND s.plan = 'pro'
        AND s."billingPeriod" = 'lifetime'
        AND s."trialStart" IS NOT NULL
        AND u.id != $1
      ORDER BY (s."updatedAt" - s."trialStart") ASC
      LIMIT 3`,
      [ADMIN_USER_ID]
    );
    return result.rows;
  } catch {
    return [];
  }
}

export default async function CommunityHighlights() {
  const [leaderboard, fastestBuyers] = await Promise.all([
    getTopLeaderboard(),
    getFastestBuyers(),
  ]);

  if (leaderboard.length === 0 && fastestBuyers.length === 0) return null;

  return (
    <section className="w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-heading font-bold">Community highlights</h2>
        <p className="text-sm text-muted-foreground mt-2">
          The most active creators and the fastest to go Pro.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 3 leaderboard */}
        {leaderboard.length > 0 && (
          <div>
            <div className="rounded-2xl border-fade overflow-hidden">
              <div className="px-4 md:px-5 py-3 bg-sidebar text-xs text-muted-foreground font-medium uppercase tracking-wide flex justify-between">
                <span>Top Creators</span>
                <span>Score</span>
              </div>
              {leaderboard.map((user, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 md:px-5 py-3 min-h-[4.25rem] border-t border-border/50"
                >
                  <span className="w-7 text-center shrink-0">
                    <RankBadge rank={i + 1} />
                  </span>
                  <Avatar image={user.image} name={user.name} />
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {user.name || "Anonymous"}
                      </span>
                      {user.xUsername && (
                        <a
                          href={`https://x.com/${user.xUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group shrink-0"
                        >
                          <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                            <XIcon className="w-3 h-3 fill-current" />
                          </span>
                          <span>@{user.xUsername}</span>
                        </a>
                      )}
                    </div>
                    {user.startupWebsite && <ProjectLinks startupWebsite={user.startupWebsite} />}
                  </div>
                  <span className="text-sm font-mono font-bold shrink-0">{user.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 3 fastest buyers */}
        {fastestBuyers.length > 0 && (
          <div>
            <div className="rounded-2xl border-fade overflow-hidden">
              <div className="px-4 md:px-5 py-3 bg-sidebar text-xs text-muted-foreground font-medium uppercase tracking-wide flex justify-between">
                <span>Fastest Buyers</span>
                <span>Time</span>
              </div>
              {fastestBuyers.map((buyer, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 md:px-5 py-3 min-h-[4.25rem] border-t border-border/50"
                >
                  <span className="w-7 text-center shrink-0">
                    <RankBadge rank={i + 1} />
                  </span>
                  <Avatar image={buyer.image} name={buyer.name} />
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {buyer.name || (buyer.xUsername ? `@${buyer.xUsername}` : "Anonymous")}
                      </span>
                      {buyer.xUsername && buyer.name && (
                        <a
                          href={`https://x.com/${buyer.xUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group shrink-0"
                        >
                          <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                            <XIcon className="w-3 h-3 fill-current" />
                          </span>
                          <span>@{buyer.xUsername}</span>
                        </a>
                      )}
                    </div>
                    {buyer.startupWebsite && <ProjectLinks startupWebsite={buyer.startupWebsite} />}
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

      <div className="text-center mt-6">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          See full leaderboard →
        </Link>
      </div>
    </section>
  );
}
