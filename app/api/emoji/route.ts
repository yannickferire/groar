import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for Emojipedia Apple emoji images to avoid CORS issues.
 * GET /api/emoji?name=party-popper&unified=1f389
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name");
  const unified = searchParams.get("unified");

  if (!name || !unified) {
    return NextResponse.json({ error: "Missing name or unified" }, { status: 400 });
  }

  // Sanitize inputs
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/(^-|-$)/g, "");
  const safeUnified = unified.replace(/[^a-f0-9-]/gi, "");

  const url = `https://em-content.zobj.net/source/apple/391/${slug}_${safeUnified}.png`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Emoji not found" }, { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch emoji" }, { status: 500 });
  }
}
