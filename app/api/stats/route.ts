import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Global stats for landing page (public)
export async function GET() {
  try {
    // Count total exports
    const exportsResult = await pool.query(
      `SELECT COUNT(*) as count FROM "export"`
    );
    const totalExports = parseInt(exportsResult.rows[0].count, 10);

    // Sum followers from all exports (metrics->'followers')
    const followersResult = await pool.query(
      `SELECT COALESCE(SUM(
        CASE
          WHEN jsonb_typeof(metrics) = 'array' THEN (
            SELECT COALESCE(SUM((m->>'value')::numeric), 0)
            FROM jsonb_array_elements(metrics) AS m
            WHERE m->>'type' = 'followers'
          )
          WHEN jsonb_typeof(metrics) = 'object'
            AND jsonb_typeof(metrics->'metrics') = 'array' THEN (
              SELECT COALESCE(SUM((m->>'value')::numeric), 0)
              FROM jsonb_array_elements(metrics->'metrics') AS m
              WHERE m->>'type' = 'followers'
            )
          ELSE 0
        END
      ), 0) as total
      FROM "export"`
    );
    const totalFollowers = parseInt(followersResult.rows[0].total, 10);

    // Sum impressions from all exports
    const impressionsResult = await pool.query(
      `SELECT COALESCE(SUM(
        CASE
          WHEN jsonb_typeof(metrics) = 'array' THEN (
            SELECT COALESCE(SUM((m->>'value')::numeric), 0)
            FROM jsonb_array_elements(metrics) AS m
            WHERE m->>'type' = 'impressions'
          )
          WHEN jsonb_typeof(metrics) = 'object'
            AND jsonb_typeof(metrics->'metrics') = 'array' THEN (
              SELECT COALESCE(SUM((m->>'value')::numeric), 0)
              FROM jsonb_array_elements(metrics->'metrics') AS m
              WHERE m->>'type' = 'impressions'
            )
          ELSE 0
        END
      ), 0) as total
      FROM "export"`
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
