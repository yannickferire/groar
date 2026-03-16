import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { pool } from "@/lib/db";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if user is banned
  try {
    const result = await pool.query(
      `SELECT u.banned FROM "user" u
       JOIN session s ON s."userId" = u.id
       WHERE s.token = $1`,
      [sessionCookie]
    );
    if (result.rows[0]?.banned === true) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch {
    // If DB check fails, allow through (requireAuth will catch it)
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
