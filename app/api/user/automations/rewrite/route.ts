import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { hasEnoughCredits, deductCredits } from "@/lib/auto-post";
import { CREDIT_COST_VARIANT } from "@/lib/auto-post-shared";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  // Check credits
  if (!(await hasEnoughCredits(session.user.id, CREDIT_COST_VARIANT))) {
    return NextResponse.json({ error: "No credits left this month" }, { status: 429 });
  }

  const { existingVariants, metric } = await request.json();

  if (!Array.isArray(existingVariants) || existingVariants.length === 0) {
    return NextResponse.json({ error: "Missing variants" }, { status: 400 });
  }

  const variantsList = existingVariants
    .map((v: string, i: number) => `Variant ${i + 1}:\n${v}`)
    .join("\n\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are writing tweet variants for an auto-post feature. The metric is "${metric || "followers"}".

Here are the existing variants:

${variantsList}

Write ONE new variant inspired by these but with a different hook and call-to-action. Rules:
- Keep template variables exactly as-is: {milestone}, {value}, {goal}, {metric}
- Keep "Made with groar.app by @yannick_ferire" at the end
- Keep it under 280 characters
- Use a different tone/angle than existing variants
- Include an emoji
- End with a question or call-to-action to drive replies

Output ONLY the new tweet variant, nothing else.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Deduct credits
  await deductCredits(session.user.id, "variant", CREDIT_COST_VARIANT);

  return NextResponse.json({ text });
}
