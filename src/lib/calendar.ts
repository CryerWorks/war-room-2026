// Calendar utility functions

/**
 * Get all days in a given month, padded with days from
 * the previous/next month to fill complete weeks.
 * Returns an array of Date objects (always 42 = 6 weeks).
 */
export function getCalendarDays(year: number, month: number): Date[] {
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Day of week the month starts on (0=Sun, 1=Mon, ...)
  const startDow = firstDay.getDay();

  // Start from the Sunday before (or on) the 1st
  const calendarStart = new Date(year, month, 1 - startDow);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(calendarStart);
    d.setDate(calendarStart.getDate() + i);
    days.push(d);
  }

  return days;
}

/**
 * Format a Date as YYYY-MM-DD (for matching with database dates).
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Month names for display.
 */
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Day-of-week headers.
 */
export const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
