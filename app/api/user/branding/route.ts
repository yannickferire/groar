import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getUserPlanFromDB } from "@/lib/plans-server";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_LOGOS = 6;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

// POST: Upload branding logo (premium only, max 5)
export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  try {
    // Check logo count
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM branding_logos WHERE "userId" = $1`,
      [session.user.id]
    );
    if (countResult.rows[0].count >= MAX_LOGOS) {
      return NextResponse.json({ error: `Maximum ${MAX_LOGOS} logos reached` }, { status: 400 });
    }

    const formData = await request.formData();
    const logo = formData.get("logo") as File;

    if (!logo) {
      return NextResponse.json({ error: "No logo file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(logo.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PNG, JPG, SVG, WebP" },
        { status: 400 }
      );
    }

    if (logo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 2MB" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const ext = logo.name.split(".").pop() || "png";
    const fileName = `${session.user.id}/branding/logo-${Date.now()}.${ext}`;

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

    const { data: urlData } = supabase.storage
      .from("exports")
      .getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;

    // Insert into branding_logos table
    const insertResult = await pool.query(
      `INSERT INTO branding_logos ("userId", url) VALUES ($1, $2) RETURNING id, url, "createdAt"`,
      [session.user.id, logoUrl]
    );

    const newLogo = insertResult.rows[0];

    return NextResponse.json({ logo: { id: newLogo.id, url: newLogo.url, createdAt: newLogo.createdAt } });
  } catch (error) {
    console.error("Branding upload error:", error);
    return NextResponse.json({ error: "Failed to upload branding" }, { status: 500 });
  }
}

// GET: Get all branding logos
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const result = await pool.query(
      `SELECT id, url, "createdAt" FROM branding_logos WHERE "userId" = $1 ORDER BY "createdAt" ASC`,
      [session.user.id]
    );

    // Fallback: if no logos in new table but legacy column has a value
    if (result.rows.length === 0) {
      const legacyResult = await pool.query(
        `SELECT "brandingLogoUrl" FROM "user" WHERE id = $1`,
        [session.user.id]
      );
      if (legacyResult.rows[0]?.brandingLogoUrl) {
        return NextResponse.json({
          logos: [{ id: "legacy", url: legacyResult.rows[0].brandingLogoUrl, createdAt: new Date().toISOString() }],
        });
      }
    }

    return NextResponse.json({ logos: result.rows });
  } catch (error) {
    console.error("Branding fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch branding" }, { status: 500 });
  }
}

// DELETE: Remove a specific branding logo by id
export async function DELETE(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const logoId = searchParams.get("id");

    if (!logoId) {
      return NextResponse.json({ error: "Logo id is required" }, { status: 400 });
    }

    // Handle legacy logo
    if (logoId === "legacy") {
      const result = await pool.query(
        `SELECT "brandingLogoUrl" FROM "user" WHERE id = $1`,
        [session.user.id]
      );
      const logoUrl = result.rows[0]?.brandingLogoUrl;
      if (logoUrl) {
        const supabase = createServerSupabaseClient();
        const pathMatch = logoUrl.match(/\/exports\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from("exports").remove([pathMatch[1]]);
        }
        await pool.query(
          `UPDATE "user" SET "brandingLogoUrl" = NULL WHERE id = $1`,
          [session.user.id]
        );
      }
      return NextResponse.json({ success: true });
    }

    // Look up the logo
    const result = await pool.query(
      `SELECT url FROM branding_logos WHERE id = $1 AND "userId" = $2`,
      [logoId, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Logo not found" }, { status: 404 });
    }

    const logoUrl = result.rows[0].url;

    // Delete from Supabase Storage
    const supabase = createServerSupabaseClient();
    const pathMatch = logoUrl.match(/\/exports\/(.+)$/);
    if (pathMatch) {
      await supabase.storage.from("exports").remove([pathMatch[1]]);
    }

    // Delete from database
    await pool.query(
      `DELETE FROM branding_logos WHERE id = $1 AND "userId" = $2`,
      [logoId, session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Branding delete error:", error);
    return NextResponse.json({ error: "Failed to delete branding" }, { status: 500 });
  }
}
