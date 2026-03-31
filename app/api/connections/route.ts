import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const result = await pool.query(
    `SELECT id, "accountId", "providerId", "createdAt", username, "profileImageUrl" FROM account WHERE "userId" = $1`,
    [session.user.id]
  );

  return NextResponse.json({ accounts: result.rows });
}
