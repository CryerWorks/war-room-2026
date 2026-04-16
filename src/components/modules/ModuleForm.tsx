"use client";

import { useState } from "react";
import type { Domain } from "@/types";

interface ModuleFormProps {
  date: string;
  domains: Domain[];
  onCreated: () => void;
}

export default function ModuleForm({ date, domains, onCreated }: ModuleFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domainId, setDomainId] = useState(domains[0]?.id || "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !domainId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          domain_id: domainId,
          scheduled_date: date,
          start_time: startTime || null,
          end_time: endTime || null,
        }),
      });

      if (res.ok) {
        onCreated();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. German vocabulary review"
          required
          className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Domain selector */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Domain
        </label>
        <div className="flex gap-2">
          {domains.map((domain) => (
            <button
              key={domain.id}
              type="button"
              onClick={() => setDomainId(domain.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                domainId === domain.id
                  ? "border-transparent text-white"
                  : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              }`}
              style={
                domainId === domain.id
                  ? { backgroundColor: domain.color }
                  : undefined
              }
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: domain.color }}
              />
              {domain.name}
            </button>
          ))}
        </div>
      </div>

      {/* Time range */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Start Time (optional)
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            End Time (optional)
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this module about?"
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="w-full py-2 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Creating..." : "Create Module"}
      </button>
    </form>
  );
}
