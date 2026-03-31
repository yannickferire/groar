import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const connectionsUrl = `${baseUrl}/dashboard/connections`;

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${connectionsUrl}?error=${error || "missing_params"}`
    );
  }

  // Retrieve and validate state (+ cleanup expired states)
  await pool.query(`DELETE FROM link_x_state WHERE "createdAt" < NOW() - INTERVAL '10 minutes'`);
  const stateResult = await pool.query(
    `DELETE FROM link_x_state WHERE state = $1 RETURNING "codeVerifier", "userId"`,
    [state]
  );

  if (stateResult.rows.length === 0) {
    return NextResponse.redirect(`${connectionsUrl}?error=invalid_state`);
  }

  const { codeVerifier, userId } = stateResult.rows[0];

  // Parse returnTo from state payload
  let returnTo: string | null = null;
  try {
    const statePayload = JSON.parse(Buffer.from(state, "base64url").toString());
    if (typeof statePayload.returnTo === "string" && statePayload.returnTo.startsWith("/")) {
      returnTo = statePayload.returnTo;
    }
  } catch { /* ignore */ }
  const finalRedirect = returnTo ? `${baseUrl}${returnTo}` : connectionsUrl;

  // Exchange code for tokens
  const redirectUri = `${baseUrl}/api/connections/link-x/callback`;
  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!;

  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    console.error("Twitter token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${connectionsUrl}?error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json();
  const { access_token, refresh_token, expires_in, scope } = tokens;

  // Fetch Twitter user info (including profile image)
  const userRes = await fetch(
    "https://api.x.com/2/users/me?user.fields=profile_image_url",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  if (!userRes.ok) {
    console.error("Twitter user fetch failed:", await userRes.text());
    return NextResponse.redirect(`${connectionsUrl}?error=user_fetch_failed`);
  }

  const userData = await userRes.json();
  const twitterAccountId = userData.data?.id;
  const twitterUsername = userData.data?.username;
  const profileImageUrl = userData.data?.profile_image_url?.replace("_normal", "_400x400") || null;

  if (!twitterAccountId) {
    return NextResponse.redirect(`${connectionsUrl}?error=no_twitter_id`);
  }

  const expiresAt = expires_in
    ? new Date(Date.now() + expires_in * 1000).toISOString()
    : null;

  // Always update tokens if this exact connection exists (reconnect),
  // otherwise create a new one
  const existingLink = await pool.query(
    `SELECT id FROM account WHERE "userId" = $1 AND "providerId" = 'twitter' AND "accountId" = $2`,
    [userId, twitterAccountId]
  );

  if (existingLink.rows.length > 0) {
    // Reconnect: update tokens + profile info
    await pool.query(
      `UPDATE account SET "accessToken" = $1, "refreshToken" = $2, "accessTokenExpiresAt" = $3,
       scope = $4, username = $5, "profileImageUrl" = $6, "updatedAt" = NOW()
       WHERE id = $7`,
      [access_token, refresh_token, expiresAt, scope, twitterUsername, profileImageUrl, existingLink.rows[0].id]
    );
  } else {
    // New connection
    const id = crypto.randomBytes(16).toString("hex");
    await pool.query(
      `INSERT INTO account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken",
       "accessTokenExpiresAt", scope, username, "profileImageUrl", "createdAt", "updatedAt")
       VALUES ($1, $2, 'twitter', $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [id, twitterAccountId, userId, access_token, refresh_token, expiresAt, scope, twitterUsername, profileImageUrl]
    );
  }

  // Update xUsername on user
  if (twitterUsername) {
    await pool.query(
      `UPDATE "user" SET "xUsername" = $1 WHERE id = $2`,
      [twitterUsername, userId]
    );
  }

  return NextResponse.redirect(finalRedirect);
}
