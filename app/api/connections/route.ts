import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { getUserPlanFromDB } from "@/lib/plans-server";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT id, "accountId", "providerId", "createdAt", username, "profileImageUrl" FROM account WHERE "userId" = $1`,
    [session.user.id]
  );

  return NextResponse.json({ accounts: result.rows });
}
