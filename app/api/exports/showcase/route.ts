import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

// Public endpoint — returns the 3 latest exports from Pro users for the landing page
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT e."imageUrl"
       FROM export e
       JOIN subscription s ON s."userId" = e."userId"
       WHERE s.plan IN ('pro', 'friend')
         AND s.status IN ('active', 'trialing')
       ORDER BY e."createdAt" DESC
       LIMIT 3`
    );

    return NextResponse.json(
      { images: rows.map((r) => r.imageUrl) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json({ images: [] });
  }
}
