import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "gZ0hUWX81uLZZLKwRYr4RKyqDNFN6ahc";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

type AuthSuccess = {
  session: Session;
  response?: undefined;
};

type AuthFailure = {
  session?: undefined;
  response: NextResponse;
};

export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Check if user is banned
  const banned = await isUserBanned(session.user.id);
  if (banned) {
    return { response: NextResponse.json({ error: "Account suspended" }, { status: 403 }) };
  }

  return { session };
}

// Check if a user is banned (cached for 5 minutes in-memory)
const banCache = new Map<string, { banned: boolean; ts: number }>();
const BAN_CACHE_TTL = 5 * 60 * 1000;

export async function isUserBanned(userId: string): Promise<boolean> {
  const cached = banCache.get(userId);
  if (cached && Date.now() - cached.ts < BAN_CACHE_TTL) {
    return cached.banned;
  }

  try {
    const result = await pool.query(
      `SELECT banned FROM "user" WHERE id = $1`,
      [userId]
    );
    const banned = result.rows[0]?.banned === true;
    banCache.set(userId, { banned, ts: Date.now() });
    return banned;
  } catch {
    return false;
  }
}
