<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Groar Next.js App Router project. PostHog is now initialized on the client via `instrumentation-client.ts` (alongside existing Sentry), with a reverse proxy configured in `next.config.ts` to route events through `/ingest` — reducing ad-blocker interference. A server-side client (`lib/posthog-server.ts`) enables event capture from API routes and webhooks. Twelve business-critical events are tracked across 7 files, covering the full user lifecycle from first sign-in through subscription activation and churn.

| Event | Description | File |
|---|---|---|
| `sign_in_started` | User clicked a sign-in button (Google or X/Twitter) on the login page | `app/login/page.tsx` |
| `plan_selected` | User selected a plan during onboarding (free, pro, or agency) | `app/onboarding/page.tsx` |
| `checkout_initiated` | Server-side: checkout session created for a paid plan | `app/api/checkout/route.ts` |
| `image_exported` | User successfully exported their metrics visual as a JPEG | `components/Editor.tsx` |
| `export_limit_reached` | Free user hit the weekly export limit and upgrade modal shown | `components/Editor.tsx` |
| `premium_feature_blocked` | Free user tried to use a premium feature (background, font, template, aspect ratio) | `components/Editor.tsx` |
| `upgrade_modal_viewed` | User was shown the upgrade/upsell modal after hitting a limit or using a premium feature | `components/Editor.tsx` |
| `subscription_activated` | Server-side: Polar webhook confirmed subscription activated for user | `app/api/webhooks/polar/route.ts` |
| `subscription_canceled` | Server-side: Polar webhook confirmed subscription canceled for user | `app/api/webhooks/polar/route.ts` |
| `social_account_connected` | User connected or reconnected a social account (Twitter/X) | `app/dashboard/connections/page.tsx` |
| `social_account_disconnected` | User disconnected a social account from their profile | `app/dashboard/connections/page.tsx` |
| `sign_out` | User signed out via the user menu | `components/dashboard/UserMenu.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- 📊 **Dashboard — Analytics basics**: https://eu.posthog.com/project/129277/dashboard/533172
- 🔽 **Signup to Subscription Conversion Funnel**: https://eu.posthog.com/project/129277/insights/Z9U0htu7
- 📈 **Daily Image Exports**: https://eu.posthog.com/project/129277/insights/1xhnlnd8
- 📉 **Subscription Cancellations Over Time**: https://eu.posthog.com/project/129277/insights/yoWuKmOd
- 🔽 **Upgrade Modal Conversion Funnel**: https://eu.posthog.com/project/129277/insights/8g86B08j
- 📊 **Sign-in Provider Breakdown**: https://eu.posthog.com/project/129277/insights/MqwErD0V

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
