import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { getUserPlanFromDB } from "@/lib/plans-server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT id, "accountId", "providerId", "createdAt" FROM account WHERE "userId" = $1`,
    [session.user.id]
  );

  return NextResponse.json({ accounts: result.rows });
}
