// sentry.edge.config.ts — Initializes Sentry in edge runtime (middleware, edge routes).
// Loaded automatically via instrumentation.ts when running in edge runtime.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring: sample 100% in dev, 20% in production.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Only send errors in production (or when DSN is explicitly set in dev).
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,
});
