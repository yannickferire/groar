import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { postMilestoneAsBot } from "@/lib/groar-bot";

/**
 * Admin-only endpoint to test the GROAR bot end-to-end.
 *
 * Posts a real milestone tweet from @GROAR_app and inserts a row in milestone_post.
 * Use this to verify the full pipeline (OAuth → tweet → DB → public page) without
 * waiting for the Inngest cron.
 *
 * Body: { userId: string, metric: "followers" | "mrr", value: number }
 *
 * Example:
 *   curl -X POST https://groar.app/api/admin/test-bot-milestone \
 *     -H "Content-Type: application/json" \
 *     -H "Cookie: <your-session-cookie>" \
 *     -d '{"userId":"abc-123","metric":"followers","value":2000}'
 */
export async function POST(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, metric, value } = await request.json();
  if (!userId || !metric || typeof value !== "number") {
    return NextResponse.json(
      { error: "Missing fields. Required: userId, metric, value (number)" },
      { status: 400 }
    );
  }

  // Get the user's xUsername (handle for the bot tweet)
  const userResult = await pool.query(
    `SELECT "xUsername" FROM "user" WHERE id = $1`,
    [userId]
  );
  const handle = userResult.rows[0]?.xUsername;
  if (!handle) {
    return NextResponse.json(
      { error: "User has no xUsername — connect X first" },
      { status: 400 }
    );
  }

  const result = await postMilestoneAsBot(userId, handle, metric, value);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error, handle, metric, value },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";
  return NextResponse.json({
    success: true,
    tweetId: result.tweetId,
    tweetUrl: `https://x.com/GROAR_app/status/${result.tweetId}`,
    milestoneUrl: `${siteUrl}/m/${handle}`,
  });
}
