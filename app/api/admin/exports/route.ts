import { requireAuth } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ADMIN_USER_ID = "gZ0hUWX81uLZZLKwRYr4RKyqDNFN6ahc";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT
      eu.id,
      eu."createdAt",
      eu."template",
      eu."backgroundId",
      eu."handle",
      eu."font",
      eu."fontResolved",
      eu."isWebkit",
      eu."isIos",
      eu."browser",
      eu."os",
      eu."deviceType",
      eu."screenWidth",
      eu."screenHeight",
      eu."source",
      eu."userId",
      u.name as "userName",
      e."imageUrl"
    FROM export_usage eu
    LEFT JOIN "user" u ON u.id = eu."userId"
    LEFT JOIN LATERAL (
      SELECT "imageUrl" FROM export
      WHERE "userId" = eu."userId"
        AND "createdAt" BETWEEN eu."createdAt" - interval '30 seconds' AND eu."createdAt" + interval '30 seconds'
      ORDER BY "createdAt" DESC
      LIMIT 1
    ) e ON eu."userId" IS NOT NULL
    ORDER BY eu."createdAt" DESC
    LIMIT 50`
  );

  return NextResponse.json({ exports: result.rows });
}
