import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST: Increment anonymous export counter (and optionally followers)
export async function POST(req: NextRequest) {
  try {
    let followers = 0;
    try {
      const body = await req.json();
      followers = typeof body.followers === "number" ? body.followers : 0;
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ ok: true });
  }
}
