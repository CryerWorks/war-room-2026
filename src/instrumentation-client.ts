// instrumentation-client.ts — Next.js client instrumentation hook.
// Runs before React hydration. Loads the Sentry browser SDK.

import * as Sentry from "@sentry/nextjs";
import "../sentry.client.config";

// Captures client-side route transitions for performance monitoring.
// Next.js 16 calls this hook on every navigation event.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
