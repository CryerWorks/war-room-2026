import { describe, it, expect } from "vitest";
import { calculateModuleHours, sumModuleHours, formatHours, timeBetween } from "../hours";

// ---------- calculateModuleHours ----------

describe("calculateModuleHours", () => {
  it("calculates hours for a simple time range", () => {
    expect(calculateModuleHours("09:00", "10:00")).toBe(1);
  });

  it("calculates fractional hours", () => {
    expect(calculateModuleHours("09:00", "09:30")).toBe(0.5);
  });

  it("returns 0 when start is null", () => {
    expect(calculateModuleHours(null, "10:00")).toBe(0);
  });

  it("returns 0 when end is null", () => {
    expect(calculateModuleHours("09:00", null)).toBe(0);
  });

  it("returns 0 when both are null", () => {
    expect(calculateModuleHours(null, null)).toBe(0);
  });

  it("returns 0 when end equals start", () => {
    expect(calculateModuleHours("09:00", "09:00")).toBe(0);
  });

  it("returns 0 when end is before start", () => {
    expect(calculateModuleHours("14:00", "09:00")).toBe(0);
  });

  it("handles multi-hour ranges", () => {
    expect(calculateModuleHours("08:00", "17:00")).toBe(9);
  });

  it("handles minutes correctly", () => {
    expect(calculateModuleHours("09:15", "10:45")).toBe(1.5);
  });
});

// ---------- sumModuleHours ----------

describe("sumModuleHours", () => {
  it("sums hours for completed modules only", () => {
    const modules = [
      { start_time: "09:00", end_time: "10:00", is_completed: true },
      { start_time: "10:00", end_time: "11:00", is_completed: false },
      { start_time: "11:00", end_time: "12:00", is_completed: true },
    ];
    expect(sumModuleHours(modules)).toBe(2);
  });

  it("returns 0 for empty array", () => {
    expect(sumModuleHours([])).toBe(0);
  });

  it("returns 0 when no modules are completed", () => {
    const modules = [
      { start_time: "09:00", end_time: "10:00", is_completed: false },
    ];
    expect(sumModuleHours(modules)).toBe(0);
  });

  it("handles modules with null times", () => {
    const modules = [
      { start_time: null, end_time: null, is_completed: true },
      { start_time: "09:00", end_time: "10:00", is_completed: true },
    ];
    expect(sumModuleHours(modules)).toBe(1);
  });
});

// ---------- formatHours ----------

describe("formatHours", () => {
  it("formats 0 hours", () => {
    expect(formatHours(0)).toBe("0h");
  });

  it("formats whole hours under 10", () => {
    expect(formatHours(3)).toBe("3h");
  });

  it("formats hours and minutes under 10", () => {
    expect(formatHours(1.5)).toBe("1h 30m");
  });

  it("formats minutes only when less than 1 hour", () => {
    expect(formatHours(0.5)).toBe("30m");
  });

  it("formats 10+ hours with decimal", () => {
    expect(formatHours(42.5)).toBe("42.5 hrs");
  });

  it("formats exactly 10 hours with decimal", () => {
    expect(formatHours(10)).toBe("10.0 hrs");
  });

  it("formats small fractional minutes", () => {
    expect(formatHours(0.25)).toBe("15m");
  });
});

// ---------- timeBetween ----------

describe("timeBetween", () => {
  it("returns 'today' for same-day dates", () => {
    expect(timeBetween("2026-04-19T00:00:00", "2026-04-19T12:00:00")).toBe("today");
  });

  it("returns '1 day' for one day apart", () => {
    expect(timeBetween("2026-04-18T00:00:00", "2026-04-19T00:00:00")).toBe("1 day");
  });

  it("returns days for under 2 weeks", () => {
    expect(timeBetween("2026-04-10T00:00:00", "2026-04-19T00:00:00")).toBe("9 days");
  });

  it("returns weeks for 2-8 weeks", () => {
    expect(timeBetween("2026-03-19T00:00:00", "2026-04-19T00:00:00")).toBe("4 weeks");
  });

  it("returns months for 60+ days", () => {
    expect(timeBetween("2026-01-01T00:00:00", "2026-04-19T00:00:00")).toBe("3 months");
  });
});
