// ProgressBar — tactical variant.
// Thin, precise lines. Monospaced percentage. Domain-colored fill.
// Sizes: sm (1px line), md (2px), lg (4px with glow effect).

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
    sm: "h-[2px]",
    md: "h-1",
    lg: "h-1.5",
  }[size];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-zinc-300">
          {label}
        </span>
        <span className="text-sm font-mono font-medium text-zinc-400">
          {Math.round(clamped)}%
        </span>
      </div>
      <div
        className={`w-full ${heightClass} bg-zinc-800 rounded-full overflow-hidden`}
      >
        <div
          className={`${heightClass} rounded-full transition-all duration-700 ease-out`}
          style={{
            width: `${clamped}%`,
            backgroundColor: color,
            boxShadow: size === "lg" ? `0 0 8px ${color}40` : undefined,
          }}
        />
      </div>
    </div>
  );
}
