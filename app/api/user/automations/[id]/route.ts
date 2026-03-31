import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";

// GET — get one automation
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { id } = await params;

  const result = await pool.query(
    `SELECT * FROM automation WHERE id = $1 AND "userId" = $2`,
    [id, session.user.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ automation: result.rows[0] });
}

// PATCH — update automation fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();

  // Build dynamic SET clause from allowed fields
  const allowedFields: Record<string, string> = {
    name: "name",
    metric: "metric",
    trigger: "trigger",
    cardTemplate: '"cardTemplate"',
    goal: "goal",
    tweetTemplate: '"tweetTemplate"',
    visualSettings: '"visualSettings"',
    enabled: "enabled",
    scheduleHour: '"scheduleHour"',
    scheduleDay: '"scheduleDay"',
    startDay: '"startDay"',
    startDate: '"startDate"',
  };

  // When enabling a daily/weekly automation, auto-disable others of the same frequency
  let disabledIds: string[] = [];
  if (body.enabled === true) {
    const currentResult = await pool.query(
      `SELECT trigger FROM automation WHERE id = $1 AND "userId" = $2`,
      [id, session.user.id]
    );
    const effectiveTrigger = body.trigger || currentResult.rows[0]?.trigger;
    if (effectiveTrigger === "daily" || effectiveTrigger === "weekly") {
      const disabled = await pool.query(
        `UPDATE automation SET enabled = false, "updatedAt" = NOW()
         WHERE "userId" = $1 AND trigger = $2 AND enabled = true AND id != $3
         RETURNING id`,
        [session.user.id, effectiveTrigger, id]
      );
      disabledIds = disabled.rows.map((r: { id: string }) => r.id);
    }
  }

  const sets: string[] = ['"updatedAt" = NOW()'];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, column] of Object.entries(allowedFields)) {
    if (body[key] !== undefined) {
      values.push(key === "visualSettings" ? JSON.stringify(body[key]) : body[key]);
      sets.push(`${column} = $${paramIndex}`);
      paramIndex++;
    }
  }

  if (values.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id, session.user.id);
  const result = await pool.query(
    `UPDATE automation SET ${sets.join(", ")}
     WHERE id = $${paramIndex} AND "userId" = $${paramIndex + 1}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ automation: result.rows[0], disabledIds });
}

// DELETE — delete automation
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { id } = await params;

  const result = await pool.query(
    `DELETE FROM automation WHERE id = $1 AND "userId" = $2 RETURNING id`,
    [id, session.user.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Clean up any queued posts for this automation
  await pool.query(
    `DELETE FROM x_auto_post WHERE "automationId" = $1 AND status = 'queued'`,
    [id]
  );

  return NextResponse.json({ success: true });
}
