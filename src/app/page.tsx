// Dashboard — the main landing page.
// Shows: global streak, overall progress, per-domain cards, active operations, completed objectives.
// This is a server component — all data is fetched server-side for fast initial load.

import Link from "next/link";
import ProgressBar from "@/components/ui/ProgressBar";
import ProgressStats from "@/components/ui/ProgressStats";
import StreakBadge from "@/components/ui/StreakBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import HoursDisplay from "@/components/ui/HoursDisplay";
import { supabase } from "@/lib/supabase";
import { completionPercentage, todayISO } from "@/lib/utils";
import { sumModuleHours, formatHours } from "@/lib/hours";
import type { Domain } from "@/types";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    domainsResult,
    modulesResult,
    globalStreakResult,
    domainStreaksResult,
    goalsResult,
    operationsResult,
  ] = await Promise.all([
    supabase.from("domains").select("*").order("name"),
    supabase.from("modules").select("domain_id, is_completed, scheduled_date, start_time, end_time"),
    supabase.from("user_stats").select("*").single(),
    supabase.from("domain_streaks").select("*, domain:domains(name, slug, color)"),
    supabase.from("goals").select("*").eq("status", "completed"),
    supabase.from("operations").select("*, goal:goals(title, icon), phases(id)").eq("status", "active"),
  ]);

  return {
    domains: domainsResult.data || [],
    modules: modulesResult.data || [],
    globalStreak: globalStreakResult.data,
    domainStreaks: domainStreaksResult.data || [],
    completedGoals: goalsResult.data || [],
    activeOperations: operationsResult.data || [],
  };
}

export default async function Dashboard() {
  const {
    domains,
    modules,
    globalStreak,
    domainStreaks,
    completedGoals,
    activeOperations,
  } = await getDashboardData();

  const today = todayISO();
  const totalAll = modules.length;
  const completedAll = modules.filter((m) => m.is_completed).length;
  const overallPercentage = completionPercentage(completedAll, totalAll);
  const totalHours = sumModuleHours(modules);

  const completedToday = modules.filter(
    (m) => m.is_completed && m.scheduled_date === today
  ).length;

  const upcomingThisWeek = modules.filter((m) => {
    const d = new Date(m.scheduled_date);
    const now = new Date(today);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return !m.is_completed && d >= now && d <= weekFromNow;
  }).length;

  return (
    <div className="space-y-8">
      {/* Header with streak */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Dashboard</h2>
          <p className="mt-1 text-zinc-400">Your 2026 progress at a glance.</p>
        </div>
        {globalStreak && (
          <StreakBadge
            current={globalStreak.current_streak}
            longest={globalStreak.longest_streak}
            label={`Best: ${globalStreak.longest_streak} days`}
          />
        )}
      </div>

      {/* Overall progress */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <ProgressBar
          label="Overall Progress"
          percentage={overallPercentage}
          color="#3b82f6"
          size="lg"
        />
        <div className="mt-2 flex gap-4 text-xs font-mono text-zinc-500">
          <span>{completedAll}/{totalAll} modules</span>
          <span>{formatHours(totalHours)} logged</span>
        </div>
      </div>

      {/* Per-domain cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {domains.map((domain: Domain) => {
          const domainModules = modules.filter((m) => m.domain_id === domain.id);
          const completed = domainModules.filter((m) => m.is_completed).length;
          const total = domainModules.length;
          const hours = sumModuleHours(domainModules);
          const streak = domainStreaks.find((s) => s.domain_id === domain.id);

          return (
            <Link
              key={domain.id}
              href={`/domains/${domain.slug}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-600 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: domain.color }}
                  />
                  <h3 className="text-lg font-semibold text-zinc-100">
                    {domain.name}
                  </h3>
                </div>
                {streak && streak.current_streak > 0 && (
                  <StreakBadge
                    current={streak.current_streak}
                    longest={streak.longest_streak}
                    color={domain.color}
                  />
                )}
              </div>

              <p className="text-sm text-zinc-500 mb-4">{domain.description}</p>

              <ProgressStats
                completed={completed}
                total={total}
                hours={hours}
                label="modules"
                color={domain.color}
              />

              <div className="mt-3 text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                View domain →
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Completed Today", value: String(completedToday) },
          { label: "Upcoming This Week", value: String(upcomingThisWeek) },
          { label: "Total Hours", value: formatHours(totalHours) },
          { label: "Completion Rate", value: `${overallPercentage}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center"
          >
            <p className="text-2xl font-bold font-mono text-zinc-100">
              {stat.value}
            </p>
            <p className="text-sm text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Active operations */}
      {activeOperations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Active Operations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOperations.slice(0, 4).map((op: any) => (
              <div
                key={op.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-zinc-200 text-sm">
                    {op.title}
                  </h4>
                  <StatusBadge status={op.status} />
                </div>
                {op.goal && (
                  <p className="text-xs text-zinc-500">
                    {op.goal.icon && `${op.goal.icon} `}{op.goal.title}
                  </p>
                )}
                <p className="text-xs font-mono text-zinc-600 mt-1">
                  {op.phases?.length || 0} phases
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed objectives */}
      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Completed Objectives
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal: any) => (
              <div
                key={goal.id}
                className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4"
              >
                <div className="flex items-center gap-2">
                  {goal.icon && <span className="text-xl">{goal.icon}</span>}
                  <h4 className="font-medium text-emerald-300">{goal.title}</h4>
                </div>
                {goal.completed_at && (
                  <p className="text-xs text-emerald-700 mt-1 font-mono">
                    Achieved {new Date(goal.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
