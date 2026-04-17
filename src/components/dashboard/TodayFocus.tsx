// TodayFocus — the "what do I need to do today?" view on the dashboard.
//
// ARCHITECTURE DECISIONS:
//
// 1. This is a client component even though the data comes from the server.
//    Why? Because checkboxes need onClick handlers (interactivity requires
//    client-side JavaScript). The server component (page.tsx) fetches the
//    data and passes it as props — fast initial render, interactive controls.
//
// 2. Modules are grouped by domain, not by time. Why? The domain grouping
//    gives you a mental model of "how balanced is my day across my three
//    areas?" Time ordering is secondary — you can see times within each group.
//
// 3. We use optimistic updates (same pattern as DayDetail) — the checkbox
//    flips immediately, then syncs with the server. If the server rejects,
//    we revert. This keeps the UI feeling instant.
//
// 4. When all modules for the day are complete, we show a "day cleared"
//    message. This is the small dopamine hit that makes daily usage sticky.

"use client";

import { useState } from "react";
import { formatTime } from "@/lib/utils";
import TacticalIcon from "@/components/ui/TacticalIcon";
import { useRouter } from "next/navigation";
import type { Domain } from "@/types";

interface TodayModule {
  id: string;
  title: string;
  description: string;
  is_completed: boolean;
  start_time: string | null;
  end_time: string | null;
  domain_id: string;
  domain?: Domain | null;
  operation?: { title: string; goal?: { title: string; icon?: string } } | null;
  phase?: { title: string } | null;
}

interface TodayFocusProps {
  modules: TodayModule[];
  domains: Domain[];
}

export default function TodayFocus({ modules: initialModules, domains }: TodayFocusProps) {
  // Local state for optimistic updates.
  // We copy the server-provided modules into state so we can mutate
  // them immediately on checkbox click without waiting for the server.
  const [modules, setModules] = useState(initialModules);
  const [glitchingId, setGlitchingId] = useState<string | null>(null);
  const router = useRouter();

  // Don't render if there are no modules today
  if (modules.length === 0) return null;

  const completedCount = modules.filter((m) => m.is_completed).length;
  const totalCount = modules.length;
  const allDone = completedCount === totalCount;

  // Group modules by domain — gives a balanced view of the day
  const grouped: Record<string, { domain: Domain; modules: TodayModule[] }> = {};
  for (const mod of modules) {
    const domainId = mod.domain_id;
    if (!grouped[domainId]) {
      const domain = domains.find((d) => d.id === domainId) || mod.domain;
      grouped[domainId] = {
        domain: domain as Domain,
        modules: [],
      };
    }
    grouped[domainId].modules.push(mod);
  }

  const domainGroups = Object.values(grouped);

  async function toggleModule(moduleId: string, currentState: boolean) {
    // Optimistic update — flip immediately
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, is_completed: !currentState } : m
      )
    );

    // Glitch effect on the title
    setGlitchingId(moduleId);
    setTimeout(() => setGlitchingId(null), 300);

    const res = await fetch(`/api/modules/${moduleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: !currentState }),
    });

    if (res.ok) {
      // Refresh the server component data so stats update
      // (completion count, streak, etc.)
      router.refresh();
    } else {
      // Revert on failure
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, is_completed: currentState } : m
        )
      );
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-400">
            Today&apos;s Focus
          </h3>
          <span className="font-mono text-xs text-zinc-600">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Mini progress bar for the day */}
        <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${totalCount === 0 ? 0 : (completedCount / totalCount) * 100}%`,
              backgroundColor: allDone ? "#10b981" : "#3b82f6",
            }}
          />
        </div>
      </div>

      {/* All done state */}
      {allDone && totalCount > 0 && (
        <div className="px-5 py-4 text-center">
          <p className="text-sm font-mono text-emerald-400">
            ALL OBJECTIVES CLEARED
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {totalCount} module{totalCount !== 1 ? "s" : ""} completed today
          </p>
        </div>
      )}

      {/* Module groups by domain */}
      {!allDone && (
        <div className="divide-y divide-zinc-800/50">
          {domainGroups.map(({ domain, modules: domainModules }) => (
            <div key={domain.id} className="px-5 py-3">
              {/* Domain label */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: domain.color }}
                />
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  {domain.name}
                </span>
                <span className="text-xs font-mono text-zinc-700">
                  {domainModules.filter((m) => m.is_completed).length}/{domainModules.length}
                </span>
              </div>

              {/* Modules */}
              <div className="space-y-1.5 ml-4">
                {domainModules.map((mod) => (
                  <div key={mod.id} className="flex items-start gap-2.5">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleModule(mod.id, mod.is_completed)}
                      className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        mod.is_completed
                          ? "bg-emerald-500 border-emerald-500 text-white scale-110"
                          : "border-zinc-600 hover:border-emerald-400"
                      }`}
                    >
                      <svg
                        className={`w-2.5 h-2.5 transition-all duration-200 ${
                          mod.is_completed ? "opacity-100 scale-100" : "opacity-0 scale-50"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Hierarchy breadcrumb */}
                      {mod.operation && (
                        <span className="text-[10px] font-mono mb-0.5 flex items-center gap-1" style={{ color: "#f59e0b" }}>
                          {mod.operation.goal?.icon && <TacticalIcon name={mod.operation.goal.icon} size={11} />}
                          {mod.operation.goal?.title && `${mod.operation.goal.title} → `}
                          {mod.operation.title}
                          {mod.phase && ` → ${mod.phase.title}`}
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm transition-all duration-200 ${
                            mod.is_completed
                              ? "line-through text-zinc-500"
                              : "text-zinc-200"
                          } ${glitchingId === mod.id ? "glitch-once" : ""}`}
                        >
                          {mod.title}
                        </span>

                        {/* Time badge */}
                        {mod.start_time && (
                          <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0">
                            {formatTime(mod.start_time)}
                            {mod.end_time && `–${formatTime(mod.end_time)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
