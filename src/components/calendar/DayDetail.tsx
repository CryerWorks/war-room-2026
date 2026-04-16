"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import ModuleForm from "@/components/modules/ModuleForm";
import ModuleNotes from "@/components/modules/ModuleNotes";
import type { ModuleWithDetails, Domain } from "@/types";

interface DayDetailProps {
  date: string;
  domains: Domain[];
  onModuleChanged: () => void;
}

export default function DayDetail({ date, domains, onModuleChanged }: DayDetailProps) {
  const [modules, setModules] = useState<ModuleWithDetails[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/modules?date=${date}`);
      if (res.ok) {
        setModules(await res.json());
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchModules();
    setShowForm(false);
    setExpandedNotes(null);
  }, [fetchModules]);

  async function toggleCompletion(moduleId: string, currentState: boolean) {
    // Optimistic update — flip the UI immediately, don't wait for the server
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, is_completed: !currentState } : m
      )
    );

    const res = await fetch(`/api/modules/${moduleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: !currentState }),
    });

    if (res.ok) {
      fetchModules();
      onModuleChanged();
    } else {
      // Revert if the server rejected it
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, is_completed: currentState } : m
        )
      );
    }
  }

  async function deleteModule(moduleId: string) {
    const res = await fetch(`/api/modules/${moduleId}`, { method: "DELETE" });
    if (res.ok) {
      fetchModules();
      onModuleChanged();
    }
  }

  function handleModuleCreated() {
    setShowForm(false);
    fetchModules();
    onModuleChanged();
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {formatDate(date)}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Module"}
        </button>
      </div>

      {/* Module creation form */}
      {showForm && (
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <ModuleForm
            date={date}
            domains={domains}
            onCreated={handleModuleCreated}
          />
        </div>
      )}

      {/* Module list */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {loading ? (
          <div className="px-6 py-8 text-center text-zinc-400">Loading...</div>
        ) : modules.length === 0 ? (
          <div className="px-6 py-8 text-center text-zinc-400 dark:text-zinc-500">
            No modules scheduled. Click &quot;+ Add Module&quot; to get started.
          </div>
        ) : (
          modules.map((mod) => (
            <div key={mod.id} className="px-6 py-4">
              <div className="flex items-start gap-3">
                {/* Completion checkbox */}
                <button
                  onClick={() => toggleCompletion(mod.id, mod.is_completed)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    mod.is_completed
                      ? "bg-emerald-500 border-emerald-500 text-white scale-110"
                      : "border-zinc-300 dark:border-zinc-600 hover:border-emerald-400 scale-100"
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

                {/* Module content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: mod.domain?.color || "#6366f1" }}
                    />
                    <span
                      className={`font-medium transition-all duration-200 ${
                        mod.is_completed
                          ? "line-through text-zinc-400 dark:text-zinc-500"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {mod.title}
                    </span>
                  </div>

                  {/* Time slot */}
                  {mod.start_time && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      {formatTime(mod.start_time)}
                      {mod.end_time && ` – ${formatTime(mod.end_time)}`}
                    </p>
                  )}

                  {/* Description */}
                  {mod.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {mod.description}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() =>
                        setExpandedNotes(expandedNotes === mod.id ? null : mod.id)
                      }
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      Notes ({mod.notes?.length || 0})
                    </button>
                    <button
                      onClick={() => deleteModule(mod.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Notes panel */}
                  {expandedNotes === mod.id && (
                    <div className="mt-3">
                      <ModuleNotes
                        moduleId={mod.id}
                        notes={mod.notes || []}
                        onNotesChanged={fetchModules}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
