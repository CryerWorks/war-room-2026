// OperationCard — compact summary of an operation within a goal card.
// Shows a mini stepper timeline and progress stats.
// Links to the full operation detail page for deeper management.

import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import StepperTimeline from "@/components/ui/StepperTimeline";
import ProgressStats from "@/components/ui/ProgressStats";
import { sumModuleHours } from "@/lib/hours";

interface OperationCardProps {
  operation: {
    id: string;
    title: string;
    description: string;
    status: string;
    phases: Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      sort_order: number;
      modules: Array<{
        id: string;
        is_completed: boolean;
        start_time: string | null;
        end_time: string | null;
      }>;
    }>;
  };
  color: string;
  domainSlug: string;
}

export default function OperationCard({ operation, color, domainSlug }: OperationCardProps) {
  const allModules = operation.phases.flatMap((p) => p.modules);
  const totalModules = allModules.length;
  const completedModules = allModules.filter((m) => m.is_completed).length;
  const totalHours = sumModuleHours(allModules);

  // Sort phases by sort_order for the timeline
  const sortedPhases = [...operation.phases].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const timelineSteps = sortedPhases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    description: phase.description,
    status: phase.status as "pending" | "active" | "completed",
    stats: {
      completed: phase.modules.filter((m) => m.is_completed).length,
      total: phase.modules.length,
    },
  }));

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/domains/${domainSlug}/operations/${operation.id}`}
            className="font-medium text-zinc-200 text-sm hover:text-white transition-colors"
          >
            {operation.title} →
          </Link>
          <StatusBadge status={operation.status} />
        </div>
      </div>

      {operation.description && (
        <p className="text-xs text-zinc-500 mb-3">{operation.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <ProgressStats
          completed={completedModules}
          total={totalModules}
          hours={totalHours}
          label="modules"
          color={color}
        />
      </div>

      {/* Mini phase timeline */}
      {timelineSteps.length > 0 && (
        <div className="ml-1">
          <StepperTimeline steps={timelineSteps} color={color} />
        </div>
      )}

      {timelineSteps.length === 0 && (
        <p className="text-xs text-zinc-600 italic">
          No phases defined yet
        </p>
      )}
    </div>
  );
}
