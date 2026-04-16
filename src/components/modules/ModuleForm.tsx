// ModuleForm — creates a new module, optionally linked to an operation/phase.
//
// The cascading selector works like this:
// 1. Pick a domain (required) → filters available goals
// 2. Optionally pick a goal → filters available operations
// 3. Optionally pick an operation → filters available phases
// 4. Optionally pick a phase → module will be linked
//
// Each level resets the levels below it when changed.
// The "Link to Operation" section is collapsible to keep the form clean
// for quick standalone module creation.

"use client";

import { useState, useEffect } from "react";
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

  // Cascading selector state
  const [showLinking, setShowLinking] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [operations, setOperations] = useState<any[]>([]);
  const [selectedOperationId, setSelectedOperationId] = useState("");
  const [phases, setPhases] = useState<any[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState("");

  // Fetch goals when domain changes
  useEffect(() => {
    if (!domainId || !showLinking) return;
    setSelectedGoalId("");
    setOperations([]);
    setSelectedOperationId("");
    setPhases([]);
    setSelectedPhaseId("");

    async function fetchGoals() {
      const res = await fetch(`/api/goals?domain_id=${domainId}&status=active`);
      if (res.ok) setGoals(await res.json());
    }
    fetchGoals();
  }, [domainId, showLinking]);

  // Fetch operations when goal changes
  useEffect(() => {
    if (!selectedGoalId) {
      setOperations([]);
      setSelectedOperationId("");
      setPhases([]);
      setSelectedPhaseId("");
      return;
    }

    async function fetchOperations() {
      const res = await fetch(`/api/operations?goal_id=${selectedGoalId}&status=active`);
      if (res.ok) setOperations(await res.json());
    }
    fetchOperations();
  }, [selectedGoalId]);

  // Fetch phases when operation changes
  useEffect(() => {
    if (!selectedOperationId) {
      setPhases([]);
      setSelectedPhaseId("");
      return;
    }

    async function fetchPhases() {
      const res = await fetch(`/api/phases?operation_id=${selectedOperationId}`);
      if (res.ok) setPhases(await res.json());
    }
    fetchPhases();
  }, [selectedOperationId]);

  function handleDomainChange(newDomainId: string) {
    setDomainId(newDomainId);
    // Reset cascade
    setSelectedGoalId("");
    setSelectedOperationId("");
    setSelectedPhaseId("");
  }

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
          operation_id: selectedOperationId || null,
          phase_id: selectedPhaseId || null,
          scheduled_date: date,
          start_time: startTime || null,
          end_time: endTime || null,
        }),
      });

      if (res.ok) onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  const selectClass = "w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";
  const inputClass = selectClass;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Title
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

      {/* Domain selector */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Domain
        </label>
        <div className="flex gap-2">
          {domains.map((domain) => (
            <button
              key={domain.id}
              type="button"
              onClick={() => handleDomainChange(domain.id)}
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

      {/* Link to Operation — collapsible cascading selector */}
      <div>
        <button
          type="button"
          onClick={() => setShowLinking(!showLinking)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
        >
          <svg
            className={`w-3 h-3 transition-transform ${showLinking ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Link to Operation (optional)
        </button>

        {showLinking && (
          <div className="mt-2 space-y-3 pl-4 border-l-2 border-zinc-800">
            {/* Goal selector */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1">
                Goal
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className={selectClass}
              >
                <option value="">— None (standalone module) —</option>
                {goals.map((g: any) => (
                  <option key={g.id} value={g.id}>
                    {g.icon ? `${g.icon} ` : ""}{g.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Operation selector — only shows if a goal is selected */}
            {selectedGoalId && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1">
                  Operation
                </label>
                <select
                  value={selectedOperationId}
                  onChange={(e) => setSelectedOperationId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">— Select operation —</option>
                  {operations.map((op: any) => (
                    <option key={op.id} value={op.id}>
                      {op.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Phase selector — only shows if an operation is selected */}
            {selectedOperationId && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1">
                  Phase
                </label>
                <select
                  value={selectedPhaseId}
                  onChange={(e) => setSelectedPhaseId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">— Select phase —</option>
                  {phases.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Context preview — shows what the module will be linked to */}
            {selectedPhaseId && (
              <div className="text-xs font-mono text-zinc-500 bg-zinc-900/50 rounded px-3 py-2 border border-zinc-800">
                <span className="text-zinc-600">Linking to: </span>
                <span className="text-zinc-300">
                  {goals.find((g: any) => g.id === selectedGoalId)?.title}
                  {" → "}
                  {operations.find((o: any) => o.id === selectedOperationId)?.title}
                  {" → "}
                  {phases.find((p: any) => p.id === selectedPhaseId)?.title}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Time range */}
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

      {/* Description */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this module about?"
          rows={2}
          className={`${inputClass} resize-none`}
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
