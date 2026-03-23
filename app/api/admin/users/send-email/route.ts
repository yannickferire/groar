import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { sendEmail, secondChanceTrialEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, template } = await request.json();
  if (!userId || !template) {
    return NextResponse.json({ error: "Missing userId or template" }, { status: 400 });
  }

  // Get user info
  const userResult = await pool.query(
    `SELECT name, email, "emailProductUpdates" FROM "user" WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user?.email) {
    return NextResponse.json({ error: "User not found or no email" }, { status: 404 });
  }

  let emailData: { subject: string; html: string };

  switch (template) {
    case "second-chance-trial":
      emailData = secondChanceTrialEmail(user.name || "there");
      break;
    default:
      return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  }

  await sendEmail({ to: user.email, ...emailData });

  return NextResponse.json({ success: true });
}
