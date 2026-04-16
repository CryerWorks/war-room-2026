"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import ModuleForm from "@/components/modules/ModuleForm";
import ModuleNotes from "@/components/modules/ModuleNotes";
import ModuleItem from "@/components/modules/ModuleItem";
import CompletionOverlay from "@/components/ui/CompletionOverlay";
import type { ModuleWithDetails, Domain, CompletionEvent } from "@/types";

// Extended module type — includes joined operation/phase data from the API
interface ModuleWithHierarchy extends ModuleWithDetails {
  operation?: { title: string; goal?: { title: string; icon?: string } } | null;
  phase?: { title: string } | null;
}

interface DayDetailProps {
  date: string;
  domains: Domain[];
  onModuleChanged: () => void;
}

export default function DayDetail({ date, domains, onModuleChanged }: DayDetailProps) {
  const [modules, setModules] = useState<ModuleWithHierarchy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completionEvents, setCompletionEvents] = useState<CompletionEvent[]>([]);

  const fetchModules = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
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
    fetchModules(true); // show loading only when switching days
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
      const data = await res.json();
      // Check for cascade completion events
      if (data.completions && data.completions.length > 0) {
        setCompletionEvents(data.completions);
      }
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
    <>
    {/* Completion overlay for cascade events */}
    {completionEvents.length > 0 && (
      <CompletionOverlay
        events={completionEvents}
        onDismiss={() => setCompletionEvents([])}
      />
    )}
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 flex items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-zinc-100">
          {formatDate(date)}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex-shrink-0"
        >
          {showForm ? "Cancel" : "+ Add Module"}
        </button>
      </div>

      {/* Module creation form */}
      {showForm && (
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <ModuleForm
            date={date}
            domains={domains}
            onCreated={handleModuleCreated}
          />
        </div>
      )}

      {/* Module list */}
      <div className="divide-y divide-zinc-800">
        {loading ? (
          <div className="px-6 py-8 text-center text-zinc-400">Loading...</div>
        ) : modules.length === 0 ? (
          <div className="px-6 py-8 text-center text-zinc-400 text-zinc-500">
            No modules scheduled. Click &quot;+ Add Module&quot; to get started.
          </div>
        ) : (
          modules.map((mod) => (
            <ModuleItem
              key={mod.id}
              module={mod}
              showHierarchy
              onToggle={toggleCompletion}
              onDelete={deleteModule}
              onSaved={fetchModules}
            >
              <button
                onClick={() =>
                  setExpandedNotes(expandedNotes === mod.id ? null : mod.id)
                }
                className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                Notes ({mod.notes?.length || 0})
              </button>
              {expandedNotes === mod.id && (
                <div className="mt-3 w-full">
                  <ModuleNotes
                    moduleId={mod.id}
                    notes={mod.notes || []}
                    onNotesChanged={fetchModules}
                  />
                </div>
              )}
            </ModuleItem>
          ))
        )}
      </div>
    </div>
    </>
  );
}
