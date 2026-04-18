// TagSelector — inline tag management for modules.
//
// Shows assigned tags as small colored pills.
// Click "+" to open a dropdown of available tags.
// Click "×" on a pill to remove the tag.
//
// DESIGN DECISION: Tags are shown inline with the module's action
// buttons (edit, delete, notes, dependencies). This keeps them
// visible without taking extra vertical space. The colored pills
// provide an instant visual signal of what type of activity each
// module is — you can scan a phase's module list and immediately
// see the balance between "practice" and "theory".

"use client";

import { useState, useEffect } from "react";

interface AssignedTag {
  id: string; // module_tags.id (for deletion)
  tag_id: string;
  tag?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface AvailableTag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  moduleId: string;
  assignedTags: AssignedTag[];
  onChanged: () => void;
}

export default function TagSelector({ moduleId, assignedTags, onChanged }: TagSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [allTags, setAllTags] = useState<AvailableTag[]>([]);
  const [adding, setAdding] = useState(false);

  // Fetch all available tags when picker opens
  useEffect(() => {
    if (!showPicker) return;
    async function fetchTags() {
      const res = await fetch("/api/tags");
      if (res.ok) setAllTags(await res.json());
    }
    fetchTags();
  }, [showPicker]);

  // Filter out already-assigned tags
  const assignedIds = new Set(assignedTags.map((t) => t.tag_id));
  const pickable = allTags.filter((t) => !assignedIds.has(t.id));

  async function addTag(tagId: string) {
    setAdding(true);
    try {
      const res = await fetch("/api/module-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId, tag_id: tagId }),
      });
      if (res.ok) {
        setShowPicker(false);
        onChanged();
      }
    } finally {
      setAdding(false);
    }
  }

  async function removeTag(moduleTagId: string) {
    await fetch(`/api/module-tags/${moduleTagId}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* Assigned tag pills */}
      {assignedTags.map((at) => (
        at.tag && (
          <span
            key={at.id}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border"
            style={{
              color: at.tag.color,
              borderColor: `${at.tag.color}30`,
              backgroundColor: `${at.tag.color}10`,
            }}
          >
            {at.tag.name}
            <button
              onClick={() => removeTag(at.id)}
              className="hover:opacity-70 transition-opacity"
            >
              ×
            </button>
          </span>
        )
      ))}

      {/* Add tag button/picker */}
      {showPicker ? (
        <div className="relative">
          <select
            onChange={(e) => {
              if (e.target.value) addTag(e.target.value);
            }}
            disabled={adding}
            className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 text-[10px] font-mono focus:ring-1 focus:ring-blue-500 outline-none"
            defaultValue=""
            autoFocus
          >
            <option value="" disabled>Add tag...</option>
            {pickable.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowPicker(false)}
            className="ml-1 text-[10px] text-zinc-600 hover:text-zinc-400"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          + tag
        </button>
      )}
    </div>
  );
}
