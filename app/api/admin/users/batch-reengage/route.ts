import { requireAuth, ADMIN_USER_ID } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";

export async function POST() {
  const { session, response } = await requireAuth();
  if (response) return response;

  if (session.user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fire Inngest event — the batch job runs in background with spacing
  await inngest.send({ name: "admin/batch-reengage", data: {} });

  return NextResponse.json({ success: true, message: "Batch re-engage job started" });
}
