import { NextResponse, NextRequest } from "next/server";
import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { sendEmail, newFeedbackNotificationEmail } from "@/lib/email";

// POST /api/feedback — submit feedback
export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const body = await request.json();
  const { type, message, page } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > 5000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const feedbackType = ["bug", "feature", "general"].includes(type) ? type : "general";
  const userAgent = request.headers.get("user-agent") || null;

  const result = await pool.query(
    `INSERT INTO feedback ("userId", type, message, page, "userAgent")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, "createdAt"`,
    [session.user.id, feedbackType, message.trim(), page || null, userAgent]
  );

  // Notify admin (fire-and-forget)
  const emailData = newFeedbackNotificationEmail(
    session.user.name || "Unknown",
    session.user.email,
    feedbackType,
    message.trim(),
    page || null
  );
  sendEmail({ to: "yannick.ferire@gmail.com", ...emailData }).catch((err) =>
    console.error("Failed to send feedback notification:", err)
  );

  return NextResponse.json({
    id: result.rows[0].id,
    createdAt: result.rows[0].createdAt,
  });
}

// PATCH /api/feedback — update feedback status (admin only)
export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, status } = body;

  if (!id || !["open", "resolved", "wontfix"].includes(status)) {
    return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
  }

  await pool.query(`UPDATE feedback SET status = $1 WHERE id = $2`, [status, id]);
  return NextResponse.json({ success: true });
}

// GET /api/feedback — list feedback (admin only)
export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status") || "open";
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "50"), 200);

  const result = await pool.query(
    `SELECT f.id, f.type, f.message, f.page, f.status, f."createdAt",
            u.name as "userName", u.email as "userEmail"
     FROM feedback f
     JOIN "user" u ON u.id = f."userId"
     ${status !== "all" ? `WHERE f.status = $2` : ""}
     ORDER BY f."createdAt" DESC
     LIMIT $1`,
    status !== "all" ? [limit, status] : [limit]
  );

  return NextResponse.json({ feedback: result.rows });
}
