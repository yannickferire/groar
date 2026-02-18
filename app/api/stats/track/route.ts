import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST: Increment anonymous export counter (and optionally followers)
export async function POST(req: NextRequest) {
  try {
    let followers = 0;
    let backgroundId = "";
    let template = "";
    try {
      const body = await req.json();
      followers = typeof body.followers === "number" ? body.followers : 0;
      backgroundId = typeof body.backgroundId === "string" ? body.backgroundId : "";
      template = typeof body.template === "string" ? body.template : "";
    } catch {
      // no body or invalid JSON — that's fine
    }

    await pool.query(
      `INSERT INTO counter (key, value)
       VALUES ('anonymous_exports', 1)
       ON CONFLICT (key)
       DO UPDATE SET value = counter.value + 1`
    );

    if (followers > 0) {
      await pool.query(
        `INSERT INTO counter (key, value)
         VALUES ('anonymous_followers', $1)
         ON CONFLICT (key)
         DO UPDATE SET value = counter.value + $1`,
        [followers]
      );
    }

    // Track background and template usage
    if (backgroundId && template) {
      await pool.query(
        `INSERT INTO export_usage ("backgroundId", "template") VALUES ($1, $2)`,
        [backgroundId, template]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ ok: true });
  }
}
