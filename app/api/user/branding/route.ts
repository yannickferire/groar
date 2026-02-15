import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

// POST: Upload branding logo
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const logo = formData.get("logo") as File;

    if (!logo) {
      return NextResponse.json({ error: "No logo file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(logo.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PNG, JPG, SVG, WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (logo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 500KB" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Delete existing logo if any
    const existingResult = await pool.query(
      `SELECT "brandingLogoUrl" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    if (existingResult.rows[0]?.brandingLogoUrl) {
      // Extract path from URL and delete
      const existingUrl = existingResult.rows[0].brandingLogoUrl;
      const pathMatch = existingUrl.match(/\/exports\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("exports").remove([pathMatch[1]]);
      }
    }

    // Get file extension
    const ext = logo.name.split(".").pop() || "png";
    const fileName = `${session.user.id}/branding/logo.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(fileName, logo, {
        contentType: logo.type,
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) {
      console.error("Logo upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("exports")
      .getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;

    // Update user record
    await pool.query(
      `UPDATE "user" SET "brandingLogoUrl" = $1 WHERE id = $2`,
      [logoUrl, session.user.id]
    );

    return NextResponse.json({ logoUrl });
  } catch (error) {
    console.error("Branding upload error:", error);
    return NextResponse.json({ error: "Failed to upload branding" }, { status: 500 });
  }
}

// GET: Get current branding logo
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT "brandingLogoUrl" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    return NextResponse.json({
      logoUrl: result.rows[0]?.brandingLogoUrl || null,
    });
  } catch (error) {
    console.error("Branding fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch branding" }, { status: 500 });
  }
}

// DELETE: Remove branding logo
export async function DELETE() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT "brandingLogoUrl" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    const logoUrl = result.rows[0]?.brandingLogoUrl;

    if (logoUrl) {
      const supabase = createServerSupabaseClient();

      // Extract path from URL and delete
      const pathMatch = logoUrl.match(/\/exports\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("exports").remove([pathMatch[1]]);
      }

      // Clear database record
      await pool.query(
        `UPDATE "user" SET "brandingLogoUrl" = NULL WHERE id = $1`,
        [session.user.id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Branding delete error:", error);
    return NextResponse.json({ error: "Failed to delete branding" }, { status: 500 });
  }
}
