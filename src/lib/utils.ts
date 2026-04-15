/**
 * Format a date string (YYYY-MM-DD) into a human-readable form.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a time string (HH:MM) into 12-hour format.
 */
export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calculate completion percentage, avoiding division by zero.
 */
export function completionPercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
