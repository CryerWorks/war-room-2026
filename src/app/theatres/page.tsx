// Theatres page — strategic overview of cross-domain supergroups.
// Each theatre shows its goals across domains with progress stats.
// You can create theatres and assign goals to them.

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ScrambleText from "@/components/ui/ScrambleText";
import PageReveal from "@/components/ui/PageReveal";
import TacticalIcon from "@/components/ui/TacticalIcon";
import IconPicker from "@/components/ui/IconPicker";
import ProgressStats from "@/components/ui/ProgressStats";
import StatusBadge from "@/components/ui/StatusBadge";

interface TheatreGoal {
  id: string;
  title: string;
  icon: string | null;
  status: string;
  domain: { name: string; slug: string; color: string } | null;
  operations: { id: string; status: string }[];
}

interface Theatre {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  color: string;
  status: string;
  goals: TheatreGoal[];
}

export default function TheatresPage() {
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedTheatre, setExpandedTheatre] = useState<string | null>(null);

  const fetchTheatres = useCallback(async () => {
    try {
      const res = await fetch("/api/theatres");
      if (res.ok) setTheatres(await res.json());
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheatres();
  }, [fetchTheatres]);

  async function createTheatre(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/theatres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim(),
          icon: newIcon.trim() || null,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewDescription("");
        setNewIcon("");
        setShowForm(false);
        fetchTheatres();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTheatre(id: string) {
    await fetch(`/api/theatres/${id}`, { method: "DELETE" });
    fetchTheatres();
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">
          <ScrambleText text="Theatres of Operation" delay={100} speed={30} />
        </h2>
        <p className="mt-1 text-zinc-400">
          <ScrambleText text="Cross-domain strategic objectives." delay={400} speed={20} />
        </p>
      </div>

      <PageReveal delay={1000}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="scan-loader w-32" />
          </div>
        ) : (
          <div className="space-y-4">
            {theatres.length === 0 && !showForm && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                <p className="text-zinc-500 mb-1">
                  <span className="redacted">██████ ████████</span>
                </p>
                <p className="text-xs font-mono text-zinc-500">
                  No theatres established. Create one to group goals across domains.
                </p>
              </div>
            )}

            {/* Theatre cards */}
            {theatres.map((theatre) => {
              const isExpanded = expandedTheatre === theatre.id;
              const activeGoals = theatre.goals.filter((g) => g.status === "active");
              const completedGoals = theatre.goals.filter((g) => g.status === "completed");
              const totalOps = theatre.goals.reduce((sum, g) => sum + g.operations.length, 0);
              const completedOps = theatre.goals.reduce(
                (sum, g) => sum + g.operations.filter((o) => o.status === "completed").length,
                0
              );
              // Unique domains in this theatre
              const domainColors = [...new Set(theatre.goals.map((g) => g.domain?.color).filter(Boolean))];

              return (
                <div
                  key={theatre.id}
                  className="rounded-xl border bg-zinc-900/50 overflow-hidden"
                  style={{ borderColor: `${theatre.color}30` }}
                >
                  {/* Theatre header */}
                  <button
                    onClick={() => setExpandedTheatre(isExpanded ? null : theatre.id)}
                    className="w-full px-5 py-4 text-left hover:bg-zinc-800/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {theatre.icon && <TacticalIcon name={theatre.icon} size={24} className="text-zinc-300" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-zinc-100">{theatre.name}</h3>
                            <StatusBadge status={theatre.status} />
                          </div>
                          {theatre.description && (
                            <p className="text-sm text-zinc-500 mt-0.5">{theatre.description}</p>
                          )}
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Stats row */}
                    <div className="mt-3 flex items-center gap-4 text-xs font-mono text-zinc-500">
                      <span>{activeGoals.length} active goals</span>
                      <span>{completedOps}/{totalOps} operations</span>
                      {completedGoals.length > 0 && (
                        <span className="text-emerald-600">{completedGoals.length} achieved</span>
                      )}
                      {/* Domain color dots — shows which domains are involved */}
                      <div className="flex gap-1 ml-auto">
                        {domainColors.map((color, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color as string }}
                          />
                        ))}
                      </div>
                    </div>
                  </button>

                  {/* Expanded: goals in this theatre */}
                  <div className={`accordion ${isExpanded ? "open" : ""}`}>
                    <div>
                      <div className="border-t border-zinc-800 divide-y divide-zinc-800/50 stagger-in">
                        {theatre.goals.map((goal) => (
                          <Link
                            key={goal.id}
                            href={`/domains/${goal.domain?.slug}`}
                            className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/20 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: goal.domain?.color || "#6366f1" }}
                              />
                              {goal.icon && <TacticalIcon name={goal.icon} size={16} className="text-zinc-400" />}
                              <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                                {goal.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-zinc-600">
                                {goal.domain?.name}
                              </span>
                              <StatusBadge status={goal.status} />
                            </div>
                          </Link>
                        ))}

                        {theatre.goals.length === 0 && (
                          <div className="px-5 py-4 text-center text-xs text-zinc-500">
                            No goals assigned. Edit a goal and set its theatre to this one.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Create theatre form */}
            {showForm ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <form onSubmit={createTheatre} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
                        Icon
                      </label>
                      <IconPicker value={newIcon} onChange={setNewIcon} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
                        Theatre Name
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Become a Professional Developer"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="What is the strategic objective?"
                      rows={2}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting || !newName.trim()}
                      className="flex-1 py-2 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? "Creating..." : "Establish Theatre"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors"
              >
                + Establish New Theatre
              </button>
            )}
          </div>
        )}
      </PageReveal>
    </div>
  );
}
