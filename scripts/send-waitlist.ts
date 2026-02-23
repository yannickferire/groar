import { config } from "dotenv";
config({ path: ".env.local" });
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Yannick from 🐯 GROAR <yannick@groar.app>";
const SITE_URL = "https://groar.app";
const DISCOUNT_CODE = "6F0UYMSB";

const WAITLIST_EMAILS = [
  "support@saascity.io",
  "aziz040400@gmail.com",
  "satyainjamuri7@gmail.com",
  "venkeywonderofficial@gmail.com",
  "myltraise@gmail.com",
  "ml78380@icloud.com",
  "harshitasharma99999999@gmail.com",
  "info@rcmisk.com",
  "nicolas@magnt.io",
];

// Set to true to send to waitlist, false to send test to yourself
const TEST_MODE = false;
const TEST_EMAIL = "yannick.ferire@gmail.com";

function buildEmail() {
  const subject = "Groar is live — here's your 20% off 🐯";
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="${SITE_URL}/groar-logo.png" alt="GROAR" width="140" style="display:inline-block;" />
      </div>
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Hey!</h1>
      <p>You signed up for the Groar waitlist — thank you for your patience. <strong>Groar is now live!</strong></p>
      <p>Groar turns your X (Twitter) analytics into beautiful, shareable visuals. Milestones, follower growth, engagement stats — all in one click.</p>
      <p>As promised, here's your <strong>exclusive 20% discount</strong> as an early supporter:</p>
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;padding:12px 24px;background:#fef3c7;border:2px dashed #f59e0b;border-radius:8px;font-size:20px;font-weight:bold;letter-spacing:2px;color:#92400e;">${DISCOUNT_CODE}</div>
      </div>
      <p>Use this code at checkout to get <strong>20% off</strong> any Pro plan — monthly or lifetime.</p>
      <p>But first, you can <strong>try everything for free</strong> with a 3-day Pro trial. No credit card needed.</p>
      <div style="text-align:center;margin:24px 0;"><a href="${SITE_URL}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;font-weight:bold;text-decoration:none;border-radius:8px;font-size:16px;">Start your free trial</a></div>
      <p style="color:#6b7280;font-size:14px;">Questions? Just reply to this email — I read everything.</p>
      <p>— Yannick</p>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
      🐯 GROAR – Turn your X metrics into high-signal visuals<br>
      <a href="${SITE_URL}" style="color:#9ca3af;">https://groar.app</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}

async function main() {
  const { subject, html } = buildEmail();
  const recipients = TEST_MODE ? [TEST_EMAIL] : WAITLIST_EMAILS;

  console.log(`\n${TEST_MODE ? "🧪 TEST MODE" : "🚀 SENDING TO WAITLIST"}`);
  console.log(`Sending to ${recipients.length} recipient(s)...\n`);

  for (let i = 0; i < recipients.length; i++) {
    const email = recipients[i];
    if (i > 0) {
      console.log("⏳ Waiting 60s before next send...");
      await new Promise((resolve) => setTimeout(resolve, 60_000));
    }
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        replyTo: "yannick.ferire@gmail.com",
        to: email,
        subject,
        html,
      });
      if (error) {
        console.error(`❌ ${email}: ${error.message}`);
      } else {
        console.log(`✅ ${email}`);
      }
    } catch (err) {
      console.error(`❌ ${email}: ${err}`);
    }
  }

  console.log("\nDone!");
}

main();
