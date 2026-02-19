import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { PLAN_LIMITS } from "@/lib/plans";
import { getUserPlanFromDB, getUserSubscription } from "@/lib/plans-server";

// POST: Save a new export
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check weekly export limit based on user's plan
  const plan = await getUserPlanFromDB(session.user.id);
  const limit = PLAN_LIMITS[plan].maxExportsPerWeek;

  if (limit !== null) {
    // For free users with an expired trial, only count exports made after trial ended
    // so that exports made during the trial don't consume the free weekly limit
    let countSince = `date_trunc('week', CURRENT_DATE)`;
    const queryParams: (string | Date)[] = [session.user.id];

    if (plan === "free") {
      const subscription = await getUserSubscription(session.user.id);
      if (subscription?.trialEnd && new Date(subscription.trialEnd) <= new Date()) {
        const trialEndDate = new Date(subscription.trialEnd);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        // Use the later of: week start or trial end
        if (trialEndDate > weekStart) {
          countSince = `$2::timestamptz`;
          queryParams.push(trialEndDate);
        }
      }
    }

    const weekCount = await pool.query(
      `SELECT COUNT(*) FROM export
       WHERE "userId" = $1
       AND "createdAt" >= ${countSince}`,
      queryParams
    );

    if (parseInt(weekCount.rows[0].count) >= limit) {
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

    // Track background and template usage
    const backgroundId = metrics?.background?.presetId;
    const template = metrics?.template;
    if (backgroundId && template) {
      await pool.query(
        `INSERT INTO export_usage ("backgroundId", "template") VALUES ($1, $2)`,
        [backgroundId, template]
      ).catch(() => {}); // Non-blocking
    }

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
