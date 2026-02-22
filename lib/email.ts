import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Yannick from 🐯 GROAR <yannick@groar.app>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://groar.app";

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      replyTo: "yannick.ferire@gmail.com",
      to,
      subject,
      html,
    });
    if (error) {
      console.error("Resend error:", error);
    }
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

// ─── Email builders ───

export function welcomeEmail(name: string) {
  const firstName = name.split(" ")[0] || name;
  return {
    subject: "Welcome to Groar! Your free trial is live 🐯",
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Welcome ${firstName}!</h1>
      <p>Your 3-day Pro trial just started — unlimited exports, no watermark, all templates & backgrounds.</p>
      <p>Jump in and create your first image:</p>
      ${cta("Open the editor", `${SITE_URL}/dashboard`)}
      <p style="color:#6b7280;font-size:14px;">Questions? Just reply to this email.</p>
      <p>— Yannick</p>
    `),
  };
}

export function trialEndingEmail(name: string) {
  const firstName = name.split(" ")[0] || name;
  return {
    subject: "Your Groar Pro trial ends tomorrow",
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Hey ${firstName},</h1>
      <p>Your Pro trial <strong>expires tomorrow</strong>. After that, you'll be back to 3 exports/week with watermark.</p>
      <p>Keep Pro for <strong>$5/month</strong> or grab <strong>lifetime access for $19</strong>.</p>
      ${cta("Upgrade now", `${SITE_URL}/dashboard/plan`)}
      <p style="color:#6b7280;font-size:14px;">No pressure — the early-bird price won't last forever though.</p>
      <p>— Yannick</p>
    `),
  };
}

export function trialExpiredEmail(name: string) {
  const firstName = name.split(" ")[0] || name;
  return {
    subject: "Your Groar Pro trial has ended",
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Hey ${firstName},</h1>
      <p>Your trial is over — you're back on the free plan (3 exports/week, watermark, limited templates).</p>
      <p>Unlock everything permanently for <strong>$19 one-time</strong>:</p>
      ${cta("Get lifetime access — $19", `${SITE_URL}/dashboard/plan`)}
      <p>— Yannick</p>
    `),
  };
}

export function subscriptionConfirmedEmail(name: string, billingPeriod: "monthly" | "lifetime") {
  const firstName = name.split(" ")[0] || name;
  const planDetail = billingPeriod === "lifetime"
    ? "You now have <strong>lifetime access</strong> to Groar Pro."
    : "Your <strong>Pro monthly</strong> subscription is active.";
  return {
    subject: "You're now a Groar Pro! 🐯",
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Welcome to Pro, ${firstName}!</h1>
      <p>${planDetail} Unlimited exports, no watermark, all templates, custom branding.</p>
      <p>Thanks for supporting Groar — go create something awesome:</p>
      ${cta("Open the editor", `${SITE_URL}/dashboard`)}
      <p>— Yannick</p>
    `),
  };
}

// ─── Helpers ───

function cta(text: string, href: string) {
  return `<div style="text-align:center;margin:24px 0;"><a href="${href}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;font-weight:bold;text-decoration:none;border-radius:8px;font-size:16px;">${text}</a></div>`;
}

function layout(body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="${SITE_URL}/groar-logo.png" alt="GROAR" width="140" style="display:inline-block;" />
      </div>
      ${body}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
      🐯 GROAR – Turn your X metrics into high-signal visuals<br>
      <a href="${SITE_URL}" style="color:#9ca3af;">https://groar.app</a>
    </p>
  </div>
</body>
</html>`;
}
