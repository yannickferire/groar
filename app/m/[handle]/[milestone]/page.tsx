import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VsCta from "@/components/VsCta";

type Props = {
  params: Promise<{ handle: string; milestone: string }>;
};

async function getMilestonePost(handle: string, slug: string) {
  const result = await pool.query(
    `SELECT mp.*, u.name, u.image, u."xUsername"
     FROM milestone_post mp
     JOIN "user" u ON u.id = mp."userId"
     WHERE mp.handle = $1 AND mp.slug = $2`,
    [handle, slug]
  );
  return result.rows[0] || null;
}

function formatDisplay(value: number): string {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${(value / 1_000)}K`;
  return value.toLocaleString("en-US");
}

function bgToColor(bg: string): string {
  const map: Record<string, string> = {
    "noisy-lights": "#f0e6ff",
    "northern-lights": "#d4ffd6",
    "tokyo-streets": "#ffd6e8",
    "bled-lakes": "#d6ecff",
    "orangeblue": "#ffe0c2",
  };
  // Dark backgrounds get light text, default to white
  return map[bg] || "#ffffff";
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
  const { handle, milestone } = await params;
  const post = await getMilestonePost(handle, milestone);
  if (!post) return {};

  const display = formatDisplay(post.value);
  const label = metricLabel(post.metric);
  const title = `@${handle} just hit ${display} ${label}!`;
  const description = `Celebrate @${handle}'s milestone: ${display} ${label}. Create your own milestone visual with GROAR.`;

  const bgColor = encodeURIComponent(bgToColor(post.bg || "noisy-lights"));
  const ogImage = `/api/card?template=milestone&m1=${post.metric}:${post.value}&bg=${post.bg || "noisy-lights"}&color=${bgColor}&font=${post.font || "bricolage"}&emoji=${encodeURIComponent(post.emoji || "🎉")}&emojiCount=5&handle=${encodeURIComponent(`@${handle}`)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function MilestonePostPage({ params }: Props) {
  const { handle, milestone } = await params;
  const post = await getMilestonePost(handle, milestone);
  if (!post) notFound();

  const display = formatDisplay(post.value);
  const label = metricLabel(post.metric);
  const cardImageUrl = `/api/card?template=milestone&m1=${post.metric}:${post.value}&bg=${post.bg || "noisy-lights"}&color=${encodeURIComponent(bgToColor(post.bg || "noisy-lights"))}&font=${post.font || "bricolage"}&emoji=${encodeURIComponent(post.emoji || "🎉")}&emojiCount=5&handle=${encodeURIComponent(`@${handle}`)}`;

  return (
    <div className="flex flex-col min-h-screen px-4">
      <Header />
      <main className="flex-1 py-8 mt-4 md:mt-10">
        <article className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">
            {post.emoji || "🎉"} @{handle} just hit {display} {label}!
          </h1>
          <p className="text-muted-foreground mb-8">
            {post.postedAt && `Celebrated on ${new Date(post.postedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
          </p>

          {/* Card preview */}
          <div className="rounded-2xl border border-border overflow-hidden bg-muted/20 max-w-[600px] mx-auto mb-8">
            <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
              <img
                src={cardImageUrl}
                alt={`${display} ${label} milestone card`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Link to profile */}
          <p className="text-sm text-muted-foreground mb-8">
            <Link href={`/m/${handle}`} className="underline hover:text-foreground transition-colors">
              See all milestones by @{handle}
            </Link>
            {post.tweetId && (
              <>
                {" · "}
                <a
                  href={`https://x.com/GROAR_app/status/${post.tweetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground transition-colors"
                >
                  View on X
                </a>
              </>
            )}
          </p>

          <VsCta title="Want to celebrate your milestones too?" />
        </article>
      </main>
      <Footer />
    </div>
  );
}
