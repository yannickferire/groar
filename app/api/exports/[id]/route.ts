import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { id } = await params;

  const result = await pool.query(
    `SELECT id, "imageUrl", "metrics", "createdAt"
     FROM export
     WHERE id = $1 AND "userId" = $2`,
    [id, session.user.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }

  return NextResponse.json({ export: result.rows[0] });
}
