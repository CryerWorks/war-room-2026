/**
 * Calculate duration in hours from start/end time strings.
 * Returns 0 if either is null or end <= start.
 */
export function calculateModuleHours(
  startTime: string | null,
  endTime: string | null
): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) return 0;
  return (endMinutes - startMinutes) / 60;
}

/**
 * Sum hours for an array of completed modules with time slots.
 */
export function sumModuleHours(
  modules: { start_time: string | null; end_time: string | null; is_completed: boolean }[]
): number {
  return modules
    .filter((m) => m.is_completed)
    .reduce((sum, m) => sum + calculateModuleHours(m.start_time, m.end_time), 0);
}

/**
 * Format hours into a human-readable string.
 * < 10 hours: "1h 30m"
 * >= 10 hours: "42.5 hrs"
 */
export function formatHours(hours: number): string {
  if (hours === 0) return "0h";
  if (hours < 10) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }
  return `${hours.toFixed(1)} hrs`;
}

/**
 * Calculate a human-readable duration between two dates.
 * e.g. "12 days", "3 weeks", "2 months"
 */
export function timeBetween(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "today";
  if (diffDays === 1) return "1 day";
  if (diffDays < 14) return `${diffDays} days`;
  if (diffDays < 60) return `${Math.floor(diffDays / 7)} weeks`;
  return `${Math.floor(diffDays / 30)} months`;
}
