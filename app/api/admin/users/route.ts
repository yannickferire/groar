import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ADMIN_USER_ID = "gZ0hUWX81uLZZLKwRYr4RKyqDNFN6ahc";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT
      u.id,
      u.name,
      u.email,
      u."createdAt" as "userCreatedAt",
      s.plan,
      s.status,
      s."trialStart",
      s."trialEnd",
      s."externalId",
      s."externalCustomerId",
      s."currentPeriodStart",
      s."currentPeriodEnd",
      s."billingPeriod",
      s."createdAt" as "subscriptionCreatedAt",
      s."updatedAt" as "subscriptionUpdatedAt",
      (SELECT COUNT(*) FROM export WHERE "userId" = u.id) as "exportCount",
      (SELECT string_agg("providerId", ', ') FROM account WHERE "userId" = u.id) as "providers"
    FROM "user" u
    LEFT JOIN subscription s ON s."userId" = u.id
    ORDER BY u."createdAt" DESC`
  );

  return NextResponse.json({ users: result.rows });
}
