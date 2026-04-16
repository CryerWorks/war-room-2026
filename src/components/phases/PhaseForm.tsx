// PhaseForm — form for adding a phase to an operation.
// Phases are sequential stages (e.g., "Phase 1: Fundamentals", "Phase 2: Advanced Patterns").
// The sort_order determines display sequence — we auto-calculate it from existing phases.

"use client";

import { useState } from "react";

interface PhaseFormProps {
  operationId: string;
  nextSortOrder: number; // calculated by parent from existing phases
  onCreated: () => void;
  onCancel: () => void;
}

export default function PhaseForm({
  operationId,
  nextSortOrder,
  onCreated,
  onCancel,
}: PhaseFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation_id: operationId,
          title: title.trim(),
          description: description.trim(),
          sort_order: nextSortOrder,
        }),
      });

      if (res.ok) onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Phase Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`e.g. Phase ${nextSortOrder + 1}: Fundamentals`}
          required
          className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this phase cover?"
          className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="flex-1 py-2 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Adding..." : "Add Phase"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
