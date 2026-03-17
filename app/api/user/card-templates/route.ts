import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAuth } from "@/lib/api-auth";
import { getUserPlanFromDB } from "@/lib/plans-server";
import { pool } from "@/lib/db";

// GET — list user's card templates
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT id, name, settings, "createdAt", "updatedAt"
     FROM card_template
     WHERE "userId" = $1
     ORDER BY "createdAt" DESC`,
    [session.user.id]
  );

  return NextResponse.json({ templates: result.rows });
}

// POST — create a new card template from editor settings
export async function POST(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const plan = await getUserPlanFromDB(session.user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  // Limit to 10 templates per user
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM card_template WHERE "userId" = $1`,
    [session.user.id]
  );
  if (parseInt(countResult.rows[0].count) >= 10) {
    return NextResponse.json(
      { error: "Maximum 10 templates per account" },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { name, settings } = body;
  if (!settings) {
    return NextResponse.json({ error: "Missing settings" }, { status: 400 });
  }

  // Short readable ID
  const id = randomBytes(6).toString("hex");

  // Extract visual settings (no metric values)
  const templateSettings: Record<string, unknown> = {
    background: settings.background,
    textColor: settings.textColor,
    aspectRatio: settings.aspectRatio,
    font: settings.font,
    template: settings.template,
    metricsLayout: settings.metricsLayout,
    textAlign: settings.textAlign,
    heading: settings.heading,
    handle: settings.handle,
    branding: settings.branding,
    abbreviateNumbers: settings.abbreviateNumbers,
  };

  const tplType = settings.template || "metrics";

  // Template-specific dynamic data
  if (tplType === "metrics") {
    // All metrics as slots (types only, no values)
    templateSettings.metricSlots = (settings.metrics || []).map((m: { type: string; customLabel?: string }) => ({
      type: m.type,
      customLabel: m.customLabel,
    }));
  } else if (tplType === "milestone") {
    // Single metric + emoji settings
    const primary = settings.metrics?.[0];
    templateSettings.metricSlots = primary ? [{ type: primary.type, customLabel: primary.customLabel }] : [];
    templateSettings.milestoneEmoji = settings.milestoneEmoji;
    templateSettings.milestoneEmojiCount = settings.milestoneEmojiCount;
  } else if (tplType === "progress") {
    // Single metric + goal
    const primary = settings.metrics?.[0];
    templateSettings.metricSlots = primary ? [{ type: primary.type, customLabel: primary.customLabel }] : [];
    templateSettings.goal = settings.goal;
  } else if (tplType === "announcement") {
    // Announcements as slots (emoji + text placeholders)
    templateSettings.metricSlots = [];
    templateSettings.announcementSlots = (settings.announcements || []).map((a: { emoji?: string }) => ({
      emoji: a.emoji,
    }));
  }

  const result = await pool.query(
    `INSERT INTO card_template (id, "userId", name, settings)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, settings, "createdAt", "updatedAt"`,
    [id, session.user.id, (name || "Default").slice(0, 50), JSON.stringify(templateSettings)]
  );

  return NextResponse.json({ template: result.rows[0] }, { status: 201 });
}

// PATCH — rename a card template
export async function PATCH(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { id, name } = await request.json();
  if (!id || !name) {
    return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
  }

  const result = await pool.query(
    `UPDATE card_template SET name = $1, "updatedAt" = NOW()
     WHERE id = $2 AND "userId" = $3
     RETURNING id, name, settings, "createdAt", "updatedAt"`,
    [name.slice(0, 50), id, session.user.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template: result.rows[0] });
}

// DELETE — remove a card template
export async function DELETE(request: Request) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing template id" }, { status: 400 });
  }

  const result = await pool.query(
    `DELETE FROM card_template WHERE id = $1 AND "userId" = $2 RETURNING id`,
    [id, session.user.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
