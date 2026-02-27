import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { getUserPlanFromDB } from "@/lib/plans-server";
import { NextRequest, NextResponse } from "next/server";

const MAX_PRESETS = 10;

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT id, name, settings, "createdAt", "updatedAt"
     FROM user_presets
     WHERE "userId" = $1
     ORDER BY "createdAt" ASC`,
    [session.user.id]
  );

  return NextResponse.json({ presets: result.rows });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  const body = await request.json();
  const { name, settings } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "Settings are required" }, { status: 400 });
  }

  // Check preset limit
  const countResult = await pool.query(
    `SELECT COUNT(*)::INTEGER as count FROM user_presets WHERE "userId" = $1`,
    [session.user.id]
  );
  if (countResult.rows[0].count >= MAX_PRESETS) {
    return NextResponse.json({ error: `Maximum ${MAX_PRESETS} presets allowed` }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO user_presets ("userId", name, settings)
     VALUES ($1, $2, $3)
     RETURNING id, name, settings, "createdAt", "updatedAt"`,
    [session.user.id, name.trim(), settings]
  );

  return NextResponse.json({ preset: result.rows[0] });
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const body = await request.json();
  const { id, name, settings } = body;

  if (!id) {
    return NextResponse.json({ error: "Preset id is required" }, { status: 400 });
  }

  const updates: string[] = [];
  const values: unknown[] = [id, session.user.id];
  let paramIndex = 3;

  if (name && typeof name === "string") {
    updates.push(`name = $${paramIndex++}`);
    values.push(name.trim());
  }
  if (settings && typeof settings === "object") {
    updates.push(`settings = $${paramIndex++}`);
    values.push(settings);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  updates.push(`"updatedAt" = NOW()`);

  const result = await pool.query(
    `UPDATE user_presets SET ${updates.join(", ")}
     WHERE id = $1 AND "userId" = $2
     RETURNING id, name, settings, "createdAt", "updatedAt"`,
    values
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  return NextResponse.json({ preset: result.rows[0] });
}

export async function DELETE(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Preset id is required" }, { status: 400 });
  }

  const result = await pool.query(
    `DELETE FROM user_presets WHERE id = $1 AND "userId" = $2 RETURNING id`,
    [id, session.user.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
