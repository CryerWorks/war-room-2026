// StreakBadge — displays the current streak with a lightning bolt motif.
// Visually escalates: low streaks are subtle, high streaks pulse with energy.
// The threshold for "high" is 7 days — a full week of consistency.

interface StreakBadgeProps {
  current: number;
  longest: number;
  label?: string;
  color?: string;
}

export default function StreakBadge({
  current,
  longest,
  label,
  color,
}: StreakBadgeProps) {
  const isHot = current >= 7;
  const accentColor = color || (isHot ? "#f59e0b" : "#71717a");

  return (
    <div className="flex items-center gap-2">
      {/* Lightning bolt */}
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-lg ${
          isHot ? "animate-pulse" : ""
        }`}
        style={{ backgroundColor: `${accentColor}20` }}
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 24 24"
          style={{ color: accentColor }}
        >
          <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className="font-mono text-sm font-medium text-zinc-200">
          {current} {current === 1 ? "day" : "days"}
        </span>
        <span className="text-xs text-zinc-500">
          {label || `Best: ${longest}`}
        </span>
      </div>
    </div>
  );
}
