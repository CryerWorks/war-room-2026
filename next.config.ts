import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Suppress build logs unless debugging source map uploads
  silent: true,

  // Uploads source maps to Sentry so production stack traces are readable.
  // Maps are deleted from the build output after upload to avoid exposing source code.
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Tunnel Sentry events through a Next.js route to bypass ad-blockers.
  // Generates a random route path per build so blockers can't pattern-match it.
  tunnelRoute: true,

  // Tree-shake Sentry debug logging from production bundle
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
