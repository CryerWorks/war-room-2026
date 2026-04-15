import ProgressBar from "@/components/ui/ProgressBar";
import DomainCard from "@/components/dashboard/DomainCard";
import type { DomainProgress, AggregateProgress } from "@/types";

// Placeholder data until we wire up Supabase
const PLACEHOLDER_PROGRESS: AggregateProgress = {
  domains: [
    {
      domain: {
        id: "1",
        name: "Linguistic",
        slug: "linguistic",
        description: "Language learning and communication goals",
        color: "#6366f1",
        created_at: "",
      },
      total_modules: 0,
      completed_modules: 0,
      completion_percentage: 0,
    },
    {
      domain: {
        id: "2",
        name: "Skill",
        slug: "skill",
        description: "Technical and programming skill development",
        color: "#f59e0b",
        created_at: "",
      },
      total_modules: 0,
      completed_modules: 0,
      completion_percentage: 0,
    },
    {
      domain: {
        id: "3",
        name: "Physical",
        slug: "physical",
        description: "Physical fitness and health goals",
        color: "#10b981",
        created_at: "",
      },
      total_modules: 0,
      completed_modules: 0,
      completion_percentage: 0,
    },
  ],
  total_modules: 0,
  completed_modules: 0,
  completion_percentage: 0,
};

export default function Dashboard() {
  const progress = PLACEHOLDER_PROGRESS;

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
          percentage={progress.completion_percentage}
          color="#3b82f6"
          size="lg"
        />
      </div>

      {/* Per-domain cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {progress.domains.map((dp) => (
          <DomainCard key={dp.domain.id} progress={dp} />
        ))}
      </div>

      {/* Quick stats placeholder */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Completed Today", value: "0" },
          { label: "Upcoming This Week", value: "0" },
          { label: "Total Modules", value: "0" },
          { label: "Current Streak", value: "0 days" },
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
