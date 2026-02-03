import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    `SELECT id, "accountId", "providerId", "createdAt" FROM account WHERE "userId" = $1`,
    [session.user.id]
  );

  return NextResponse.json({ accounts: result.rows });
}
