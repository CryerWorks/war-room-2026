// Dashboard — the main landing page.
// Shows: global streak, overall progress, per-domain cards, active operations, completed objectives.
// This is a server component — all data is fetched server-side for fast initial load.

import Link from "next/link";
import ProgressStats from "@/components/ui/ProgressStats";
import StreakBadge from "@/components/ui/StreakBadge";
import CornerBrackets from "@/components/ui/CornerBrackets";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TodayFocus from "@/components/dashboard/TodayFocus";
import SituationReport from "@/components/dashboard/SituationReport";
import FocusSection from "@/components/ui/FocusSection";
import { supabase } from "@/lib/supabase";
import { completionPercentage, todayISO } from "@/lib/utils";
import { sumModuleHours, formatHours } from "@/lib/hours";
import { generateRecurringModules } from "@/lib/recurrence";
import type { Domain } from "@/types";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  // Generate any pending recurring modules before fetching data.
  // This runs server-side on every dashboard load. It's idempotent —
  // calling it multiple times won't create duplicates because the
  // generator checks existing modules before inserting.
  await generateRecurringModules();
  const today = todayISO();

  const [
    domainsResult,
    modulesResult,
    todayModulesResult,
    globalStreakResult,
    domainStreaksResult,
    goalsResult,
    operationsResult,
  ] = await Promise.all([
    supabase.from("domains").select("*").order("name"),
    // Lean query for aggregate stats (all modules, minimal fields)
    supabase.from("modules").select("domain_id, is_completed, scheduled_date, start_time, end_time"),
    // Rich query for today's modules only (full detail for the focus view)
    supabase
      .from("modules")
      .select("*, domain:domains(*), operation:operations(title, goal:goals(title, icon)), phase:phases(title)")
      .eq("scheduled_date", today)
      .order("start_time", { nullsFirst: false }),
    supabase.from("user_stats").select("*").single(),
    supabase.from("domain_streaks").select("*, domain:domains(name, slug, color)"),
    supabase.from("goals").select("*, domain:domains(name, slug, color)").eq("status", "completed"),
    supabase.from("operations").select("*, goal:goals(title, icon, theatre_id, theatre:theatres(id, name, icon, color)), domain:domains(slug, color), phases(id, title, status, sort_order, modules:modules(id, title, is_completed))").eq("status", "active"),
  ]);

  return {
    domains: domainsResult.data || [],
    modules: modulesResult.data || [],
    todayModules: todayModulesResult.data || [],
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
    todayModules,
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
    <DashboardShell streak={globalStreak} todayModules={todayModules}>
      {/* ============================================================
          LAYER 1: ACTION — What do I need to do right now?
          This is the most prominent section. Full width, no competition.
          ============================================================ */}
      <FocusSection>
        <TodayFocus modules={todayModules} domains={domains} />
      </FocusSection>

      {/* ============================================================
          LAYER 2: GLANCE — How am I doing? Quick stats strip.
          Compact horizontal row — four numbers at a glance.
          Replaces the old large progress bar + separate stats grid
          with a single dense strip. The overall % is just one of four
          metrics now, not a hero element.
          ============================================================ */}
      <FocusSection>
        <CornerBrackets color="#3b82f6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div>
                <p className="text-2xl font-bold font-mono text-zinc-100">
                  {overallPercentage}%
                </p>
                <p className="text-xs text-zinc-500">Completion</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-zinc-100">
                  {completedToday}
                </p>
                <p className="text-xs text-zinc-500">Done Today</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-zinc-100">
                  {formatHours(totalHours)}
                </p>
                <p className="text-xs text-zinc-500">Total Hours</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-zinc-100">
                  {upcomingThisWeek}
                </p>
                <p className="text-xs text-zinc-500">This Week</p>
              </div>
            </div>
            {/* Thin overall progress bar beneath the stats */}
            <div className="mt-3 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${overallPercentage}%`, backgroundColor: "#3b82f6" }}
              />
            </div>
          </div>
        </CornerBrackets>
      </FocusSection>

      {/* ============================================================
          LAYER 3: SCAN — Domain breakdown. Where am I across areas?
          Three cards side by side, each clickable to drill in.
          ============================================================ */}
      <FocusSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-600 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: domain.color }}
                    />
                    <h3 className="text-base font-semibold text-zinc-100">
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

                <ProgressStats
                  completed={completed}
                  total={total}
                  hours={hours}
                  label="modules"
                  color={domain.color}
                />

                <div className="mt-2.5 text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                  View domain →
                </div>
              </Link>
            );
          })}
        </div>
      </FocusSection>

      {/* ============================================================
          LAYER 4: SITUATION REPORT — Strategic overview.
          Goals first (the objectives), operations nested underneath.
          Correct hierarchy: Goal > Operation, not the reverse.
          Includes completed objectives in a separate collapsible.
          ============================================================ */}
      <FocusSection>
        <SituationReport
          activeOperations={activeOperations}
          completedGoals={completedGoals}
        />
      </FocusSection>
    </DashboardShell>
  );
}
