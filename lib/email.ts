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
    subject: "Welcome to Groar! 🐯",
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Welcome ${firstName}!</h1>
      <p>You're in! Start a <strong>3-day Pro trial</strong> anytime — unlimited exports, no watermark, all templates & backgrounds. No credit card needed.</p>
      <p>Jump in and create your first image:</p>
      ${cta("Open the editor", `${SITE_URL}/dashboard`)}
      <p style="color:#6b7280;font-size:14px;">Questions? Just reply to this email.</p>
      <p>— Yannick</p>
    `),
  };
}

export function trialEndingEmail(name: string, pricing?: { monthlyPrice: number; lifetimePrice: number }) {
  const firstName = name.split(" ")[0] || name;
  const monthly = pricing?.monthlyPrice ?? 5;
  const lifetime = pricing?.lifetimePrice ?? 9;
  return {
    subject: "Your Groar Pro trial ends tomorrow",
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Hey ${firstName},</h1>
      <p>Your Pro trial <strong>expires tomorrow</strong>. After that, you'll be back to 3 exports/week with watermark.</p>
      <p>🔥 Right now, early adopter pricing is still available:</p>
      <ul style="margin:12px 0;padding-left:20px;">
        <li><strong>$${lifetime} one-time</strong> — lifetime access (final price will be $29)</li>
        <li><strong>$${monthly}/month</strong> — cancel anytime</li>
      </ul>
      ${cta("Catch your spot", `${SITE_URL}/dashboard/plan#plans`)}
      <p style="color:#6b7280;font-size:14px;">Price goes up as spots fill — this won't last.</p>
      <p>— Yannick</p>
    `),
  };
}

export function trialExpiredEmail(name: string, pricing?: { lifetimePrice: number }) {
  const firstName = name.split(" ")[0] || name;
  const lifetime = pricing?.lifetimePrice ?? 9;
  return {
    subject: "Your Groar Pro trial has ended",
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Hey ${firstName},</h1>
      <p>Your trial is over — you're back on the free plan (3 exports/week, watermark, limited templates).</p>
      <p>🔥 Lifetime access is <strong>$${lifetime}</strong> right now (final price: $29). One payment, Pro forever.</p>
      ${cta("Get lifetime access", `${SITE_URL}/dashboard/plan#plans`)}
      <p style="color:#6b7280;font-size:14px;">Early adopter pricing — price goes up as spots fill.</p>
      <p>— Yannick</p>
    `),
  };
}

export function trialFollowUpEmail(name: string, pricing?: { monthlyPrice: number; lifetimePrice: number }) {
  const firstName = name.split(" ")[0] || name;
  const monthly = pricing?.monthlyPrice ?? 5;
  const lifetime = pricing?.lifetimePrice ?? 9;
  return {
    subject: "Still thinking about Groar Pro? 🐯",
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Hey ${firstName},</h1>
      <p>Just checking in — your trial ended a few days ago. If you enjoyed the unlimited exports and templates, Pro is still here for you.</p>
      <p>🔥 Early adopter pricing is still live:</p>
      <ul style="margin:12px 0;padding-left:20px;">
        <li><strong>$${lifetime} one-time</strong> — lifetime access (final price: $29)</li>
        <li><strong>$${monthly}/month</strong> — cancel anytime</li>
      </ul>
      <p>These prices go up as more people join, so the sooner you lock it in, the less you pay.</p>
      ${cta("See plans", `${SITE_URL}/dashboard/plan#plans`)}
      <p style="color:#6b7280;font-size:14px;">Not interested? No worries — the free plan is here to stay. Just reply if you have questions!</p>
      <p>— Yannick</p>
    `),
  };
}

export function winBackEmail(name: string, pricing?: { monthlyPrice: number; lifetimePrice: number }) {
  const firstName = name.split(" ")[0] || name;
  const monthly = pricing?.monthlyPrice ?? 5;
  const lifetime = pricing?.lifetimePrice ?? 9;
  return {
    subject: "Groar just got better — early adopter pricing inside 🔥",
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Hey ${firstName},</h1>
      <p>Quick update — we just shipped early adopter pricing for Groar Pro. The earlier you join, the less you pay. Forever.</p>
      <p>🔥 Right now:</p>
      <ul style="margin:12px 0;padding-left:20px;">
        <li><strong>$${lifetime} one-time</strong> — lifetime access (final price will be $29)</li>
        <li><strong>$${monthly}/month</strong> — cancel anytime</li>
      </ul>
      <p>Price increases as spots fill up — first come, first served.</p>
      ${cta("Catch your spot", `${SITE_URL}/pricing`)}
      <p style="color:#6b7280;font-size:14px;">As always, you can keep using the free plan — no pressure. Just reply if you have any questions.</p>
      <p>— Yannick</p>
    `),
  };
}

export function milestoneEmail(name: string, milestone: string, metric: string) {
  const firstName = name.split(" ")[0] || name;
  const metricLabel = metric === "followers" ? "followers" : "posts";
  return {
    subject: `You just hit ${milestone} ${metricLabel}! 🎉`,
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">Congrats ${firstName}!</h1>
      <p>You just reached <strong>${milestone} ${metricLabel}</strong> on X. That's a big deal — you should share it with your audience.</p>
      <p>We've got a milestone template ready for you:</p>
      ${cta("Share the milestone", `${SITE_URL}/dashboard/editor?template=milestone&metric=${metric}&value=${milestone}`)}
      <p style="color:#6b7280;font-size:14px;">Keep growing! 🐯</p>
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

export function newTrialNotificationEmail(userName: string, userEmail: string) {
  return {
    subject: `🐯 New trial started — ${userName}`,
    html: layout(`
      <h1 style="font-size:24px;font-weight:bold;margin:0 0 16px;">New trial started!</h1>
      <ul style="margin:12px 0;padding-left:20px;">
        <li><strong>Name:</strong> ${userName}</li>
        <li><strong>Email:</strong> ${userEmail}</li>
      </ul>
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
      🐯 GROAR – Turn your metrics into high-signal visuals<br>
      <a href="${SITE_URL}" style="color:#9ca3af;">groar.app</a> · <a href="https://x.com/yannick_ferire" style="color:#9ca3af;">@yannick_ferire</a>
    </p>
  </div>
</body>
</html>`;
}
