// StatusBadge — a small colored pill showing active/completed/pending/archived status.
// Used on goal cards, operation cards, and phase indicators.
// The color mapping is intentional: green = done, blue = active, amber = pending, grey = archived.

interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wider border ${style}`}
    >
      {status}
    </span>
  );
}
