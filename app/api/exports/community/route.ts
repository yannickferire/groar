import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { toCdnUrl } from "@/lib/supabase";

const PAGE_SIZE = 12;
// Fetch extra rows to account for consecutive-user dedup
const FETCH_MULTIPLIER = 3;

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor");

  try {
    const queries: [ReturnType<typeof pool.query>, ReturnType<typeof pool.query>] | [ReturnType<typeof pool.query>] = [
      pool.query(
        `SELECT e.id, e."imageUrl", e."createdAt", e."userId",
                u.name as "userName", u."xUsername", u.image as "userImage"
         FROM export e
         JOIN "user" u ON u.id = e."userId"
         JOIN subscription s ON s."userId" = e."userId"
         WHERE s.plan IN ('pro', 'friend')
           AND s.status IN ('active', 'trialing')
           ${cursor ? `AND e."createdAt" < $2` : ""}
         ORDER BY e."createdAt" DESC
         LIMIT $1`,
        cursor ? [PAGE_SIZE * FETCH_MULTIPLIER, cursor] : [PAGE_SIZE * FETCH_MULTIPLIER]
      ),
    ];

    // Only fetch total count on first page (DB exports + anonymous counter)
    if (!cursor) {
      queries.push(pool.query(
        `SELECT
          (SELECT COUNT(*)::int FROM export) +
          COALESCE((SELECT value::int FROM counter WHERE key = 'anonymous_exports'), 0)
          as count`
      ));
    }

    const results = await Promise.all(queries);
    const { rows } = results[0];
    const totalExports = !cursor && results[1] ? results[1].rows[0].count : undefined;

    // Remove consecutive exports by the same user
    const deduped: typeof rows = [];
    let lastUserId: string | null = null;
    for (const row of rows) {
      if (row.userId !== lastUserId) {
        deduped.push(row);
        lastUserId = row.userId;
        if (deduped.length > PAGE_SIZE) break;
      }
    }

    const hasMore = deduped.length > PAGE_SIZE;
    const page = deduped.slice(0, PAGE_SIZE);
    const exports = page.map((row) => ({
      id: row.id,
      imageUrl: toCdnUrl(row.imageUrl),
      createdAt: row.createdAt,
      userName: row.userName,
      xUsername: row.xUsername,
      userImage: toCdnUrl(row.userImage),
    }));
    const nextCursor = hasMore ? exports[exports.length - 1].createdAt : null;

    return NextResponse.json(
      { exports, nextCursor, ...(totalExports !== undefined && { totalExports }) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json({ exports: [], nextCursor: null, totalExports: 0 });
  }
}
