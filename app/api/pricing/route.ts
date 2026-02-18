import { NextResponse } from "next/server";
import { getProTierInfo } from "@/lib/plans-server";

export async function GET() {
  const proTier = await getProTierInfo();

  return NextResponse.json(
    { proTier },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
