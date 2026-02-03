import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST: Save a new export
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const metricsJson = formData.get("metrics") as string;

    if (!image || !metricsJson) {
      return NextResponse.json({ error: "Missing image or metrics" }, { status: 400 });
    }

    const metrics = JSON.parse(metricsJson);

    // Upload image to Supabase Storage
    const supabase = createServerSupabaseClient();
    const fileName = `${session.user.id}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(fileName, image, {
        contentType: "image/jpeg",
        cacheControl: "31536000", // 1 year cache
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("exports")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // Save metadata to database
    const result = await pool.query(
      `INSERT INTO export ("userId", "imageUrl", "metrics", "createdAt")
       VALUES ($1, $2, $3, NOW())
       RETURNING id, "imageUrl", "metrics", "createdAt"`,
      [session.user.id, imageUrl, metrics]
    );

    return NextResponse.json({ export: result.rows[0] });
  } catch (error) {
    console.error("Export save error:", error);
    return NextResponse.json({ error: "Failed to save export" }, { status: 500 });
  }
}

// GET: List user's exports
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT id, "imageUrl", "metrics", "createdAt"
       FROM export
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [session.user.id]
    );

    return NextResponse.json({ exports: result.rows });
  } catch (error) {
    console.error("Exports fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch exports" }, { status: 500 });
  }
}
