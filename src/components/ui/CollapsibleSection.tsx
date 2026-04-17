// CollapsibleSection — a section with a clickable header that expands/collapses.
// Used for lower-priority dashboard content (Active Operations, Completed Objectives)
// that should be accessible but not dominating the view by default.
//
// Uses the same CSS accordion trick from globals.css — grid-template-rows
// transitions for smooth height animation.

"use client";

import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 group"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-200 ${
              open ? "rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-400 group-hover:text-zinc-300 transition-colors">
            {title}
          </h3>
          {count !== undefined && (
            <span className="text-xs font-mono text-zinc-600">{count}</span>
          )}
        </div>
      </button>

      <div className={`accordion ${open ? "open" : ""}`}>
        <div>
          <div className="pt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
