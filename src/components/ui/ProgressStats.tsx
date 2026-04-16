// ProgressStats — the glanceable data readout used at every level of the hierarchy.
// Shows: "X/Y completed (Z%) • Nh Mm logged"
// This is the core "at a glance" component — the most important UI piece for quick scanning.
// Uses monospaced font for numbers to keep columns aligned.

import { formatHours } from "@/lib/hours";

interface ProgressStatsProps {
  completed: number;
  total: number;
  hours?: number;
  label?: string; // "modules", "phases", "operations"
  color?: string; // domain accent color for the progress bar
}

export default function ProgressStats({
  completed,
  total,
  hours,
  label = "completed",
  color = "#3b82f6",
}: ProgressStatsProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="space-y-2">
      {/* Text stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          <span className="font-mono text-zinc-200">{completed}</span>
          <span className="text-zinc-600">/</span>
          <span className="font-mono text-zinc-200">{total}</span>
          {" "}{label}
        </span>
        <div className="flex items-center gap-3">
          {hours !== undefined && hours > 0 && (
            <span className="font-mono text-zinc-400 text-xs">
              {formatHours(hours)}
            </span>
          )}
          <span className="font-mono text-zinc-300">{percentage}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
