import ProgressBar from "@/components/ui/ProgressBar";
import DomainCard from "@/components/dashboard/DomainCard";
import { supabase } from "@/lib/supabase";
import { completionPercentage, todayISO } from "@/lib/utils";
import type { DomainProgress } from "@/types";

export const dynamic = "force-dynamic"; // always fetch fresh data

async function getDashboardData() {
  const [domainsResult, modulesResult] = await Promise.all([
    supabase.from("domains").select("*").order("name"),
    supabase.from("modules").select("domain_id, is_completed, scheduled_date"),
  ]);

  if (domainsResult.error) throw domainsResult.error;
  if (modulesResult.error) throw modulesResult.error;

  const domains = domainsResult.data;
  const modules = modulesResult.data;
  const today = todayISO();

  // Per-domain progress
  const domainProgress: DomainProgress[] = domains.map((domain) => {
    const domainModules = modules.filter((m) => m.domain_id === domain.id);
    const total = domainModules.length;
    const completed = domainModules.filter((m) => m.is_completed).length;

    return {
      domain,
      total_modules: total,
      completed_modules: completed,
      completion_percentage: completionPercentage(completed, total),
    };
  });

  // Aggregate stats
  const totalAll = modules.length;
  const completedAll = modules.filter((m) => m.is_completed).length;
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

  return {
    domainProgress,
    totalAll,
    completedAll,
    completedToday,
    upcomingThisWeek,
  };
}

export default async function Dashboard() {
  const { domainProgress, totalAll, completedAll, completedToday, upcomingThisWeek } =
    await getDashboardData();

  const overallPercentage = completionPercentage(completedAll, totalAll);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h2>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Your 2026 progress at a glance.
        </p>
      </div>

      {/* Aggregate progress */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900">
        <ProgressBar
          label="Overall Progress"
          percentage={overallPercentage}
          color="#3b82f6"
          size="lg"
        />
      </div>

      {/* Per-domain cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {domainProgress.map((dp) => (
          <DomainCard key={dp.domain.id} progress={dp} />
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Completed Today", value: String(completedToday) },
          { label: "Upcoming This Week", value: String(upcomingThisWeek) },
          { label: "Total Modules", value: String(totalAll) },
          { label: "Completion Rate", value: `${overallPercentage}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 text-center"
          >
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stat.value}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
