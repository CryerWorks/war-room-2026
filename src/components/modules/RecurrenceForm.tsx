// RecurrenceForm — create a recurring module rule.
//
// The form captures:
//   - What: title, description, domain, optional operation/phase link
//   - When: pattern (daily, weekly, specific days), time slot
//   - How long: start date, optional end date
//
// The pattern selector uses clickable day buttons (Mon-Sun) for
// the "specific_days" option — the most common use case for
// personal development (e.g., "practice MWF").

"use client";

import { useState, useEffect } from "react";
import type { Domain } from "@/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface RecurrenceFormProps {
  domains: Domain[];
  onCreated: () => void;
  onCancel: () => void;
}

export default function RecurrenceForm({
  domains,
  onCreated,
  onCancel,
}: RecurrenceFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domainId, setDomainId] = useState(domains[0]?.id || "");
  const [pattern, setPattern] = useState("specific_days");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]); // MWF default
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !domainId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/recurrence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          domain_id: domainId,
          pattern,
          days_of_week: pattern === "specific_days" ? daysOfWeek : [],
          start_time: startTime || null,
          end_time: endTime || null,
          start_date: startDate,
          end_date: endDate || null,
        }),
      });

      if (res.ok) {
        // Trigger generation immediately so modules appear
        await fetch("/api/recurrence/generate", { method: "POST" });
        onCreated();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Module Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. German vocabulary review"
          required
          className={inputClass}
        />
      </div>

      {/* Domain */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
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

      {/* Pattern */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Repeat Pattern
        </label>
        <div className="flex gap-2">
          {[
            { value: "daily", label: "Every Day" },
            { value: "weekly", label: "Weekly" },
            { value: "specific_days", label: "Specific Days" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPattern(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                pattern === opt.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Day selector — only for specific_days pattern */}
      {pattern === "specific_days" && (
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
            Days of Week
          </label>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDay(idx)}
                className={`w-10 h-10 rounded-lg text-xs font-mono font-medium transition-colors border ${
                  daysOfWeek.includes(idx)
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-zinc-700 text-zinc-500 hover:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time slot */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
            Start Time (optional)
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
            End Time (optional)
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Date range */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
            End Date (optional)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this recurring activity about?"
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="flex-1 py-2 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Creating..." : "Create Recurring Module"}
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
