"use client";

import { useState, useEffect } from "react";
import { formatHours, timeBetween } from "@/lib/hours";
import type { CompletionEvent } from "@/types";

interface CompletionOverlayProps {
  events: CompletionEvent[];
  onDismiss: () => void;
}

// Auto-dismiss timers per tier (ms)
const DISMISS_DELAYS: Record<string, number> = {
  phase: 4000,
  operation: 5000,
  goal: 6000,
};

// Header text per tier
const TIER_HEADERS: Record<string, string> = {
  phase: "PHASE COMPLETE",
  operation: "OPERATION COMPLETE",
  goal: "OBJECTIVE ACHIEVED",
};

export default function CompletionOverlay({ events, onDismiss }: CompletionOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const event = events[currentIndex];

  useEffect(() => {
    if (!event) return;

    const delay = DISMISS_DELAYS[event.tier] || 4000;
    const timer = setTimeout(() => {
      if (currentIndex < events.length - 1) {
        // Move to next event in the cascade
        setCurrentIndex((i) => i + 1);
      } else {
        // Last event — fade out and dismiss
        setVisible(false);
        setTimeout(onDismiss, 300);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentIndex, event, events.length, onDismiss]);

  if (!event) return null;

  const isGoal = event.tier === "goal";
  const isOperation = event.tier === "operation";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: isGoal
            ? `radial-gradient(ellipse at center, ${event.color}15 0%, rgba(0,0,0,0.85) 70%)`
            : "rgba(0,0,0,0.7)",
        }}
      />

      {/* Overlay card */}
      <div
        className={`relative max-w-md w-full mx-4 rounded-xl border bg-zinc-950/95 backdrop-blur-sm p-6 animate-in ${
          isGoal ? "border-2" : "border"
        }`}
        style={{
          borderColor: `${event.color}60`,
          boxShadow: `0 0 ${isGoal ? "40px" : isOperation ? "20px" : "10px"} ${event.color}20`,
          animation: `slideUp 0.4s ease-out, ${
            isOperation || isGoal ? "borderPulse 2s ease-in-out infinite" : "none"
          }`,
          // @ts-expect-error CSS custom properties for animation
          "--glow-color": event.color,
        }}
      >
        {/* Accent line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
          style={{ backgroundColor: event.color }}
        />

        {/* Header */}
        <div className="text-center mb-4">
          {event.icon && isGoal && (
            <div className="text-4xl mb-2">{event.icon}</div>
          )}
          <p
            className="font-mono text-xs tracking-[0.3em] uppercase mb-1"
            style={{ color: event.color }}
          >
            {TIER_HEADERS[event.tier]}
          </p>
          <h3
            className={`font-bold text-zinc-100 ${
              isGoal ? "text-2xl" : "text-xl"
            }`}
          >
            {event.name}
          </h3>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCell
            label="Modules"
            value={String(event.stats.modules_completed)}
          />
          <StatCell
            label="Hours"
            value={formatHours(event.stats.hours_spent)}
          />
          {event.stats.phases_completed !== undefined && (
            <StatCell
              label="Phases"
              value={String(event.stats.phases_completed)}
            />
          )}
          {event.stats.operations_completed !== undefined && (
            <StatCell
              label="Operations"
              value={String(event.stats.operations_completed)}
            />
          )}
          {event.stats.time_to_complete && (
            <StatCell
              label="Duration"
              value={event.stats.time_to_complete}
            />
          )}
        </div>

        {/* Context line */}
        {event.context && (
          <div className="text-center border-t border-zinc-800 pt-3">
            <span className="text-xs text-zinc-500">
              {event.context.label}:{" "}
            </span>
            <span className="text-sm text-zinc-300">{event.context.name}</span>
          </div>
        )}

        {/* Dismiss hint */}
        <p className="text-center text-xs text-zinc-600 mt-3">
          Click to dismiss
        </p>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
      <p className="font-mono text-lg font-semibold text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
