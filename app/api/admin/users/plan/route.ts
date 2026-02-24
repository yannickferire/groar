import { requireAuth } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ADMIN_USER_ID = "gZ0hUWX81uLZZLKwRYr4RKyqDNFN6ahc";

export async function POST(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, plan } = await request.json();

  const ALLOWED_PLANS = ["friend", "free", "pro"];
  if (!userId || !plan || !ALLOWED_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Missing userId or invalid plan" }, { status: 400 });
  }

  // Check if user has a subscription row
  const existing = await pool.query(
    `SELECT id FROM subscription WHERE "userId" = $1`,
    [userId]
  );

  if (existing.rows.length > 0) {
    // Update existing subscription
    await pool.query(
      `UPDATE subscription SET plan = $1, status = 'active', "updatedAt" = NOW() WHERE "userId" = $2`,
      [plan, userId]
    );
  } else {
    // Create new subscription
    await pool.query(
      `INSERT INTO subscription (id, "userId", plan, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'active', NOW(), NOW())`,
      [userId, plan]
    );
  }

  return NextResponse.json({ success: true });
}
