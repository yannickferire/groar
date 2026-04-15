import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const PREFERENCE_FIELDS = ["emailMilestones", "emailTrialReminders", "emailProductUpdates", "emailAutomation", "botMilestones"] as const;

// GET: Fetch user preferences
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const result = await pool.query(
      `SELECT "emailMilestones", "emailTrialReminders", "emailProductUpdates", "emailAutomation", "botMilestones" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    const row = result.rows[0];
    return NextResponse.json({
      emailMilestones: row?.emailMilestones ?? true,
      emailTrialReminders: row?.emailTrialReminders ?? true,
      emailProductUpdates: row?.emailProductUpdates ?? true,
      emailAutomation: row?.emailAutomation ?? true,
      botMilestones: row?.botMilestones ?? true,
    });
  } catch (error) {
    console.error("Preferences fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

// PATCH: Update user preferences
export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const body = await request.json();

    const sets: string[] = [];
    const values: (boolean | string)[] = [];
    let paramIndex = 1;

    for (const field of PREFERENCE_FIELDS) {
      if (typeof body[field] === "boolean") {
        sets.push(`"${field}" = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (sets.length > 0) {
      values.push(session.user.id);
      await pool.query(
        `UPDATE "user" SET ${sets.join(", ")} WHERE id = $${paramIndex}`,
        values
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Preferences update error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
