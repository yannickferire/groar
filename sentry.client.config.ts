// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://81930c6120c34449d568a50c27148333@o4510788317347840.ingest.de.sentry.io/4510788322000976",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,

  // Define how likely Replay events are sampled.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Ignore known harmless errors
  ignoreErrors: [
    "Cannot read properties of undefined (reading 'removeListener')", // Next.js prefetch cleanup race condition
    "Object captured as promise rejection with keys: code, message", // Network errors / ad blockers causing unhandled fetch rejections
  ],
});
