// Domains index page — shows all three domains as clickable cards.
// Each card links to the domain detail page where goals/operations are managed.
// Fetches streak data and module stats to show at-a-glance progress.

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProgressStats from "@/components/ui/ProgressStats";
import StreakBadge from "@/components/ui/StreakBadge";
import { sumModuleHours } from "@/lib/hours";
import type { Domain } from "@/types";

export const dynamic = "force-dynamic";

async function getDomainsData() {
  const [domainsResult, modulesResult, streaksResult, goalsResult, opsResult] =
    await Promise.all([
      supabase.from("domains").select("*").order("name"),
      supabase.from("modules").select("domain_id, is_completed, start_time, end_time"),
      supabase.from("domain_streaks").select("*"),
      supabase.from("goals").select("id, domain_id, status"),
      supabase.from("operations").select("id, domain_id, status"),
    ]);

  return {
    domains: domainsResult.data || [],
    modules: modulesResult.data || [],
    streaks: streaksResult.data || [],
    goals: goalsResult.data || [],
    operations: opsResult.data || [],
  };
}

export default async function DomainsPage() {
  const { domains, modules, streaks, goals, operations } = await getDomainsData();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Domains</h2>
        <p className="mt-1 text-zinc-400">
          Your three areas of development for 2026.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {domains.map((domain: Domain) => {
          const domainModules = modules.filter(
            (m) => m.domain_id === domain.id
          );
          const completed = domainModules.filter((m) => m.is_completed).length;
          const total = domainModules.length;
          const hours = sumModuleHours(domainModules);

          const domainGoals = goals.filter(
            (g) => g.domain_id === domain.id
          );
          const activeGoals = domainGoals.filter(
            (g) => g.status === "active"
          ).length;
          const completedGoals = domainGoals.filter(
            (g) => g.status === "completed"
          ).length;

          const activeOps = operations.filter(
            (o) => o.domain_id === domain.id && o.status === "active"
          ).length;

          const streak = streaks.find(
            (s) => s.domain_id === domain.id
          );

          return (
            <Link
              key={domain.id}
              href={`/domains/${domain.slug}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-600 transition-all"
            >
              {/* Domain header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: domain.color }}
                  />
                  <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-white transition-colors">
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

              {/* Progress */}
              <ProgressStats
                completed={completed}
                total={total}
                hours={hours}
                label="modules"
                color={domain.color}
              />

              {/* Quick stats */}
              <div className="mt-3 flex gap-3 text-xs font-mono text-zinc-500">
                <span>{activeGoals} goals</span>
                <span>{activeOps} ops</span>
                {completedGoals > 0 && (
                  <span className="text-emerald-600">
                    {completedGoals} achieved
                  </span>
                )}
              </div>

              {/* "View" indicator */}
              <div className="mt-4 text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                View domain →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
