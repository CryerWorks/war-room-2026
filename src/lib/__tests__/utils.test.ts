import { describe, it, expect, vi, afterEach } from "vitest";
import { formatDate, formatTime, todayISO, completionPercentage } from "../utils";

// ---------- formatDate ----------

describe("formatDate", () => {
  it("formats a standard date", () => {
    const result = formatDate("2026-04-19");
    // Should produce something like "Sat, Apr 19"
    expect(result).toContain("Apr");
    expect(result).toContain("19");
  });

  it("handles single-digit day", () => {
    const result = formatDate("2026-01-05");
    expect(result).toContain("Jan");
    expect(result).toContain("5");
  });

  it("handles year boundary", () => {
    const result = formatDate("2025-12-31");
    expect(result).toContain("Dec");
    expect(result).toContain("31");
  });
});

// ---------- formatTime ----------

describe("formatTime", () => {
  it("formats morning time", () => {
    expect(formatTime("09:30")).toBe("9:30 AM");
  });

  it("formats afternoon time", () => {
    expect(formatTime("14:00")).toBe("2:00 PM");
  });

  it("formats midnight as 12 AM", () => {
    expect(formatTime("00:00")).toBe("12:00 AM");
  });

  it("formats noon as 12 PM", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });

  it("formats 12:59 PM", () => {
    expect(formatTime("12:59")).toBe("12:59 PM");
  });

  it("formats single-digit minutes with leading zero", () => {
    expect(formatTime("08:05")).toBe("8:05 AM");
  });
});

// ---------- todayISO ----------

describe("todayISO", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns YYYY-MM-DD format", () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the correct date for a known time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T15:00:00Z"));
    // Note: todayISO uses toISOString which is UTC-based
    expect(todayISO()).toBe("2026-07-04");
    vi.useRealTimers();
  });
});

// ---------- completionPercentage ----------

describe("completionPercentage", () => {
  it("returns 0 when total is 0 (avoids division by zero)", () => {
    expect(completionPercentage(0, 0)).toBe(0);
  });

  it("returns 0 when nothing completed", () => {
    expect(completionPercentage(0, 10)).toBe(0);
  });

  it("returns 100 when all completed", () => {
    expect(completionPercentage(5, 5)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(completionPercentage(1, 3)).toBe(33);
    expect(completionPercentage(2, 3)).toBe(67);
  });

  it("handles large numbers", () => {
    expect(completionPercentage(999, 1000)).toBe(100);
  });
});
