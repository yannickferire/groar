import { requireAuth } from "@/lib/api-auth";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { PLAN_LIMITS } from "@/lib/plans";
import { getUserPlanFromDB, getWeeklyExportCount } from "@/lib/plans-server";
import { checkExportMilestones } from "@/lib/milestones";

// POST: Save a new export
export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  // Check weekly export limit based on user's plan
  const plan = await getUserPlanFromDB(session.user.id);
  const limit = PLAN_LIMITS[plan].maxExportsPerWeek;

  if (limit !== null) {
    const count = await getWeeklyExportCount(session.user.id);
    if (count >= limit) {
      return NextResponse.json(
        { error: "Weekly export limit reached", code: "LIMIT_REACHED" },
        { status: 429 }
      );
    }
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const metricsJson = formData.get("metrics") as string;

    if (!image || !metricsJson) {
      return NextResponse.json({ error: "Missing image or metrics" }, { status: 400 });
    }

    const metrics = JSON.parse(metricsJson);

    // Validate premium features for free users
    const isPremium = plan === "pro" || plan === "friend";
    if (!isPremium) {
      const bgId = metrics.background?.backgroundId || "";
      const hasPremiumBg = bgId.startsWith("premium-") || bgId.startsWith("custom-");
      const hasBranding = metrics.branding?.logo || metrics.branding?.showHandle;
      if (hasPremiumBg || hasBranding) {
        return NextResponse.json(
          { error: "Premium feature used", code: "PREMIUM_REQUIRED" },
          { status: 403 }
        );
      }
    }

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

    // Get current export count before insert
    const countResult = await pool.query(
      `SELECT COUNT(*)::int as count FROM export WHERE "userId" = $1`,
      [session.user.id]
    );
    const previousCount = countResult.rows[0].count;

    // Save metadata to database
    const result = await pool.query(
      `INSERT INTO export ("userId", "imageUrl", "metrics", "createdAt")
       VALUES ($1, $2, $3, NOW())
       RETURNING id, "imageUrl", "metrics", "createdAt"`,
      [session.user.id, imageUrl, metrics]
    );

    // Check for export count milestones (fire-and-forget)
    checkExportMilestones(session.user.id, previousCount, previousCount + 1).catch((e) =>
      console.error("Export milestone check failed:", e)
    );

    return NextResponse.json({ export: result.rows[0] });
  } catch (error) {
    console.error("Export save error:", error);
    return NextResponse.json({ error: "Failed to save export" }, { status: 500 });
  }
}

// GET: List user's exports
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

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
