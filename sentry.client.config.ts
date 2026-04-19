// sentry.client.config.ts — Initializes Sentry in the browser.
// Loaded automatically via instrumentation-client.ts before React hydration.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring: sample 100% in dev, 20% in production.
  // Adjust tracesSampleRate downward as traffic grows to control costs.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Only send errors in production (or when DSN is explicitly set in dev).
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Filter out noisy browser errors that aren't actionable
  ignoreErrors: [
    // Browser extensions and third-party scripts
    "ResizeObserver loop",
    "Non-Error promise rejection captured",
  ],
});
