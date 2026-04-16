// Domain detail page — the command center for a single domain.
// Shows all goals (active and completed) with their operations and phases.
// This is a client component because it has tabs, forms, and interactive goal cards.

"use client";

import { useState, useEffect, useCallback, use } from "react";
import GoalCard from "@/components/goals/GoalCard";
import GoalForm from "@/components/goals/GoalForm";
import StreakBadge from "@/components/ui/StreakBadge";
import ProgressStats from "@/components/ui/ProgressStats";
import { sumModuleHours } from "@/lib/hours";
import type { Domain, DomainStreak } from "@/types";

interface DomainDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function DomainDetailPage({ params }: DomainDetailPageProps) {
  const { slug } = use(params);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [streak, setStreak] = useState<DomainStreak | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch domain info
      const domainRes = await fetch("/api/domains");
      if (domainRes.ok) {
        const domainData = await domainRes.json();
        const found = domainData.domains.find(
          (d: { domain: Domain }) => d.domain.slug === slug
        );
        if (found) setDomain(found.domain);
      }

      // Fetch goals for this domain (we need the domain ID first)
      if (!domain) {
        // On first load, get domain from the domains list
        const domainRes2 = await fetch("/api/domains");
        const domainData2 = await domainRes2.json();
        const found2 = domainData2.domains.find(
          (d: { domain: Domain }) => d.domain.slug === slug
        );
        if (found2) {
          setDomain(found2.domain);
          const goalsRes = await fetch(
            `/api/goals?domain_id=${found2.domain.id}`
          );
          if (goalsRes.ok) setGoals(await goalsRes.json());
        }
      } else {
        const goalsRes = await fetch(`/api/goals?domain_id=${domain.id}`);
        if (goalsRes.ok) setGoals(await goalsRes.json());
      }

      // Fetch streak
      const streakRes = await fetch("/api/streaks");
      if (streakRes.ok) {
        const streakData = await streakRes.json();
        const domainStreak = streakData.domains.find(
          (d: any) => d.domain?.slug === slug
        );
        if (domainStreak) setStreak(domainStreak);
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [slug, domain]);

  useEffect(() => {
    fetchData();
  }, [slug]);

  // Re-fetch when domain changes (after first load sets it)
  const refreshData = useCallback(async () => {
    if (!domain) return;
    const goalsRes = await fetch(`/api/goals?domain_id=${domain.id}`);
    if (goalsRes.ok) setGoals(await goalsRes.json());
  }, [domain]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="text-center py-20 text-zinc-500">
        Domain not found.
      </div>
    );
  }

  // Filter goals by tab
  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const displayedGoals = activeTab === "active" ? activeGoals : completedGoals;

  // Aggregate stats across all active goals
  const allActiveModules = activeGoals.flatMap((g: any) =>
    (g.operations || []).flatMap((op: any) =>
      (op.phases || []).flatMap((p: any) => p.modules || [])
    )
  );
  const totalModules = allActiveModules.length;
  const completedModules = allActiveModules.filter(
    (m: any) => m.is_completed
  ).length;
  const totalHours = sumModuleHours(allActiveModules);

  return (
    <div className="space-y-6">
      {/* Domain header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: domain.color }}
            />
            <h2 className="text-2xl font-bold text-zinc-100">{domain.name}</h2>
          </div>
          <p className="text-zinc-400">{domain.description}</p>
        </div>

        {streak && (
          <StreakBadge
            current={streak.current_streak}
            longest={streak.longest_streak}
            color={domain.color}
          />
        )}
      </div>

      {/* Overall domain progress */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <ProgressStats
          completed={completedModules}
          total={totalModules}
          hours={totalHours}
          label="modules across active goals"
          color={domain.color}
        />
        <div className="mt-2 flex gap-4 text-xs text-zinc-500 font-mono">
          <span>{activeGoals.length} active goals</span>
          <span>{completedGoals.length} completed</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-zinc-800">
        {(["active", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "text-zinc-100 border-current"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
            style={activeTab === tab ? { borderColor: domain.color } : undefined}
          >
            {tab} {tab === "active" ? `(${activeGoals.length})` : `(${completedGoals.length})`}
          </button>
        ))}
      </div>

      {/* Goal list */}
      <div className="space-y-4">
        {displayedGoals.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-500">
              {activeTab === "active"
                ? "No active goals. Create one to start tracking progress."
                : "No completed objectives yet. Keep pushing!"}
            </p>
          </div>
        ) : (
          displayedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              domainSlug={slug}
              goal={goal}
              color={domain.color}
              onUpdated={refreshData}
            />
          ))
        )}
      </div>

      {/* Add goal button/form (only on active tab) */}
      {activeTab === "active" && (
        <div>
          {showGoalForm ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <GoalForm
                domainId={domain.id}
                onCreated={() => {
                  setShowGoalForm(false);
                  refreshData();
                }}
                onCancel={() => setShowGoalForm(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowGoalForm(true)}
              className="w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            >
              + New Goal
            </button>
          )}
        </div>
      )}
    </div>
  );
}
