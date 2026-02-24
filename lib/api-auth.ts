import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

  return { session };
}
