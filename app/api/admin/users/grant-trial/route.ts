import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { TRIAL_DURATION_DAYS } from "@/lib/plans";
import { inngest } from "@/lib/inngest";

export async function POST(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

  // Force-grant trial (admin bypass — works even if user already had a trial)
  const existing = await pool.query(
    `SELECT id FROM subscription WHERE "userId" = $1`,
    [userId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE subscription
       SET plan = 'pro', status = 'trialing', "trialStart" = $2, "trialEnd" = $3,
           "secondTrialAt" = $2, "updatedAt" = NOW()
       WHERE "userId" = $1`,
      [userId, now, trialEnd]
    );
  } else {
    await pool.query(
      `INSERT INTO subscription (id, "userId", plan, status, "trialStart", "trialEnd", "secondTrialAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, 'pro', 'trialing', $2, $3, $2, NOW(), NOW())`,
      [userId, now, trialEnd]
    );
  }

  // Get user info for email sequence
  const userResult = await pool.query(
    `SELECT name, email FROM "user" WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0];

  if (user?.email) {
    // Schedule trial reminder emails
    await inngest.send({
      name: "trial/started",
      data: {
        userId,
        email: user.email,
        name: user.name || "",
        trialEnd: trialEnd.toISOString(),
      },
    });
  }

  return NextResponse.json({ success: true, trialEnd });
}
