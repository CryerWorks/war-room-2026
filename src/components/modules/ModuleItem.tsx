// ModuleItem — a single module row with display/edit/delete.
// Used in both the calendar DayDetail and the operation PhaseDetail.
// Click "Edit" → row transforms into a form. Save or Cancel.
// This is extracted as a shared component so editing works identically
// in both contexts — DRY principle (Don't Repeat Yourself).

"use client";

import { useState } from "react";
import { formatTime } from "@/lib/utils";

interface ModuleItemProps {
  module: {
    id: string;
    title: string;
    description: string;
    is_completed: boolean;
    start_time: string | null;
    end_time: string | null;
    scheduled_date: string;
    domain?: { color: string } | null;
    operation?: { title: string; goal?: { title: string; icon?: string } } | null;
    phase?: { title: string } | null;
  };
  // Optional context breadcrumb (used in PhaseDetail)
  breadcrumb?: string;
  breadcrumbColor?: string;
  showHierarchy?: boolean;
  onToggle: (id: string, currentState: boolean) => void;
  onDelete: (id: string) => void;
  onSaved: () => void;
  // Optional: notes section (rendered by parent)
  children?: React.ReactNode;
}

export default function ModuleItem({
  module: mod,
  breadcrumb,
  breadcrumbColor,
  showHierarchy = false,
  onToggle,
  onDelete,
  onSaved,
  children,
}: ModuleItemProps) {
  const [editing, setEditing] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [editTitle, setEditTitle] = useState(mod.title);
  const [editDescription, setEditDescription] = useState(mod.description);
  const [editStartTime, setEditStartTime] = useState(mod.start_time || "");
  const [editEndTime, setEditEndTime] = useState(mod.end_time || "");
  const [editDate, setEditDate] = useState(mod.scheduled_date || "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/modules/${mod.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          start_time: editStartTime || null,
          end_time: editEndTime || null,
          scheduled_date: editDate || mod.scheduled_date,
        }),
      });
      if (res.ok) {
        setEditing(false);
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setEditTitle(mod.title);
    setEditDescription(mod.description);
    setEditStartTime(mod.start_time || "");
    setEditEndTime(mod.end_time || "");
    setEditDate(mod.scheduled_date || "");
  }

  const inputClass = "w-full px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";

  if (editing) {
    return (
      <div className="px-4 sm:px-5 py-3 space-y-2 bg-zinc-950/50">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Module title"
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <input
            type="time"
            value={editStartTime}
            onChange={(e) => setEditStartTime(e.target.value)}
            className={`w-24 sm:w-28 ${inputClass}`}
          />
          <input
            type="time"
            value={editEndTime}
            onChange={(e) => setEditEndTime(e.target.value)}
            className={`w-24 sm:w-28 ${inputClass}`}
          />
        </div>
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className={`${inputClass} resize-none`}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !editTitle.trim()}
            className="flex-1 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-5 py-3">
      <div className="flex items-start gap-3">
        {/* Completion checkbox */}
        <button
          onClick={() => {
            setGlitching(true);
            setTimeout(() => setGlitching(false), 300);
            onToggle(mod.id, mod.is_completed);
          }}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            mod.is_completed
              ? "bg-emerald-500 border-emerald-500 text-white scale-110"
              : "border-zinc-600 hover:border-emerald-400 scale-100"
          }`}
        >
          <svg
            className={`w-3 h-3 transition-all duration-200 ${
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

        {/* Module content */}
        <div className="flex-1 min-w-0">
          {/* Hierarchy breadcrumb */}
          {showHierarchy && mod.operation && (
            <span
              className="text-[10px] font-mono block mb-0.5"
              style={{ color: "#f59e0b" }}
            >
              {mod.operation.goal?.icon && `${mod.operation.goal.icon} `}
              {mod.operation.goal?.title && `${mod.operation.goal.title} → `}
              {mod.operation.title}
              {mod.phase && ` → ${mod.phase.title}`}
            </span>
          )}

          {/* Phase context breadcrumb (for PhaseDetail) */}
          {breadcrumb && (
            <span
              className="text-[10px] font-mono block mb-0.5"
              style={{ color: breadcrumbColor || "#f59e0b" }}
            >
              {breadcrumb}
            </span>
          )}

          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: mod.domain?.color || "#6366f1" }}
            />
            <span
              className={`font-medium transition-all duration-200 ${
                mod.is_completed
                  ? "line-through text-zinc-500"
                  : "text-zinc-100"
              } ${glitching ? "glitch-once" : ""}`}
            >
              {mod.title}
            </span>
          </div>

          {/* Time slot */}
          {mod.start_time && (
            <p className="text-xs text-zinc-400 mb-1">
              {formatTime(mod.start_time)}
              {mod.end_time && ` – ${formatTime(mod.end_time)}`}
            </p>
          )}

          {/* Description */}
          {mod.description && (
            <p className="text-sm text-zinc-400">{mod.description}</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              Edit
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-1">
                <button
                  onClick={() => onDelete(mod.id)}
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
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
