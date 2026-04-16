// HoursDisplay — monospaced hours readout in the Division tactical style.
// Shows a clock-like icon next to formatted hours.
// Uses font-mono for that data-readout aesthetic.

import { formatHours } from "@/lib/hours";

interface HoursDisplayProps {
  hours: number;
  label?: string;
}

export default function HoursDisplay({ hours, label }: HoursDisplayProps) {
  return (
    <div className="flex items-center gap-1.5 text-zinc-400">
      {/* Clock icon */}
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span className="font-mono text-sm">
        {formatHours(hours)}
      </span>
      {label && (
        <span className="text-xs text-zinc-500">{label}</span>
      )}
    </div>
  );
}
