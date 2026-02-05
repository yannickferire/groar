import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Public avatars for landing page (last 7 users with images)
export async function GET() {
  try {
    const totalResult = await pool.query(
      `SELECT COUNT(*) as count FROM "user"`
    );
    const totalUsers = parseInt(totalResult.rows[0].count, 10);

    const avatarsResult = await pool.query(
      `SELECT "image", "name"
       FROM "user"
       WHERE "image" IS NOT NULL
       ORDER BY "createdAt" DESC
       LIMIT 7`
    );

    return NextResponse.json({
      totalUsers,
      avatars: avatarsResult.rows,
    });
  } catch (error) {
    console.error("Loved-by error:", error);
    return NextResponse.json({
      totalUsers: 0,
      avatars: [],
    });
  }
}
