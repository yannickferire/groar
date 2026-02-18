import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Global stats for landing page (public)
export async function GET() {
  try {
    // Count total exports (DB exports + anonymous exports)
    const exportsResult = await pool.query(
      `SELECT COUNT(*) as count FROM "export"`
    );
    const dbExports = parseInt(exportsResult.rows[0].count, 10);

    let anonymousExports = 0;
    try {
      const counterResult = await pool.query(
        `SELECT value FROM counter WHERE key = 'anonymous_exports'`
      );
      if (counterResult.rows.length > 0) {
        anonymousExports = counterResult.rows[0].value;
      }
    } catch {
      // counter table may not exist yet
    }

    const totalExports = dbExports + anonymousExports;

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
    let anonymousFollowers = 0;
    try {
      const counterResult = await pool.query(
        `SELECT value FROM counter WHERE key = 'anonymous_followers'`
      );
      if (counterResult.rows.length > 0) {
        anonymousFollowers = counterResult.rows[0].value;
      }
    } catch {
      // counter table may not exist yet
    }

    const totalFollowers = parseInt(followersResult.rows[0].total, 10) + anonymousFollowers;

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
