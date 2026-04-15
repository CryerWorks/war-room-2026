import ProgressBar from "@/components/ui/ProgressBar";
import type { DomainProgress } from "@/types";

interface DomainCardProps {
  progress: DomainProgress;
}

export default function DomainCard({ progress }: DomainCardProps) {
  const { domain, total_modules, completed_modules, completion_percentage } =
    progress;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: domain.color }}
        />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {domain.name}
        </h3>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        {domain.description}
      </p>

      <ProgressBar
        label={`${completed_modules} / ${total_modules} modules`}
        percentage={completion_percentage}
        color={domain.color}
      />
    </div>
  );
}
