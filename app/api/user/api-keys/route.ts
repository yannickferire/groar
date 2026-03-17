import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAuth } from "@/lib/api-auth";
import { getUserPlanFromDB } from "@/lib/plans-server";
import { pool } from "@/lib/db";

// GET — list user's API keys
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT id, name, key, enabled, "createdAt", "lastUsedAt", "requestCount"
     FROM api_key
     WHERE "userId" = $1
     ORDER BY "createdAt" DESC`,
    [session.user.id]
  );

  return NextResponse.json({ keys: result.rows });
}

// POST — generate a new API key
export async function POST(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  // Limit to 1 key per user
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM api_key WHERE "userId" = $1`,
    [session.user.id]
  );
  if (parseInt(countResult.rows[0].count) >= 1) {
    return NextResponse.json(
      { error: "Maximum 1 API key per account" },
      { status: 429 }
    );
  }

  let name = "Default";
  try {
    const body = await request.json();
    if (body.name?.trim()) name = body.name.trim().slice(0, 50);
  } catch {
    // no body is fine, use default name
  }

  const key = `groar_${randomBytes(24).toString("hex")}`;

  const result = await pool.query(
    `INSERT INTO api_key ("userId", key, name)
     VALUES ($1, $2, $3)
     RETURNING id, name, key, enabled, "createdAt", "requestCount"`,
    [session.user.id, key, name]
  );

  return NextResponse.json({ key: result.rows[0] }, { status: 201 });
}

// PATCH — rename or roll an API key
export async function PATCH(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { id, name, roll } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing key id" }, { status: 400 });
  }

  // Roll: generate new key value, reset requestCount
  if (roll) {
    const newKey = `groar_${randomBytes(24).toString("hex")}`;
    const result = await pool.query(
      `UPDATE api_key SET key = $1, "requestCount" = 0, "lastUsedAt" = NULL
       WHERE id = $2 AND "userId" = $3
       RETURNING id, name, key, enabled, "createdAt", "lastUsedAt", "requestCount"`,
      [newKey, id, session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    return NextResponse.json({ key: result.rows[0] });
  }

  // Rename
  if (name !== undefined) {
    const trimmed = (name as string).trim().slice(0, 50);
    if (!trimmed) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    const result = await pool.query(
      `UPDATE api_key SET name = $1
       WHERE id = $2 AND "userId" = $3
       RETURNING id, name, key, enabled, "createdAt", "lastUsedAt", "requestCount"`,
      [trimmed, id, session.user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    return NextResponse.json({ key: result.rows[0] });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}

// DELETE — revoke an API key
export async function DELETE(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing key id" }, { status: 400 });
  }

  const result = await pool.query(
    `DELETE FROM api_key WHERE id = $1 AND "userId" = $2 RETURNING id`,
    [id, session.user.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
