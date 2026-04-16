"use client";

import { useState } from "react";
import type { ModuleNote } from "@/types";

interface ModuleNotesProps {
  moduleId: string;
  notes: ModuleNote[];
  onNotesChanged: () => void;
}

export default function ModuleNotes({ moduleId, notes, onNotesChanged }: ModuleNotesProps) {
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module_id: moduleId, content: newNote.trim() }),
      });

      if (res.ok) {
        setNewNote("");
        onNotesChanged();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteNote(noteId: string) {
    const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    if (res.ok) {
      onNotesChanged();
    }
  }

  return (
    <div className="space-y-3">
      {/* Existing notes */}
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-2 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800"
            >
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {note.content}
              </p>
              <button
                onClick={() => deleteNote(note.id)}
                className="text-xs text-zinc-400 hover:text-red-500 flex-shrink-0"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add note form */}
      <form onSubmit={addNote} className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <button
          type="submit"
          disabled={submitting || !newNote.trim()}
          className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}
