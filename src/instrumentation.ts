// instrumentation.ts — Next.js server instrumentation hook.
// Called once at server startup. Loads Sentry for the appropriate runtime.
// Also exports onRequestError to automatically capture server-side errors.

import { captureRequestError } from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import so the server config only loads in Node.js runtime
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Dynamic import so the edge config only loads in edge runtime
    await import("../sentry.edge.config");
  }
}

// onRequestError — called by Next.js whenever a server-side request throws.
// This captures route handler, server component, and middleware errors automatically.
export const onRequestError = captureRequestError;
