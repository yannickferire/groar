import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Skip first 200 exports (test/dev data) — get the cutoff date
  const cutoffResult = await pool.query(
    `SELECT "createdAt" FROM export ORDER BY "createdAt" ASC LIMIT 1 OFFSET 200`
  );
  const cutoffClause = cutoffResult.rows[0]
    ? `WHERE e."createdAt" >= '${cutoffResult.rows[0].createdAt.toISOString()}'`
    : "";
  const cutoffClauseUsage = cutoffResult.rows[0]
    ? `WHERE eu."createdAt" >= '${cutoffResult.rows[0].createdAt.toISOString()}'`
    : "";
  const cutoffClauseSimple = cutoffResult.rows[0]
    ? `WHERE "createdAt" >= '${cutoffResult.rows[0].createdAt.toISOString()}'`
    : "";

  // Template distribution (from export_usage)
  const templateResult = await pool.query(
    `SELECT "template", COUNT(*)::int as count
     FROM export_usage eu
     ${cutoffClauseUsage}
     GROUP BY "template"
     ORDER BY count DESC`
  );

  // Background distribution (from export_usage)
  const backgroundResult = await pool.query(
    `SELECT "backgroundId", COUNT(*)::int as count
     FROM export_usage eu
     ${cutoffClauseUsage}
     GROUP BY "backgroundId"
     ORDER BY count DESC`
  );

  // Metric type distribution (from export JSON column)
  const metricResult = await pool.query(
    `SELECT metric->>'type' as metric_type, COUNT(*)::int as count
     FROM export e, jsonb_array_elements(metrics::jsonb->'metrics') as metric
     ${cutoffClause}
     GROUP BY metric_type
     ORDER BY count DESC`
  );

  // Metric count per export (how many metrics do people typically use)
  const metricCountResult = await pool.query(
    `SELECT jsonb_array_length(metrics::jsonb->'metrics') as metric_count, COUNT(*)::int as exports
     FROM export e
     WHERE metrics IS NOT NULL AND metrics::jsonb->'metrics' IS NOT NULL
     ${cutoffResult.rows[0] ? `AND e."createdAt" >= '${cutoffResult.rows[0].createdAt.toISOString()}'` : ""}
     GROUP BY metric_count
     ORDER BY metric_count`
  );

  // Exports over time (last 30 days)
  const exportsOverTimeResult = await pool.query(
    `SELECT date_trunc('day', "createdAt")::date as day, COUNT(*)::int as count
     FROM export
     WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY day
     ORDER BY day`
  );

  // Total exports (excluding first 200)
  const totalResult = await pool.query(
    `SELECT COUNT(*)::int as total FROM export ${cutoffClauseSimple}`
  );

  return NextResponse.json({
    total: totalResult.rows[0].total,
    templates: templateResult.rows,
    backgrounds: backgroundResult.rows,
    metrics: metricResult.rows,
    metricCounts: metricCountResult.rows,
    exportsOverTime: exportsOverTimeResult.rows,
  });
}
