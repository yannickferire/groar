import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { toCdnUrl } from "@/lib/supabase";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor");

  try {
    const { rows } = await pool.query(
      `SELECT e.id, e."imageUrl", e."createdAt", u.name as "userName", u."xUsername", u.image as "userImage"
       FROM export e
       JOIN "user" u ON u.id = e."userId"
       JOIN subscription s ON s."userId" = e."userId"
       WHERE s.plan IN ('pro', 'friend')
         AND s.status IN ('active', 'trialing')
         ${cursor ? `AND e."createdAt" < $2` : ""}
       ORDER BY e."createdAt" DESC
       LIMIT $1`,
      cursor ? [PAGE_SIZE + 1, cursor] : [PAGE_SIZE + 1]
    );

    const hasMore = rows.length > PAGE_SIZE;
    const exports = rows.slice(0, PAGE_SIZE).map((row) => ({
      ...row,
      imageUrl: toCdnUrl(row.imageUrl),
      userImage: toCdnUrl(row.userImage),
    }));
    const nextCursor = hasMore ? exports[exports.length - 1].createdAt : null;

    return NextResponse.json(
      { exports, nextCursor },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json({ exports: [], nextCursor: null });
  }
}
