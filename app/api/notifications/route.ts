import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";

// GET /api/notifications — list user notifications
export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "50"), 100);
  const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";

  const whereClause = unreadOnly
    ? `WHERE "userId" = $1 AND read = FALSE`
    : `WHERE "userId" = $1`;

  const result = await pool.query(
    `SELECT id, type, title, body, metadata, read, "createdAt"
     FROM notification
     ${whereClause}
     ORDER BY "createdAt" DESC
     LIMIT $2`,
    [session.user.id, limit]
  );

  // Also get unread count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM notification WHERE "userId" = $1 AND read = FALSE`,
    [session.user.id]
  );

  return NextResponse.json({
    notifications: result.rows,
    unreadCount: parseInt(countResult.rows[0].count),
  });
}

// PATCH /api/notifications — mark as read
export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const body = await request.json();
  const { id, markAllRead } = body;

  if (markAllRead) {
    await pool.query(
      `UPDATE notification SET read = TRUE WHERE "userId" = $1 AND read = FALSE`,
      [session.user.id]
    );
    return NextResponse.json({ success: true });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await pool.query(
    `UPDATE notification SET read = TRUE WHERE id = $1 AND "userId" = $2`,
    [id, session.user.id]
  );

  return NextResponse.json({ success: true });
}
