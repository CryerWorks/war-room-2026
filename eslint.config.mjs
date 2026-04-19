import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Downgrade pre-existing issues to warnings so CI catches new errors
    // without blocking on known tech debt.
    // V2-009 will replace `any` types with generated Supabase types.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Suppress React Hooks lint errors in pre-existing files that use
    // setState in effects and manual memoization patterns.
    // These are known issues, not regressions.
    files: [
      "**/CalendarGrid.tsx",
      "**/BootSequence.tsx",
      "**/PageTransition.tsx",
      "**/NotificationManager.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);

export default eslintConfig;
