// SituationReport — strategic overview section on the dashboard.
//
// ARCHITECTURE DECISION: Goals-first hierarchy
//
// The previous "Active Operations" component showed operations grouped
// by goal — but goals were small labels and operations were the cards.
// This inverted the actual hierarchy (Goal > Operation).
//
// SituationReport fixes this: goals are the primary visual element,
// operations are nested underneath. This mirrors the real data hierarchy
// and gives you the strategic view: "What am I trying to achieve?"
// before "What programs am I running?"
//
// Structure:
//   Situation Report (section header)
//     └── Goal card (icon, title, progress)
//           └── Operation rows (title, status, phase count)

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProgressStats from "@/components/ui/ProgressStats";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import TacticalIcon from "@/components/ui/TacticalIcon";

interface Module {
  id: string;
  title: string;
  is_completed: boolean;
}

interface Phase {
  id: string;
  title: string;
  status: string;
  sort_order: number;
  modules?: Module[] | null;
}

interface Theatre {
  id: string;
  name: string;
  icon?: string | null;
  color?: string;
}

interface Operation {
  id: string;
  title: string;
  status: string;
  domain?: { slug: string; color?: string } | null;
  goal?: { title: string; icon?: string; theatre_id?: string | null; theatre?: Theatre | null } | null;
  phases?: Phase[] | null;
}

interface CompletedGoal {
  id: string;
  title: string;
  icon?: string | null;
  completed_at?: string | null;
  domain?: { name: string; slug: string; color: string } | null;
}

interface SituationReportProps {
  activeOperations: Operation[];
  completedGoals: CompletedGoal[];
}

export default function SituationReport({
  activeOperations,
  completedGoals,
}: SituationReportProps) {
  const [showAllGoals, setShowAllGoals] = useState(false);
  // Tracks which goal cards have their operations expanded
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  // Tracks which operations have their phases expanded
  const [expandedOps, setExpandedOps] = useState<Set<string>>(new Set());
  // Loading animation state — plays once on mount, then reveals content
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Scan loader plays for 1.5s, then content fades in
    const loadTimer = setTimeout(() => setLoading(false), 1500);
    const revealTimer = setTimeout(() => setRevealed(true), 1600);
    return () => {
      clearTimeout(loadTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  // Nothing to show
  if (activeOperations.length === 0 && completedGoals.length === 0) return null;

  // Group: Theatre → Goal → Operations
  // First, group operations by goal (same as before)
  const goalMap: Record<string, {
    title: string;
    icon: string;
    theatreId: string | null;
    theatreName: string;
    theatreIcon: string;
    theatreColor: string;
    operations: Operation[];
  }> = {};

  for (const op of activeOperations) {
    const goalKey = op.goal?.title || "Ungrouped";
    if (!goalMap[goalKey]) {
      const theatre = op.goal?.theatre;
      goalMap[goalKey] = {
        title: op.goal?.title || "Standalone Operations",
        icon: op.goal?.icon || "",
        theatreId: theatre?.id || null,
        theatreName: theatre?.name || "",
        theatreIcon: theatre?.icon || "",
        theatreColor: theatre?.color || "",
        operations: [],
      };
    }
    goalMap[goalKey].operations.push(op);
  }

  const allGoals = Object.values(goalMap);

  // Group goals by theatre
  const theatreMap: Record<string, {
    name: string;
    icon: string;
    color: string;
    goals: typeof allGoals;
  }> = {};

  const untheatredGoals: typeof allGoals = [];

  for (const goal of allGoals) {
    if (goal.theatreId && goal.theatreName) {
      if (!theatreMap[goal.theatreId]) {
        theatreMap[goal.theatreId] = {
          name: goal.theatreName,
          icon: goal.theatreIcon,
          color: goal.theatreColor,
          goals: [],
        };
      }
      theatreMap[goal.theatreId].goals.push(goal);
    } else {
      untheatredGoals.push(goal);
    }
  }

  const theatreGroups = Object.values(theatreMap);
  // Combine: theatred goals first, then untheatred
  const displayGroups = [
    ...theatreGroups.map((t) => ({ type: "theatre" as const, ...t })),
    ...(untheatredGoals.length > 0
      ? [{ type: "standalone" as const, name: "", icon: "", color: "", goals: untheatredGoals }]
      : []),
  ];

  const totalGoals = allGoals.length;
  const showLimit = 3;
  const needsExpand = totalGoals > showLimit;

  return (
    <div className="space-y-3">
      {/* Section header — always visible */}
      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-400">
          Situation Report
        </h3>
        <p className="text-xs text-zinc-600 mt-0.5">Your primary objectives</p>
      </div>

      {/* Loading state — scan bar plays before content reveals */}
      {loading && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-6">
          <div className="flex flex-col items-center gap-2">
            <div className="scan-loader w-40" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">
              Loading intelligence
            </span>
          </div>
        </div>
      )}

      {/* Content — fades in after loading */}
      <div
        className={`transition-all duration-500 ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
      {/* Goals grouped by theatre */}
      {revealed && allGoals.length > 0 && (
        <div className="stagger-in space-y-4">
          {displayGroups.map((group, groupIdx) => (
            <div key={group.name || "standalone"}>
              {/* Theatre header — only for theatre groups */}
              {group.type === "theatre" && (
                <div className="flex items-center gap-2 mb-2">
                  {group.icon && <TacticalIcon name={group.icon} size={16} className="text-zinc-400" />}
                  <span
                    className="text-xs font-mono uppercase tracking-[0.15em] font-medium"
                    style={{ color: group.color || "#8b5cf6" }}
                  >
                    {group.name}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: `${group.color || "#8b5cf6"}20` }} />
                </div>
              )}

              <div className="space-y-3">
            {group.goals.map((goal) => {
              const isGoalExpanded = expandedGoals.has(goal.title);
              return (
                <div
                  key={goal.title}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
                >
                  {/* Goal header — clickable to expand operations */}
                  <button
                    onClick={() => {
                      setExpandedGoals((prev) => {
                        const next = new Set(prev);
                        if (next.has(goal.title)) {
                          next.delete(goal.title);
                        } else {
                          next.add(goal.title);
                        }
                        return next;
                      });
                    }}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-zinc-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {goal.icon && <TacticalIcon name={goal.icon} size={20} className="text-zinc-300" />}
                      <h4 className="font-semibold text-zinc-100 text-sm">
                        {goal.title}
                      </h4>
                      <span className="text-xs font-mono text-zinc-600">
                        {goal.operations.length} {goal.operations.length === 1 ? "operation" : "operations"}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${
                        isGoalExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Operations — accordion, collapsed by default */}
                  <div className={`accordion ${isGoalExpanded ? "open" : ""}`}>
                    <div>
                      <div className="divide-y divide-zinc-800/30 border-t border-zinc-800/50">
                        {goal.operations.map((op) => {
                          const isOpExpanded = expandedOps.has(op.id);
                          const sortedPhases = [...(op.phases || [])].sort(
                            (a, b) => a.sort_order - b.sort_order
                          );

                          return (
                            <div key={op.id}>
                              {/* Operation row — click to expand phases */}
                              <div className="flex items-center">
                                <button
                                  onClick={() => {
                                    setExpandedOps((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(op.id)) {
                                        next.delete(op.id);
                                      } else {
                                        next.add(op.id);
                                      }
                                      return next;
                                    });
                                  }}
                                  className="flex-1 flex items-center justify-between px-5 py-2.5 hover:bg-zinc-800/30 transition-colors group text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className={`w-3 h-3 text-zinc-600 transition-transform duration-200 ${
                                        isOpExpanded ? "rotate-90" : ""
                                      }`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                    <div
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: op.domain?.color || "#6366f1" }}
                                    />
                                    <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                                      {op.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-zinc-600">
                                      {sortedPhases.length} phases
                                    </span>
                                    <span
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider border"
                                      style={{
                                        color: op.domain?.color || "#3b82f6",
                                        borderColor: `${op.domain?.color || "#3b82f6"}30`,
                                        backgroundColor: `${op.domain?.color || "#3b82f6"}10`,
                                      }}
                                    >
                                      {op.status}
                                    </span>
                                  </div>
                                </button>
                                {/* Navigate arrow — separate from expand */}
                                <Link
                                  href={`/domains/${op.domain?.slug || "skill"}/operations/${op.id}`}
                                  className="px-3 py-2.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                                  title="Open operation"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </Link>
                              </div>

                              {/* Phases accordion */}
                              <div className={`accordion ${isOpExpanded ? "open" : ""}`}>
                                <div>
                                  <div className="pl-12 pr-5 pb-2 space-y-1">
                                    {sortedPhases.map((phase) => (
                                      <div key={phase.id}>
                                      <div
                                        className="flex items-center gap-2 py-1"
                                      >
                                        {/* Phase status dot */}
                                        <span
                                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            phase.status === "completed"
                                              ? "bg-emerald-500"
                                              : phase.status === "active"
                                                ? "bg-blue-500 animate-pulse"
                                                : "border border-zinc-600 bg-transparent"
                                          }`}
                                          style={
                                            phase.status === "active"
                                              ? { backgroundColor: op.domain?.color || "#3b82f6" }
                                              : phase.status === "completed"
                                                ? {}
                                                : undefined
                                          }
                                        />
                                        <span
                                          className={`text-xs ${
                                            phase.status === "completed"
                                              ? "text-zinc-500 line-through"
                                              : phase.status === "active"
                                                ? "text-zinc-200"
                                                : "text-zinc-500"
                                          }`}
                                        >
                                          {phase.title}
                                        </span>
                                        {phase.status === "active" && (
                                          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                                            current
                                          </span>
                                        )}
                                        {/* Module count */}
                                        {phase.modules && phase.modules.length > 0 && (
                                          <span className="text-[10px] font-mono text-zinc-600">
                                            {phase.modules.filter((m) => m.is_completed).length}/{phase.modules.length}
                                          </span>
                                        )}
                                      </div>
                                      {/* Modules under this phase */}
                                      {phase.modules && phase.modules.length > 0 && (
                                        <div className="ml-4 pl-3 border-l border-zinc-800/50 space-y-0.5 pb-1">
                                          {phase.modules.map((mod) => (
                                            <div
                                              key={mod.id}
                                              className="flex items-center gap-1.5 py-0.5"
                                            >
                                              <span
                                                className={`w-1 h-1 rounded-full flex-shrink-0 ${
                                                  mod.is_completed
                                                    ? "bg-emerald-500"
                                                    : "bg-zinc-700"
                                                }`}
                                              />
                                              <span
                                                className={`text-[11px] ${
                                                  mod.is_completed
                                                    ? "text-zinc-600 line-through"
                                                    : "text-zinc-400"
                                                }`}
                                              >
                                                {mod.title}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

              </div>
            </div>
          ))}

            {/* Expand/collapse for goals */}
            {needsExpand && (
              <button
                onClick={() => setShowAllGoals(!showAllGoals)}
                className="w-full py-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors border border-dashed border-zinc-800 rounded-lg hover:border-zinc-600"
              >
                {showAllGoals
                  ? "Show less"
                  : `Show all ${totalGoals} goals`}
              </button>
            )}

          {/* Completed objectives — nested inside the reveal */}
          {completedGoals.length > 0 && (
            <CollapsibleSection title="Completed Objectives" count={completedGoals.length}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedGoals.map((goal) => {
                  const domainColor = goal.domain?.color || "#6366f1";
                  return (
                    <div
                      key={goal.id}
                      className="relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 overflow-hidden"
                      style={{ borderLeftWidth: "3px", borderLeftColor: domainColor }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {goal.icon && <TacticalIcon name={goal.icon} size={20} className="text-zinc-300" />}
                          <h4 className="font-medium text-zinc-100">{goal.title}</h4>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-[0.15em] border flex-shrink-0"
                          style={{
                            color: domainColor,
                            borderColor: `${domainColor}40`,
                            backgroundColor: `${domainColor}10`,
                          }}
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Accomplished
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
                        <span style={{ color: domainColor }}>{goal.domain?.name}</span>
                        {goal.completed_at && (
                          <span>{new Date(goal.completed_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
