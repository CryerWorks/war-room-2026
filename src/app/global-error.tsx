"use client";

// global-error — last-resort fallback when the root layout itself crashes.
// Must define its own <html>/<body> because it replaces the root layout.

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "global-error" },
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0c0e",
          color: "#e4e4e7",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: 32,
            borderRadius: 12,
            border: "1px solid rgba(239, 68, 68, 0.3)",
            background: "rgba(24, 24, 27, 0.7)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 16 }}>
            {/* Inline SVG alert triangle — no external dependencies */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f87171"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: "0 auto" }}
            >
              <path d="M12 9v4" />
              <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636-2.87L13.637 3.59a1.914 1.914 0 0 0-3.274 0z" />
              <path d="M12 16h.01" />
            </svg>
          </div>

          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Critical system failure
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#71717a",
              marginBottom: 24,
            }}
          >
            War Room encountered an unrecoverable error.
          </p>

          <button
            onClick={() => unstable_retry()}
            style={{
              padding: "8px 20px",
              fontSize: 13,
              fontFamily: "ui-monospace, monospace",
              color: "#e4e4e7",
              background: "#27272a",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Reinitialize system
          </button>

          {error.digest && (
            <p
              style={{
                marginTop: 16,
                fontSize: 10,
                color: "#3f3f46",
              }}
            >
              ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
