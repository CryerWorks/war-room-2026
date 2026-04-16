// Operation detail page — the command center for a single operation.
// Shows: phase timeline, module lists per phase, hours tracking, add phases/modules.
// This is a client component due to heavy interactivity.

"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import StepperTimeline from "@/components/ui/StepperTimeline";
import StatusBadge from "@/components/ui/StatusBadge";
import ProgressStats from "@/components/ui/ProgressStats";
import HoursDisplay from "@/components/ui/HoursDisplay";
import PhaseForm from "@/components/phases/PhaseForm";
import CompletionOverlay from "@/components/ui/CompletionOverlay";
import { sumModuleHours, formatHours } from "@/lib/hours";
import { formatDate, formatTime } from "@/lib/utils";
import type { CompletionEvent } from "@/types";

interface OperationDetailPageProps {
  params: Promise<{ slug: string; operationId: string }>;
}

export default function OperationDetailPage({ params }: OperationDetailPageProps) {
  const { slug, operationId } = use(params);
  const [operation, setOperation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [completionEvents, setCompletionEvents] = useState<CompletionEvent[]>([]);

  const fetchOperation = useCallback(async () => {
    try {
      const res = await fetch(`/api/operations/${operationId}`);
      if (res.ok) {
        const data = await res.json();
        setOperation(data);
        // Auto-expand the first active or pending phase
        const activePhase = data.phases?.find(
          (p: any) => p.status === "active" || p.status === "pending"
        );
        if (activePhase && !expandedPhase) {
          setExpandedPhase(activePhase.id);
        }
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [operationId]);

  useEffect(() => {
    fetchOperation();
  }, [fetchOperation]);

  async function toggleModule(moduleId: string, currentState: boolean) {
    const res = await fetch(`/api/modules/${moduleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: !currentState }),
    });

    if (res.ok) {
      const data = await res.json();
      // Check for cascade completion events
      if (data.completions && data.completions.length > 0) {
        setCompletionEvents(data.completions);
      }
      fetchOperation();
    }
  }

  // Activate a phase — only the NEXT sequential phase can be activated.
  // Phases are ordered by sort_order: you must complete Phase 1 before
  // Phase 2 can become active. Clicking any other phase just expands
  // its detail panel for viewing.
  async function activatePhase(phaseId: string) {
    const phase = sortedPhases.find((p: any) => p.id === phaseId);
    if (!phase) return;

    // Completed phases and already-active phases just expand the detail
    if (phase.status === "completed" || phase.status === "active") {
      setExpandedPhase(phaseId);
      return;
    }

    // Find the next activatable phase: the first pending phase where
    // all phases before it (lower sort_order) are completed.
    const nextActivatable = sortedPhases.find((p: any) => {
      if (p.status !== "pending") return false;
      // Check all phases with lower sort_order are completed
      const priorPhases = sortedPhases.filter(
        (prior: any) => prior.sort_order < p.sort_order
      );
      return priorPhases.every((prior: any) => prior.status === "completed");
    });

    // Only allow activation if this IS the next sequential phase
    if (!nextActivatable || nextActivatable.id !== phaseId) {
      // Not the next in sequence — just expand to view, don't activate
      setExpandedPhase(phaseId);
      return;
    }

    // Deactivate any currently active phase first
    const currentlyActive = sortedPhases.find((p: any) => p.status === "active");
    if (currentlyActive) {
      await fetch(`/api/phases/${currentlyActive.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      });
    }

    // Activate the next sequential phase
    await fetch(`/api/phases/${phaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });

    setExpandedPhase(phaseId);
    fetchOperation();
  }

  if (loading) {
    return <div className="py-20 text-center text-zinc-500">Loading...</div>;
  }

  if (!operation) {
    return <div className="py-20 text-center text-zinc-500">Operation not found.</div>;
  }

  const goal = operation.goal;
  const domain = goal?.domain;
  const color = domain?.color || "#6366f1";

  // Sort phases by sort_order
  const sortedPhases = [...(operation.phases || [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  // Compute stats
  const allModules = sortedPhases.flatMap((p: any) => p.modules || []);
  const totalModules = allModules.length;
  const completedModules = allModules.filter((m: any) => m.is_completed).length;
  const totalHours = sumModuleHours(allModules);
  const completedPhases = sortedPhases.filter(
    (p: any) => p.status === "completed"
  ).length;

  // Timeline steps for the stepper
  const timelineSteps = sortedPhases.map((phase: any) => ({
    id: phase.id,
    title: phase.title,
    description: phase.description,
    status: phase.status,
    stats: {
      completed: (phase.modules || []).filter((m: any) => m.is_completed).length,
      total: (phase.modules || []).length,
    },
  }));

  return (
    <div className="space-y-6">
      {/* Completion overlay */}
      {completionEvents.length > 0 && (
        <CompletionOverlay
          events={completionEvents}
          onDismiss={() => setCompletionEvents([])}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/domains" className="hover:text-zinc-300 transition-colors">
          Domains
        </Link>
        <span>/</span>
        <Link
          href={`/domains/${slug}`}
          className="hover:text-zinc-300 transition-colors"
        >
          {domain?.name || slug}
        </Link>
        <span>/</span>
        <span className="text-zinc-300">{operation.title}</span>
      </div>

      {/* Operation header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-zinc-100">
                {operation.title}
              </h2>
              <StatusBadge status={operation.status} />
            </div>
            {goal && (
              <p className="text-sm text-zinc-500">
                {goal.icon && `${goal.icon} `}Goal: {goal.title}
              </p>
            )}
            {operation.description && (
              <p className="text-sm text-zinc-400 mt-1">
                {operation.description}
              </p>
            )}
          </div>

          <HoursDisplay hours={totalHours} label="logged" />
        </div>

        {/* Stats row */}
        <ProgressStats
          completed={completedModules}
          total={totalModules}
          hours={totalHours}
          label="modules"
          color={color}
        />
        <div className="mt-2 flex gap-4 text-xs font-mono text-zinc-500">
          <span>{completedPhases}/{sortedPhases.length} phases</span>
          <span>{completedModules}/{totalModules} modules</span>
        </div>
      </div>

      {/* Two-column layout: timeline + phase detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phase timeline */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500 mb-4">
              Phase Timeline
            </h3>
            {timelineSteps.length > 0 ? (
              <StepperTimeline
                steps={timelineSteps}
                color={color}
                onStepClick={(id) => activatePhase(id)}
              />
            ) : (
              <p className="text-sm text-zinc-600">No phases yet.</p>
            )}

            {/* Add phase */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              {showPhaseForm ? (
                <PhaseForm
                  operationId={operationId}
                  nextSortOrder={sortedPhases.length}
                  onCreated={() => {
                    setShowPhaseForm(false);
                    fetchOperation();
                  }}
                  onCancel={() => setShowPhaseForm(false)}
                />
              ) : (
                <button
                  onClick={() => setShowPhaseForm(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  + Add Phase
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Phase detail — modules for the selected phase */}
        <div className="lg:col-span-2">
          {expandedPhase ? (
            <PhaseDetail
              phase={sortedPhases.find((p: any) => p.id === expandedPhase)}
              color={color}
              operationId={operationId}
              onToggleModule={toggleModule}
              onRefresh={fetchOperation}
            />
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
              Select a phase from the timeline to view its modules.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PhaseDetail — shows modules for a single phase
// ============================================================

function PhaseDetail({
  phase,
  color,
  operationId,
  onToggleModule,
  onRefresh,
}: {
  phase: any;
  color: string;
  operationId: string;
  onToggleModule: (id: string, current: boolean) => void;
  onRefresh: () => void;
}) {
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDate, setNewModuleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newModuleStart, setNewModuleStart] = useState("");
  const [newModuleEnd, setNewModuleEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!phase) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
        Phase not found.
      </div>
    );
  }

  const modules = phase.modules || [];
  const completed = modules.filter((m: any) => m.is_completed).length;
  const hours = sumModuleHours(modules);

  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;

    setSubmitting(true);
    try {
      // Get domain_id from the operation
      const opRes = await fetch(`/api/operations/${operationId}`);
      const opData = await opRes.json();

      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newModuleTitle.trim(),
          domain_id: opData.domain_id,
          operation_id: operationId,
          phase_id: phase.id,
          scheduled_date: newModuleDate,
          start_time: newModuleStart || null,
          end_time: newModuleEnd || null,
        }),
      });

      if (res.ok) {
        setNewModuleTitle("");
        setNewModuleStart("");
        setNewModuleEnd("");
        setShowAddModule(false);
        onRefresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Phase header */}
      <div className="px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-100">{phase.title}</h3>
            <StatusBadge status={phase.status} />
          </div>
          <HoursDisplay hours={hours} />
        </div>
        {phase.description && (
          <p className="text-sm text-zinc-500 mt-1">{phase.description}</p>
        )}
        <div className="mt-2">
          <ProgressStats
            completed={completed}
            total={modules.length}
            hours={hours}
            label="modules"
            color={color}
          />
        </div>
      </div>

      {/* Module list */}
      <div className="divide-y divide-zinc-800">
        {modules.length === 0 ? (
          <div className="px-5 py-6 text-center text-zinc-500 text-sm">
            No modules in this phase yet. Add modules to start tracking.
          </div>
        ) : (
          modules.map((mod: any) => (
            <div key={mod.id} className="px-5 py-3 flex items-center gap-3">
              {/* Checkbox */}
              <button
                onClick={() => onToggleModule(mod.id, mod.is_completed)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  mod.is_completed
                    ? "bg-emerald-500 border-emerald-500 text-white scale-110"
                    : "border-zinc-600 hover:border-emerald-400 scale-100"
                }`}
              >
                <svg
                  className={`w-3 h-3 transition-all duration-200 ${
                    mod.is_completed
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-50"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>

              {/* Module info */}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm transition-all duration-200 ${
                    mod.is_completed
                      ? "line-through text-zinc-500"
                      : "text-zinc-200"
                  }`}
                >
                  {mod.title}
                </span>
              </div>

              {/* Date and time */}
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono flex-shrink-0">
                {mod.scheduled_date && (
                  <span>{formatDate(mod.scheduled_date)}</span>
                )}
                {mod.start_time && (
                  <span>
                    {formatTime(mod.start_time)}
                    {mod.end_time && `–${formatTime(mod.end_time)}`}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add module */}
      <div className="px-5 py-3 border-t border-zinc-800">
        {showAddModule ? (
          <form onSubmit={addModule} className="space-y-3">
            <input
              type="text"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Module title"
              required
              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={newModuleDate}
                onChange={(e) => setNewModuleDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <input
                type="time"
                value={newModuleStart}
                onChange={(e) => setNewModuleStart(e.target.value)}
                placeholder="Start"
                className="w-28 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <input
                type="time"
                value={newModuleEnd}
                onChange={(e) => setNewModuleEnd(e.target.value)}
                placeholder="End"
                className="w-28 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting || !newModuleTitle.trim()}
                className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Adding..." : "Add Module"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModule(false)}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddModule(true)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            + Add Module to Phase
          </button>
        )}
      </div>
    </div>
  );
}
