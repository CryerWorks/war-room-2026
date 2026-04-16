// ActiveOperations — dashboard section showing active operations grouped by goal.
// Shows first 4 by default with an expand toggle to see all.
// Each card links to the operation detail page.

"use client";

import { useState } from "react";
import Link from "next/link";

interface Operation {
  id: string;
  title: string;
  status: string;
  goal?: { title: string; icon?: string } | null;
  domain?: { slug: string; color?: string } | null;
  phases?: { id: string }[] | null;
}

interface ActiveOperationsProps {
  operations: Operation[];
}

export default function ActiveOperations({ operations }: ActiveOperationsProps) {
  const [expanded, setExpanded] = useState(false);

  if (operations.length === 0) return null;

  // Group by goal
  const grouped: Record<string, { goalTitle: string; goalIcon: string; ops: Operation[] }> = {};
  for (const op of operations) {
    const goalKey = op.goal?.title || "Ungrouped";
    if (!grouped[goalKey]) {
      grouped[goalKey] = {
        goalTitle: op.goal?.title || "Standalone",
        goalIcon: op.goal?.icon || "",
        ops: [],
      };
    }
    grouped[goalKey].ops.push(op);
  }

  const goalGroups = Object.values(grouped);
  const showLimit = 4;
  const totalOps = operations.length;
  const needsExpand = totalOps > showLimit;

  // Flatten for limiting — show first N operations across all groups
  let opsShown = 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">
          Active Operations
        </h3>
        <span className="text-xs font-mono text-zinc-500">
          {totalOps} active
        </span>
      </div>

      <div className="space-y-4">
        {goalGroups.map((group) => {
          // Filter ops to respect the limit when not expanded
          const visibleOps = expanded
            ? group.ops
            : group.ops.filter(() => {
                if (opsShown >= showLimit) return false;
                opsShown++;
                return true;
              });

          if (visibleOps.length === 0) return null;

          return (
            <div key={group.goalTitle}>
              {/* Goal header */}
              <div className="flex items-center gap-2 mb-2">
                {group.goalIcon && (
                  <span className="text-sm">{group.goalIcon}</span>
                )}
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  {group.goalTitle}
                </span>
              </div>

              {/* Operations for this goal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleOps.map((op) => (
                  <Link
                    key={op.id}
                    href={`/domains/${op.domain?.slug || "skill"}/operations/${op.id}`}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-600 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-zinc-200 text-sm group-hover:text-white transition-colors">
                        {op.title}
                      </h4>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wider border"
                        style={{
                          color: op.domain?.color || "#3b82f6",
                          borderColor: `${op.domain?.color || "#3b82f6"}30`,
                          backgroundColor: `${op.domain?.color || "#3b82f6"}15`,
                        }}
                      >
                        {op.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-600">
                      {op.phases?.length || 0} phases
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand/collapse toggle */}
      {needsExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full py-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors border border-dashed border-zinc-800 rounded-lg hover:border-zinc-600"
        >
          {expanded
            ? "Show less"
            : `Show all ${totalOps} operations`}
        </button>
      )}
    </div>
  );
}
