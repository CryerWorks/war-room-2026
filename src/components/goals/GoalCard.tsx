// GoalCard — displays a goal with its operations, progress, and management controls.
// Expanding reveals: operations list, edit/delete controls, add operation form.
// Edit mode transforms the header into a pre-filled form.
// Delete requires confirmation to prevent accidental cascading deletes.

"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import ProgressStats from "@/components/ui/ProgressStats";
import HoursDisplay from "@/components/ui/HoursDisplay";
import TacticalIcon from "@/components/ui/TacticalIcon";
import IconPicker from "@/components/ui/IconPicker";
import OperationCard from "@/components/operations/OperationCard";
import OperationForm from "@/components/operations/OperationForm";
import { sumModuleHours } from "@/lib/hours";
import type { Goal, Theatre } from "@/types";

interface GoalCardProps {
  domainSlug: string;
  goal: {
    id: string;
    title: string;
    description: string;
    icon: string | null;
    status: string;
    target_date: string | null;
    theatre_id: string | null;
    domain_id: string;
    operations: Array<{
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
    }>;
  };
  color: string;
  onUpdated: () => void;
}

export default function GoalCard({ domainSlug, goal, color, onUpdated }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showOpForm, setShowOpForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeTargets, setMergeTargets] = useState<Goal[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [merging, setMerging] = useState(false);

  // Edit form state — pre-filled with current values
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDescription, setEditDescription] = useState(goal.description);
  const [editIcon, setEditIcon] = useState(goal.icon || "");
  const [editTargetDate, setEditTargetDate] = useState(goal.target_date || "");
  const [editTheatreId, setEditTheatreId] = useState(goal.theatre_id || "");
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch theatres when editing starts
  useEffect(() => {
    if (!editing) return;
    async function fetchTheatres() {
      const res = await fetch("/api/theatres");
      if (res.ok) setTheatres(await res.json());
    }
    fetchTheatres();
  }, [editing]);

  // Compute progress
  const allModules = goal.operations.flatMap((op) =>
    op.phases.flatMap((p) => p.modules)
  );
  const totalModules = allModules.length;
  const completedModules = allModules.filter((m) => m.is_completed).length;
  const totalHours = sumModuleHours(allModules);
  const completedOps = goal.operations.filter(
    (o) => o.status === "completed"
  ).length;

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          icon: editIcon.trim() || null,
          target_date: editTargetDate || null,
          theatre_id: editTheatreId || null,
        }),
      });
      if (res.ok) {
        setEditing(false);
        onUpdated();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setExiting(true);
    setTimeout(async () => {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (res.ok) onUpdated();
    }, 300);
  }

  // Fetch sibling goals when merge picker opens
  useEffect(() => {
    if (!showMerge) return;
    async function fetchSiblings() {
      const res = await fetch(`/api/goals?domain_id=${goal.domain_id}&status=active`);
      if (res.ok) {
        const all: Goal[] = await res.json();
        // Filter out this goal — can't merge into yourself
        setMergeTargets(all.filter((g) => g.id !== goal.id));
      }
    }
    fetchSiblings();
  }, [showMerge, goal.id, goal.domain_id]);

  async function handleMerge(targetId: string) {
    setMerging(true);
    try {
      const res = await fetch("/api/goals/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: goal.id, target_id: targetId }),
      });
      if (res.ok) {
        setExiting(true);
        setTimeout(() => onUpdated(), 300);
      }
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden ${exiting ? "exiting" : ""}`}>
      {/* Clickable header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {goal.icon && <TacticalIcon name={goal.icon} size={24} className="text-zinc-300" />}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100">{goal.title}</h3>
                <StatusBadge status={goal.status} />
              </div>
              {goal.description && (
                <p className="text-sm text-zinc-500 mt-0.5">{goal.description}</p>
              )}
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div className="mt-3">
          <ProgressStats
            completed={completedModules}
            total={totalModules}
            hours={totalHours}
            label="modules"
            color={color}
          />
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
          <span className="font-mono">
            {completedOps}/{goal.operations.length} operations
          </span>
          {goal.target_date && <span>Target: {goal.target_date}</span>}
          {totalHours > 0 && <HoursDisplay hours={totalHours} />}
        </div>
      </button>

      {/* Expanded content — accordion animated via CSS grid trick */}
      <div className={`accordion ${expanded ? "open" : ""}`}>
        <div>
        <div className="border-t border-zinc-800">
          {/* Edit form (replaces content when editing) */}
          {editing ? (
            <div className="px-5 py-4 space-y-3 bg-zinc-950/50">
              <div className="flex gap-3">
                <IconPicker value={editIcon} onChange={setEditIcon} />
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
              <input
                type="date"
                value={editTargetDate}
                onChange={(e) => setEditTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              {theatres.length > 0 && (
                <select
                  value={editTheatreId}
                  onChange={(e) => setEditTheatreId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">— No theatre —</option>
                  {theatres.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon ? `${t.icon} ` : ""}{t.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editTitle.trim()}
                  className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditTitle(goal.title);
                    setEditDescription(goal.description);
                    setEditIcon(goal.icon || "");
                    setEditTargetDate(goal.target_date || "");
                    setEditTheatreId(goal.theatre_id || "");
                  }}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Management controls */}
              <div className="px-5 py-2 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/30">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Edit
                </button>
                {/* Merge — two-step: select target, then confirm */}
                {showMerge ? (
                  <span className="inline-flex items-center gap-1.5">
                    {mergeTargets.length === 0 ? (
                      <span className="text-xs text-zinc-500">No other goals to merge into</span>
                    ) : mergeTargetId ? (
                      <>
                        <span className="text-xs text-amber-400">
                          Merge into &quot;{mergeTargets.find((g) => g.id === mergeTargetId)?.title}&quot;?
                        </span>
                        <button
                          onClick={() => handleMerge(mergeTargetId)}
                          disabled={merging}
                          className="text-xs text-amber-400 font-medium hover:text-amber-300 transition-colors"
                        >
                          {merging ? "Merging..." : "Confirm"}
                        </button>
                      </>
                    ) : (
                      <select
                        onChange={(e) => setMergeTargetId(e.target.value)}
                        className="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 text-[10px] font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>Merge into...</option>
                        {mergeTargets.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.icon ? `${g.icon} ` : ""}{g.title}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => { setShowMerge(false); setMergeTargetId(""); }}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      ×
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setShowMerge(true)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Merge
                  </button>
                )}

                {/* Delete */}
                {confirmDelete ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-red-400">Delete?</span>
                    <button
                      onClick={handleDelete}
                      className="text-xs text-red-400 font-medium hover:text-red-300 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      No
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

              {/* Operations list */}
              {goal.operations.length === 0 ? (
                <div className="px-5 py-6 text-center text-zinc-500 text-sm">
                  No operations yet. Create one to start structuring your work.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800 stagger-in">
                  {goal.operations.map((op) => (
                    <OperationCard
                      key={op.id}
                      operation={op}
                      color={color}
                      domainSlug={domainSlug}
                      onUpdated={onUpdated}
                    />
                  ))}
                </div>
              )}

              {/* Add operation */}
              <div className="px-5 py-3 border-t border-zinc-800">
                {showOpForm ? (
                  <OperationForm
                    goalId={goal.id}
                    domainId={goal.domain_id}
                    onCreated={() => {
                      setShowOpForm(false);
                      onUpdated();
                    }}
                    onCancel={() => setShowOpForm(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowOpForm(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    + Add Operation
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
