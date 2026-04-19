"use client";

// ErrorBoundary — tactical-themed error fallback for wrapping page sections.
// Uses Next.js 16's unstable_catchError for framework-aware error recovery
// (handles redirect(), notFound(), clears on navigation automatically).

import { unstable_catchError, type ErrorInfo } from "next/error";
import { useEffect } from "react";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

function ErrorFallback(
  props: { section: string },
  { error, unstable_retry }: ErrorInfo
) {
  useEffect(() => {
    console.error(
      `[War Room] Error in "${props.section}":\n`,
      error.message,
      "\n\nStack:",
      error.stack
    );
  }, [error, props.section]);

  return (
    <div
      role="alert"
      className="relative rounded-xl border border-red-900/50 bg-zinc-900/70 backdrop-blur-sm p-6"
    >
      {/* Scan line accent at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500/30 rounded-t-xl" />

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <IconAlertTriangle size={20} className="text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-200">
            Section offline:{" "}
            <span className="font-mono text-red-400">{props.section}</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500 font-mono truncate">
            {error.message || "Unknown error"}
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            This section encountered an error. The rest of the page is
            unaffected.
          </p>
        </div>

        <button
          onClick={() => unstable_retry()}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:border-zinc-600 hover:text-zinc-100 transition-all cursor-pointer"
        >
          <IconRefresh size={14} />
          Retry
        </button>
      </div>
    </div>
  );
}

const ErrorBoundary = unstable_catchError(ErrorFallback);
export default ErrorBoundary;
