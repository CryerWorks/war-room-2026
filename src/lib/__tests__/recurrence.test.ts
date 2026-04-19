import { describe, it, expect } from "vitest";
import { getMatchingDates } from "../recurrence";

// ---------- getMatchingDates ----------

describe("getMatchingDates", () => {
  describe("daily pattern", () => {
    it("returns every day in range", () => {
      const start = new Date("2026-04-13"); // Monday
      const end = new Date("2026-04-19");   // Sunday
      const dates = getMatchingDates(start, end, "daily", []);
      expect(dates).toHaveLength(7);
      expect(dates[0]).toBe("2026-04-13");
      expect(dates[6]).toBe("2026-04-19");
    });

    it("returns single day when start equals end", () => {
      const date = new Date("2026-04-19");
      const dates = getMatchingDates(date, date, "daily", []);
      expect(dates).toEqual(["2026-04-19"]);
    });

    it("returns empty when start is after end", () => {
      const start = new Date("2026-04-20");
      const end = new Date("2026-04-19");
      const dates = getMatchingDates(start, end, "daily", []);
      expect(dates).toHaveLength(0);
    });
  });

  describe("weekly pattern", () => {
    it("returns only the same day of week as start date", () => {
      const start = new Date("2026-04-13"); // Monday
      const end = new Date("2026-05-10");   // ~4 weeks
      const dates = getMatchingDates(start, end, "weekly", []);
      expect(dates).toHaveLength(4);
      // All should be Mondays
      dates.forEach((d) => {
        expect(new Date(d).getDay()).toBe(1); // Monday
      });
    });

    it("returns single occurrence for one-week range starting on match day", () => {
      const start = new Date("2026-04-15"); // Wednesday
      const end = new Date("2026-04-21");   // Tuesday (less than 1 week later)
      const dates = getMatchingDates(start, end, "weekly", []);
      expect(dates).toEqual(["2026-04-15"]);
    });
  });

  describe("specific_days pattern", () => {
    it("returns only specified days of week", () => {
      const start = new Date("2026-04-13"); // Monday
      const end = new Date("2026-04-19");   // Sunday
      // Mon=1, Wed=3, Fri=5
      const dates = getMatchingDates(start, end, "specific_days", [1, 3, 5]);
      expect(dates).toHaveLength(3);
      expect(dates).toEqual(["2026-04-13", "2026-04-15", "2026-04-17"]);
    });

    it("handles weekend-only schedule", () => {
      const start = new Date("2026-04-13"); // Monday
      const end = new Date("2026-04-19");   // Sunday
      // Sat=6, Sun=0
      const dates = getMatchingDates(start, end, "specific_days", [0, 6]);
      expect(dates).toHaveLength(2);
      expect(dates).toEqual(["2026-04-18", "2026-04-19"]);
    });

    it("returns empty when no days match", () => {
      const start = new Date("2026-04-13"); // Monday
      const end = new Date("2026-04-14");   // Tuesday
      // Only Friday
      const dates = getMatchingDates(start, end, "specific_days", [5]);
      expect(dates).toHaveLength(0);
    });

    it("returns empty with empty days_of_week array", () => {
      const start = new Date("2026-04-13");
      const end = new Date("2026-04-19");
      const dates = getMatchingDates(start, end, "specific_days", []);
      expect(dates).toHaveLength(0);
    });
  });

  describe("date formatting", () => {
    it("pads single-digit months", () => {
      const start = new Date("2026-01-05");
      const dates = getMatchingDates(start, start, "daily", []);
      expect(dates[0]).toBe("2026-01-05");
    });

    it("pads single-digit days", () => {
      const start = new Date("2026-12-03");
      const dates = getMatchingDates(start, start, "daily", []);
      expect(dates[0]).toBe("2026-12-03");
    });
  });

  describe("edge cases", () => {
    it("handles month boundary", () => {
      const start = new Date("2026-04-28");
      const end = new Date("2026-05-03");
      const dates = getMatchingDates(start, end, "daily", []);
      expect(dates).toHaveLength(6);
      expect(dates).toContain("2026-04-30");
      expect(dates).toContain("2026-05-01");
    });

    it("handles leap year February", () => {
      const start = new Date("2028-02-27"); // 2028 is a leap year
      const end = new Date("2028-03-01");
      const dates = getMatchingDates(start, end, "daily", []);
      expect(dates).toHaveLength(4);
      expect(dates).toContain("2028-02-29");
    });

    it("generates 28 days for a 4-week daily window", () => {
      const start = new Date("2026-04-13");
      const end = new Date("2026-05-10");
      const dates = getMatchingDates(start, end, "daily", []);
      expect(dates).toHaveLength(28);
    });
  });
});
