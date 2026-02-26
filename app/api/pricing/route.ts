import { NextResponse } from "next/server";
import { getPricingTierInfo } from "@/lib/plans-server";

export async function GET() {
  const { proTier, lifetimeTier } = await getPricingTierInfo();

  return NextResponse.json(
    { proTier, lifetimeTier },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
