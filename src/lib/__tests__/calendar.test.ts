import { describe, it, expect } from "vitest";
import { getCalendarDays, toDateString, MONTH_NAMES, DAY_HEADERS } from "../calendar";

// ---------- getCalendarDays ----------

describe("getCalendarDays", () => {
  it("returns exactly 42 days (6 weeks grid)", () => {
    const days = getCalendarDays(2026, 3); // April 2026
    expect(days).toHaveLength(42);
  });

  it("all entries are Date objects", () => {
    const days = getCalendarDays(2026, 0); // January 2026
    days.forEach((d) => expect(d).toBeInstanceOf(Date));
  });

  it("first day is a Sunday (start of week)", () => {
    const days = getCalendarDays(2026, 3); // April 2026
    expect(days[0].getDay()).toBe(0); // Sunday
  });

  it("includes the 1st of the month", () => {
    const days = getCalendarDays(2026, 3); // April 2026
    const dateStrings = days.map(toDateString);
    expect(dateStrings).toContain("2026-04-01");
  });

  it("includes the last day of the month", () => {
    const days = getCalendarDays(2026, 3); // April 2026 has 30 days
    const dateStrings = days.map(toDateString);
    expect(dateStrings).toContain("2026-04-30");
  });

  it("pads with previous month days when month starts mid-week", () => {
    // April 2026 starts on Wednesday (day 3), so we need 3 padding days from March
    const days = getCalendarDays(2026, 3);
    const firstDate = toDateString(days[0]);
    // Should start on the Sunday before April 1
    expect(firstDate).toBe("2026-03-29");
  });

  it("handles month starting on Sunday (no leading padding)", () => {
    // February 2026 starts on Sunday
    const days = getCalendarDays(2026, 1);
    expect(toDateString(days[0])).toBe("2026-02-01");
  });

  it("days are in sequential order", () => {
    const days = getCalendarDays(2026, 3);
    for (let i = 1; i < days.length; i++) {
      expect(days[i].getTime()).toBeGreaterThan(days[i - 1].getTime());
    }
  });
});

// ---------- toDateString ----------

describe("toDateString", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(toDateString(new Date(2026, 3, 19))).toBe("2026-04-19");
  });

  it("pads single-digit month", () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("pads single-digit day", () => {
    expect(toDateString(new Date(2026, 11, 3))).toBe("2026-12-03");
  });

  it("handles year boundary", () => {
    expect(toDateString(new Date(2025, 11, 31))).toBe("2025-12-31");
  });
});

// ---------- Constants ----------

describe("MONTH_NAMES", () => {
  it("has 12 months", () => {
    expect(MONTH_NAMES).toHaveLength(12);
  });

  it("starts with January", () => {
    expect(MONTH_NAMES[0]).toBe("January");
  });

  it("ends with December", () => {
    expect(MONTH_NAMES[11]).toBe("December");
  });
});

describe("DAY_HEADERS", () => {
  it("has 7 days", () => {
    expect(DAY_HEADERS).toHaveLength(7);
  });

  it("starts with Sun", () => {
    expect(DAY_HEADERS[0]).toBe("Sun");
  });
});
