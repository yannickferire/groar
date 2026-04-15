import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VsCta from "@/components/VsCta";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/m/ProfileAvatar";

type Props = {
  params: Promise<{ handle: string }>;
};

type MilestonePost = {
  metric: string;
  value: number;
  slug: string;
  bg: string | null;
  font: string | null;
  emoji: string | null;
  tweetId: string | null;
  postedAt: string;
};

type UserInfo = {
  name: string | null;
  image: string | null;
  startupName: string | null;
  startupWebsite: string | null;
};

async function getUserMilestones(handle: string): Promise<{ user: UserInfo | null; milestones: MilestonePost[] }> {
  const userResult = await pool.query(
    `SELECT u.name, u.image, tmrr."startupName", tmrr.website as "startupWebsite"
     FROM "user" u
     LEFT JOIN LATERAL (
       SELECT "startupName", website FROM trustmrr_snapshot
       WHERE "userId" = u.id AND "startupName" IS NOT NULL
       ORDER BY date DESC, "createdAt" DESC LIMIT 1
     ) tmrr ON true
     WHERE u."xUsername" = $1`,
    [handle]
  );
  const user = userResult.rows[0] || null;

  const result = await pool.query(
    `SELECT metric, value, slug, bg, font, emoji, "tweetId", "postedAt"
     FROM milestone_post
     WHERE handle = $1
     ORDER BY "postedAt" DESC`,
    [handle]
  );
  return { user, milestones: result.rows };
}

function getHighResAvatar(url: string): string {
  // Twitter: _normal (48px) → _200x200 (sharp at 80px retina)
  if (url.includes("pbs.twimg.com")) return url.replace("_normal", "_200x200");
  // Google: =s96-c → =s200-c
  if (url.includes("googleusercontent.com")) {
    if (/=s\d+/.test(url)) return url.replace(/=s\d+(-c)?/, "=s200-c");
    return url + "=s200-c";
  }
  return url;
}

function bgToColor(bg: string): string {
  const map: Record<string, string> = {
    "noisy-lights": "#f0e6ff",
    "northern-lights": "#d4ffd6",
    "tokyo-streets": "#ffd6e8",
    "bled-lakes": "#d6ecff",
    "orangeblue": "#ffe0c2",
  };
  return map[bg] || "#ffffff";
}

function formatDisplay(value: number): string {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${(value / 1_000)}K`;
  return value.toLocaleString("en-US");
}

function metricLabel(metric: string): string {
  const labels: Record<string, string> = {
    followers: "Followers",
    mrr: "MRR",
    revenue: "Revenue",
    githubStars: "GitHub Stars",
    totalCustomers: "Customers",
  };
  return labels[metric] || metric;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const { milestones } = await getUserMilestones(handle);
  const title = `@${handle}'s Milestones — GROAR`;
  const description = `See all growth milestones achieved by @${handle}. Track your own milestones with GROAR.`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
    // noindex profiles without any milestones (option C)
    robots: milestones.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const { user, milestones } = await getUserMilestones(handle);

  if (!user && milestones.length === 0) notFound();

  const avatarUrl = user?.image && !user.image.startsWith("data:") ? getHighResAvatar(user.image) : null;

  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 py-8 mt-4 md:mt-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            {/* Left: User info */}
            <div className="md:w-64 shrink-0 flex flex-col items-center md:items-start gap-3">
              <ProfileAvatar
                src={avatarUrl}
                alt={user?.name || handle}
                fallbackChar={(user?.name || handle).charAt(0).toUpperCase()}
                handle={handle}
              />
              <div className="text-center md:text-left">
                <h1 className="text-xl md:text-2xl font-bold">
                  {user?.name || handle}
                </h1>
                <a
                  href={`https://x.com/${handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  @{handle}
                </a>
              </div>
              {user?.startupWebsite && (
                <div className="flex flex-col gap-1.5">
                  {user.startupWebsite.split(", ").filter(Boolean).map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${url.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}&sz=32`}
                        alt=""
                        width={14}
                        height={14}
                        loading="lazy"
                        className="rounded-sm shrink-0"
                      />
                      <span className="truncate">{url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                    </a>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {milestones.length} milestone{milestones.length !== 1 ? "s" : ""} celebrated
              </p>
              <Button asChild variant="secondary" className="w-full md:w-auto bg-foreground text-background hover:bg-foreground/90">
                <a
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Check out my milestones on @GROAR_app 🐯`)}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app"}/m/${handle}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share my profile on X
                </a>
              </Button>
            </div>

            {/* Right: Milestones */}
            <div className="flex-1">
              {milestones.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-muted-foreground">Milestones</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {milestones.map((m) => {
                    const cardUrl = `/api/card?template=milestone&m1=${m.metric}:${m.value}&bg=${m.bg || "noisy-lights"}&color=${encodeURIComponent(bgToColor(m.bg || "noisy-lights"))}&font=${m.font || "bricolage"}&emoji=${encodeURIComponent(m.emoji || "🎉")}&emojiCount=5&handle=${encodeURIComponent(`@${handle}`)}`;
                    return (
                      <Link
                        key={m.slug}
                        href={`/m/${handle}/${m.slug}`}
                        className="block rounded-xl border border-border overflow-hidden hover:border-foreground/20 hover:bg-muted/10 transition-colors"
                      >
                        <div className="aspect-video relative">
                          <img
                            src={cardUrl}
                            alt={`${formatDisplay(m.value)} ${metricLabel(m.metric)}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold">{formatDisplay(m.value)} {metricLabel(m.metric)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(m.postedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          {m.tweetId && (
                            <span className="text-xs text-muted-foreground">View on X →</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                    🐯
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">No milestones yet</h2>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      @{handle} hasn&apos;t hit any tracked milestones yet. Check back soon — the next one is just around the corner.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <VsCta title="Track your own milestones" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
