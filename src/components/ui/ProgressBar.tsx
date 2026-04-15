interface ProgressBarProps {
  label: string;
  percentage: number;
  color?: string;
  size?: "sm" | "md" | "lg";
}

export default function ProgressBar({
  label,
  percentage,
  color = "#6366f1",
  size = "md",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  const heightClass = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }[size];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {Math.round(clamped)}%
        </span>
      </div>
      <div
        className={`w-full ${heightClass} bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden`}
      >
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
