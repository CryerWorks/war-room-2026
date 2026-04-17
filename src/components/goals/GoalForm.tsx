// GoalForm — form for creating a new goal within a domain.
// The icon field uses a simple text input for emoji — the user pastes an emoji directly.
// This is intentionally simple: no icon picker library, no bloat.
// A future enhancement could add a visual picker, but an emoji input works perfectly.

"use client";

import { useState, useEffect } from "react";
import IconPicker from "@/components/ui/IconPicker";

interface GoalFormProps {
  domainId: string;
  onCreated: () => void;
  onCancel: () => void;
}

export default function GoalForm({ domainId, onCreated, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [theatreId, setTheatreId] = useState("");
  const [theatres, setTheatres] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch available theatres for the selector
  useEffect(() => {
    async function fetchTheatres() {
      const res = await fetch("/api/theatres");
      if (res.ok) setTheatres(await res.json());
    }
    fetchTheatres();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain_id: domainId,
          title: title.trim(),
          description: description.trim(),
          icon: icon.trim() || null,
          target_date: targetDate || null,
          theatre_id: theatreId || null,
        }),
      });

      if (res.ok) onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        {/* Icon picker — replaces the old emoji text input */}
        <div className="flex-shrink-0">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
            Icon
          </label>
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        {/* Title */}
        <div className="flex-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
            Goal Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build Full-Stack Development Skills"
            required
            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does achieving this goal look like?"
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      {/* Target date */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Target Date (optional)
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Theatre selector (optional) */}
      {theatres.length > 0 && (
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
            Theatre (optional)
          </label>
          <select
            value={theatreId}
            onChange={(e) => setTheatreId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">— No theatre —</option>
            {theatres.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.icon ? `${t.icon} ` : ""}{t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="flex-1 py-2 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Creating..." : "Create Goal"}
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
