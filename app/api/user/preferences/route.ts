import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch user preferences
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const result = await pool.query(
      `SELECT "emailMilestones" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    const row = result.rows[0];
    return NextResponse.json({
      emailMilestones: row?.emailMilestones ?? true,
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
    const { emailMilestones } = body;

    if (typeof emailMilestones === "boolean") {
      await pool.query(
        `UPDATE "user" SET "emailMilestones" = $1 WHERE id = $2`,
        [emailMilestones, session.user.id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Preferences update error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
