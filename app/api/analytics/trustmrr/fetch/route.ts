import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { fetchTrustMRRForUser } from "@/lib/trustmrr-analytics";

// Manually fetch TrustMRR data for the current user
export async function POST() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    // Get the user's X handle
    const userResult = await pool.query(
      `SELECT "xUsername" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    const xUsername = userResult.rows[0]?.xUsername;
    if (!xUsername) {
      return NextResponse.json(
        { error: "No X handle connected" },
        { status: 400 }
      );
    }

    const result = await fetchTrustMRRForUser(
      session.user.id,
      xUsername,
      "manual"
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching TrustMRR:", error);
    return NextResponse.json(
      { error: "Failed to fetch TrustMRR data" },
      { status: 500 }
    );
  }
}
