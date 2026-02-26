import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST: Track export usage with optional device/debug info
export async function POST(req: NextRequest) {
  try {
    // Try to get authenticated user (optional — landing page exports are anonymous)
    let authenticatedUserId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session) authenticatedUserId = session.user.id;
    } catch {}

    let followers = 0;
    let backgroundId = "";
    let template = "";
    let userId: string | null = authenticatedUserId;
    let handle: string | null = null;
    let font: string | null = null;
    let fontResolved: boolean | null = null;
    let isWebkit: boolean | null = null;
    let isIos: boolean | null = null;
    let browser: string | null = null;
    let os: string | null = null;
    let deviceType: string | null = null;
    let screenWidth: number | null = null;
    let screenHeight: number | null = null;
    let source: string | null = null;

    try {
      const body = await req.json();
      followers = typeof body.followers === "number" ? body.followers : 0;
      backgroundId = typeof body.backgroundId === "string" ? body.backgroundId : "";
      template = typeof body.template === "string" ? body.template : "";
      // userId comes from server-side session, not client
      handle = body.handle || null;
      font = body.font || null;
      fontResolved = typeof body.fontResolved === "boolean" ? body.fontResolved : null;
      isWebkit = typeof body.isWebkit === "boolean" ? body.isWebkit : null;
      isIos = typeof body.isIos === "boolean" ? body.isIos : null;
      browser = body.browser || null;
      os = body.os || null;
      deviceType = body.deviceType || null;
      screenWidth = typeof body.screenWidth === "number" ? body.screenWidth : null;
      screenHeight = typeof body.screenHeight === "number" ? body.screenHeight : null;
      source = body.source || null;
    } catch {
      // no body or invalid JSON — that's fine
    }

    // Track in export_usage (all exports, with debug info)
    if (backgroundId && template) {
      await pool.query(
        `INSERT INTO export_usage (
          "backgroundId", "template", "userId", "handle", "font", "fontResolved",
          "isWebkit", "isIos", "browser", "os", "deviceType",
          "screenWidth", "screenHeight", "source"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [backgroundId, template, userId, handle, font, fontResolved,
         isWebkit, isIos, browser, os, deviceType, screenWidth, screenHeight, source]
      );
    }

    // Increment anonymous export counter (landing page only)
    if (!authenticatedUserId) {
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
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ ok: true });
  }
}
