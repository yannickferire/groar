import { Pool } from "pg";
import { NextResponse } from "next/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET: Global stats for landing page (public)
export async function GET() {
  try {
    // Count total exports
    const exportsResult = await pool.query(
      `SELECT COUNT(*) as count FROM export`
    );
    const totalExports = parseInt(exportsResult.rows[0].count, 10);

    // Sum followers from all exports (metrics->'followers')
    const followersResult = await pool.query(
      `SELECT COALESCE(SUM((
        SELECT COALESCE(SUM((m->>'value')::numeric), 0)
        FROM jsonb_array_elements(metrics) AS m
        WHERE m->>'type' = 'followers'
      )), 0) as total
      FROM export`
    );
    const totalFollowers = parseInt(followersResult.rows[0].total, 10);

    // Sum impressions from all exports
    const impressionsResult = await pool.query(
      `SELECT COALESCE(SUM((
        SELECT COALESCE(SUM((m->>'value')::numeric), 0)
        FROM jsonb_array_elements(metrics) AS m
        WHERE m->>'type' = 'impressions'
      )), 0) as total
      FROM export`
    );
    const totalImpressions = parseInt(impressionsResult.rows[0].total, 10);

    return NextResponse.json({
      totalExports,
      totalFollowers,
      totalImpressions,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({
      totalExports: 0,
      totalFollowers: 0,
      totalImpressions: 0,
    });
  }
}
