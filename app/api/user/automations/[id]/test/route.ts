import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { testAutoPost } from "@/lib/auto-post";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { id } = await params;
  const result = await testAutoPost(session.user.id, id);

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
