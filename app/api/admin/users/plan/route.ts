import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

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

  // Gift plans (pro, friend) get lifetime billing period
  const billingPeriod = plan === "free" ? null : "lifetime";

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE subscription SET plan = $1, status = 'active', "billingPeriod" = COALESCE($3, "billingPeriod"), "updatedAt" = NOW() WHERE "userId" = $2`,
      [plan, userId, billingPeriod]
    );
  } else {
    await pool.query(
      `INSERT INTO subscription (id, "userId", plan, status, "billingPeriod", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'active', $3, NOW(), NOW())`,
      [userId, plan, billingPeriod]
    );
  }

  return NextResponse.json({ success: true });
}
