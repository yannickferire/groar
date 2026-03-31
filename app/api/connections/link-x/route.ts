import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { getUserPlanFromDB } from "@/lib/plans-server";
import { PLAN_LIMITS } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Twitter OAuth 2.0 with PKCE — custom flow to allow same X account on multiple Groar accounts
export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  // Optional returnTo path (e.g. /dashboard/automation)
  const body = await request.json().catch(() => ({}));
  const returnTo = typeof body.returnTo === "string" ? body.returnTo : null;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  // Check connection limit — skip if user already has an account (reconnect to update scopes)
  const existingResult = await pool.query(
    `SELECT COUNT(*) FROM account WHERE "userId" = $1 AND "providerId" = 'twitter'`,
    [session.user.id]
  );
  const currentCount = parseInt(existingResult.rows[0].count);
  const isReconnect = currentCount > 0;
  const maxConnections = PLAN_LIMITS[plan].maxConnectionsPerProvider;
  if (!isReconnect && currentCount >= maxConnections) {
    return NextResponse.json(
      { error: `Connection limit reached (${maxConnections})` },
      { status: 400 }
    );
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // State includes userId + random token for CSRF protection
  const stateToken = crypto.randomBytes(16).toString("hex");
  const state = Buffer.from(
    JSON.stringify({ userId: session.user.id, token: stateToken, returnTo })
  ).toString("base64url");

  // Store code_verifier and state in DB (temporary, cleaned up on callback)
  await pool.query(
    `INSERT INTO link_x_state (state, "codeVerifier", "userId", "createdAt")
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (state) DO UPDATE SET "codeVerifier" = $2, "createdAt" = NOW()`,
    [state, codeVerifier, session.user.id]
  );

  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/connections/link-x/callback`;
  const scopes = ["tweet.read", "tweet.write", "media.write", "users.read", "offline.access"];

  const authUrl = new URL("https://x.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", process.env.TWITTER_CLIENT_ID!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  return NextResponse.json({ url: authUrl.toString() });
}
