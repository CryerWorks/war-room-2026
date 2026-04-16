// OperationCard — summary of an operation within a goal card.
// Shows stepper timeline, progress stats, and edit/delete controls.
// Edit mode shows inline form. Delete has confirmation.

"use client";

import { useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import StepperTimeline from "@/components/ui/StepperTimeline";
import ProgressStats from "@/components/ui/ProgressStats";
import { sumModuleHours } from "@/lib/hours";

interface OperationCardProps {
  operation: {
    id: string;
    title: string;
    description: string;
    status: string;
    phases: Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      sort_order: number;
      modules: Array<{
        id: string;
        is_completed: boolean;
        start_time: string | null;
        end_time: string | null;
      }>;
    }>;
  };
  color: string;
  domainSlug: string;
  onUpdated?: () => void;
}

export default function OperationCard({ operation, color, domainSlug, onUpdated }: OperationCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [editTitle, setEditTitle] = useState(operation.title);
  const [editDescription, setEditDescription] = useState(operation.description);
  const [saving, setSaving] = useState(false);

  const allModules = operation.phases.flatMap((p) => p.modules);
  const totalModules = allModules.length;
  const completedModules = allModules.filter((m) => m.is_completed).length;
  const totalHours = sumModuleHours(allModules);

  const sortedPhases = [...operation.phases].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const timelineSteps = sortedPhases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    description: phase.description,
    status: phase.status as "pending" | "active" | "completed",
    stats: {
      completed: phase.modules.filter((m) => m.is_completed).length,
      total: phase.modules.length,
    },
  }));

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/${operation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      });
      if (res.ok) {
        setEditing(false);
        onUpdated?.();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setExiting(true);
    setTimeout(async () => {
      const res = await fetch(`/api/operations/${operation.id}`, { method: "DELETE" });
      if (res.ok) onUpdated?.();
    }, 300);
  }

  if (editing) {
    return (
      <div className="px-5 py-4 space-y-3 bg-zinc-950/50">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description"
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !editTitle.trim()}
            className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setEditTitle(operation.title);
              setEditDescription(operation.description);
            }}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-5 py-4 ${exiting ? "exiting" : ""}`}>
      {/* Header with title + controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/domains/${domainSlug}/operations/${operation.id}`}
            className="font-medium text-zinc-200 text-sm hover:text-white transition-colors"
          >
            {operation.title} →
          </Link>
          <StatusBadge status={operation.status} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Edit
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="text-xs text-red-400 font-medium hover:text-red-300"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                / Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {operation.description && (
        <p className="text-xs text-zinc-500 mb-3">{operation.description}</p>
      )}

      <div className="mb-4">
        <ProgressStats
          completed={completedModules}
          total={totalModules}
          hours={totalHours}
          label="modules"
          color={color}
        />
      </div>

      {timelineSteps.length > 0 && (
        <div className="ml-1">
          <StepperTimeline steps={timelineSteps} color={color} />
        </div>
      )}

      {timelineSteps.length === 0 && (
        <p className="text-xs text-zinc-600 italic">No phases defined yet</p>
      )}
    </div>
  );
}
