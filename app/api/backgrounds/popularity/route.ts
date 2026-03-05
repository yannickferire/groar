import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

// GET: Return global export counts per background (cached 1h)
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT "backgroundId", COUNT(*)::int as count
       FROM export_usage
       WHERE "backgroundId" IS NOT NULL
       GROUP BY "backgroundId"
       ORDER BY count DESC`
    );

    const popularity: Record<string, number> = {};
    for (const row of result.rows) {
      popularity[row.backgroundId] = row.count;
    }

    return NextResponse.json(popularity, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (error) {
    console.error("Background popularity error:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
