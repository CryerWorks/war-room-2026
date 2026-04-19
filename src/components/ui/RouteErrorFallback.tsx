"use client";

// RouteErrorFallback — shared tactical-themed error UI for route-level error.tsx files.
// Separated from the route files so all four routes share the same look.

import { useEffect } from "react";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
  route: string;
}

export default function RouteErrorFallback({
  error,
  unstable_retry,
  route,
}: RouteErrorFallbackProps) {
  useEffect(() => {
    console.error(
      `[War Room] Route error in "${route}":\n`,
      error.message,
      error.digest ? `\nDigest: ${error.digest}` : "",
      "\n\nStack:",
      error.stack
    );
  }, [error, route]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="relative w-full max-w-md rounded-xl border border-red-900/40 bg-zinc-900/70 backdrop-blur-sm p-8 text-center">
        {/* Top accent line */}
        <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent rounded-t-xl" />

        <IconAlertTriangle size={32} className="text-red-400 mx-auto mb-4" />

        <h2 className="text-lg font-semibold text-zinc-100 mb-1">
          System malfunction
        </h2>
        <p className="text-sm text-zinc-500 font-mono mb-1">{route}</p>
        <p className="text-xs text-zinc-600 mb-6 font-mono truncate px-4">
          {error.message || "An unexpected error occurred"}
        </p>

        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-mono text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:border-zinc-500 hover:text-zinc-100 transition-all cursor-pointer"
        >
          <IconRefresh size={16} />
          Reinitialize
        </button>

        {error.digest && (
          <p className="mt-4 text-[10px] text-zinc-700 font-mono">
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
