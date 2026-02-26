/**
 * One-shot win-back email for free users and expired trial users.
 * Announces early adopter pricing to users who haven't converted.
 *
 * Usage:
 *   npx tsx scripts/send-winback.ts
 *
 * Set TEST_MODE = true to send only to yourself first.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { Resend } from "resend";
import { Pool } from "pg";

const resend = new Resend(process.env.RESEND_API_KEY);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const FROM = "Yannick from 🐯 GROAR <yannick@groar.app>";
const SITE_URL = "https://groar.app";

// ── Config ──
const TEST_MODE = false; // set to false to send for real
const TEST_EMAIL = "yannick.ferire@gmail.com";
const DELAY_BETWEEN_EMAILS_MS = 120_000; // 2 minutes between sends

async function getPricing() {
  // Same logic as getPricingTierInfo but standalone (no import needed)
  const result = await pool.query(
    `SELECT COUNT(*) FROM subscription WHERE status = 'active' AND (
      (plan = 'pro' AND "billingPeriod" = 'lifetime')
      OR plan = 'friend'
    )`
  );
  const count = parseInt(result.rows[0].count);

  const lifetimeTiers = [
    { price: 9, spots: 15 },
    { price: 12, spots: 20 },
    { price: 15, spots: 35 },
    { price: 19, spots: 50 },
    { price: 24, spots: 80 },
    { price: 29, spots: null },
  ];

  const proTiers = [
    { price: 5, spots: 15 },
    { price: 6, spots: 20 },
    { price: 7, spots: 35 },
    { price: 8, spots: 50 },
    { price: 9, spots: 80 },
    { price: 9, spots: null },
  ];

  function findPrice(tiers: typeof lifetimeTiers): number {
    let accumulated = 0;
    for (const tier of tiers) {
      if (tier.spots === null) return tier.price;
      accumulated += tier.spots;
      if (count < accumulated) return tier.price;
    }
    return tiers[tiers.length - 1].price;
  }

  return { monthlyPrice: findPrice(proTiers), lifetimePrice: findPrice(lifetimeTiers) };
}

function buildEmail(name: string, monthlyPrice: number, lifetimePrice: number) {
  const firstName = name?.split(" ")[0] || "there";
  const subject = "Groar just got better — early adopter pricing inside 🔥";
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="${SITE_URL}/groar-logo.png" alt="GROAR" width="140" style="display:inline-block;" />
      </div>
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Hey ${firstName},</h1>
      <p>Quick update — we just shipped early adopter pricing for Groar Pro. The earlier you join, the less you pay. Forever.</p>
      <p>🔥 Right now:</p>
      <ul style="margin:12px 0;padding-left:20px;">
        <li><strong>$${lifetimePrice} one-time</strong> — lifetime access (final price will be $29)</li>
        <li><strong>$${monthlyPrice}/month</strong> — cancel anytime</li>
      </ul>
      <p>Price increases as spots fill up — first come, first served.</p>
      <div style="text-align:center;margin:24px 0;"><a href="${SITE_URL}/pricing" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;font-weight:bold;text-decoration:none;border-radius:8px;font-size:16px;">Catch your spot</a></div>
      <p style="color:#6b7280;font-size:14px;">As always, you can keep using the free plan — no pressure. Just reply if you have any questions.</p>
      <p>— Yannick</p>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
      🐯 GROAR – Turn your X metrics into high-signal visuals<br>
      <a href="${SITE_URL}" style="color:#9ca3af;">groar.app</a> · <a href="https://x.com/yannick_ferire" style="color:#9ca3af;">@yannick_ferire</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}

async function main() {
  console.log("\n📊 Fetching current pricing...");
  const { monthlyPrice, lifetimePrice } = await getPricing();
  console.log(`   Lifetime: $${lifetimePrice} | Monthly: $${monthlyPrice}/mo\n`);

  // Find users who are on free plan (trial expired or never trialed) and not already Pro
  // Exclude users who already have an active paid subscription
  const result = await pool.query(
    `SELECT DISTINCT u.email, u.name
     FROM "user" u
     LEFT JOIN subscription s ON s."userId" = u.id
     WHERE (
       -- Trial expired (back to free)
       (s.status = 'trialing' AND s."trialEnd" <= NOW())
       -- Or never subscribed at all
       OR s."userId" IS NULL
     )
     -- Exclude active paid subscribers
     AND u.id NOT IN (
       SELECT "userId" FROM subscription
       WHERE status = 'active' AND plan IN ('pro', 'friend')
     )
     -- Exclude internal
     AND u.email NOT ILIKE '%ferire%'
     ORDER BY u.email`
  );

  const users = result.rows as { email: string; name: string }[];
  console.log(`Found ${users.length} users to contact:\n`);
  for (const u of users) {
    console.log(`  - ${u.email} (${u.name || "no name"})`);
  }

  if (TEST_MODE) {
    console.log(`\n🧪 TEST MODE — sending only to ${TEST_EMAIL}\n`);
    const { subject, html } = buildEmail("Yannick", monthlyPrice, lifetimePrice);
    const { error } = await resend.emails.send({
      from: FROM,
      replyTo: "yannick.ferire@gmail.com",
      to: TEST_EMAIL,
      subject,
      html,
    });
    if (error) {
      console.error(`❌ ${error.message}`);
    } else {
      console.log(`✅ Test email sent to ${TEST_EMAIL}`);
    }
  } else {
    console.log(`\n🚀 SENDING TO ${users.length} USERS\n`);
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS));
      }
      const { subject, html } = buildEmail(user.name || "there", monthlyPrice, lifetimePrice);
      try {
        const { error } = await resend.emails.send({
          from: FROM,
          replyTo: "yannick.ferire@gmail.com",
          to: user.email,
          subject,
          html,
        });
        if (error) {
          console.error(`❌ ${user.email}: ${error.message}`);
        } else {
          console.log(`✅ ${user.email}`);
        }
      } catch (err) {
        console.error(`❌ ${user.email}: ${err}`);
      }
    }
  }

  console.log("\nDone!");
  await pool.end();
}

main();
