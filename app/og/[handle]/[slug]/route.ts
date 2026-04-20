import { NextRequest } from "next/server";
import { pool } from "@/lib/db";
import sharp from "sharp";
import { ImageResponse } from "next/og";
import { BACKGROUNDS } from "@/lib/backgrounds";

/**
 * Public OG image endpoint for milestone posts.
 *
 * URL: /og/{handle}/{slug}  (e.g. /og/yannick_ferire/2k-followers)
 *
 * Looks up the milestone_post in DB, generates the card image with stored
 * visual style (bg, font, emoji), and returns a cached JPEG.
 * No auth required — params come from DB, not query string.
 */

const COLORS: Record<string, string> = {
  "noisy-lights": "#f0e6ff",
  "northern-lights": "#d4ffd6",
  "tokyo-streets": "#ffd6e8",
  "bled-lakes": "#d6ecff",
  "orangeblue": "#ffe0c2",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string; slug: string }> }
) {
  const { handle, slug } = await params;

  // Look up milestone from DB
  const result = await pool.query(
    `SELECT metric, value, bg, font, emoji FROM milestone_post WHERE handle = $1 AND slug = $2`,
    [handle, slug]
  );

  const post = result.rows[0];
  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const bg = post.bg || "noisy-lights";
  const font = post.font || "bricolage";
  const emoji = post.emoji || "🎉";
  const color = COLORS[bg] || "#ffffff";

  // Fetch the card image from our internal /api/card endpoint
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";
  const cardUrl = `${siteUrl}/api/card?template=milestone&m1=${post.metric}:${post.value}&bg=${bg}&color=${encodeURIComponent(color)}&font=${font}&emoji=${encodeURIComponent(emoji)}&emojiCount=5&handle=${encodeURIComponent(`@${handle}`)}&watermark=true`;

  const cardResponse = await fetch(cardUrl, {
    headers: { Referer: siteUrl },
  });

  if (!cardResponse.ok) {
    return new Response("Failed to generate image", { status: 500 });
  }

  const buffer = Buffer.from(await cardResponse.arrayBuffer());

  // Ensure JPEG output (should already be JPEG from /api/card default, but be safe)
  const contentType = cardResponse.headers.get("content-type") || "";
  let jpegBuffer: Buffer;
  if (contentType.includes("jpeg")) {
    jpegBuffer = buffer;
  } else {
    jpegBuffer = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
  }

  return new Response(new Uint8Array(jpegBuffer), {
    headers: {
      "Content-Type": "image/jpeg",
      // Long cache: the image is stable (bg/font/emoji stored in DB)
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
