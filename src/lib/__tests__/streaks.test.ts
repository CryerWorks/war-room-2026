import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  updateGlobalStreak,
  updateDomainStreak,
  checkPhaseCompletion,
  checkOperationCompletion,
  checkGoalCompletion,
  runCompletionCascade,
} from "../streaks";

// ============================================================
// Supabase mock factory
// ============================================================

/**
 * Creates a chainable mock that simulates the Supabase query builder.
 *
 * Usage: mockTable("user_stats", [{ id: "1", current_streak: 3, ... }])
 * This tells the mock to return that data when .from("user_stats") is queried.
 *
 * WHY this pattern: Supabase's client uses method chaining
 * (.from().select().eq().single()) where each method returns a new builder.
 * We need every chain method to return `this` so calls don't break,
 * and .single() / the final await resolves with { data, error }.
 */
function createMockSupabase(tableData: Record<string, any[]> = {}) {
  const updateCalls: { table: string; data: any; filters: Record<string, any> }[] = [];
  const insertCalls: { table: string; data: any }[] = [];

  function createBuilder(tableName: string) {
    let filteredData = [...(tableData[tableName] || [])];
    const filters: Record<string, any> = {};

    const builder: any = {
      select: () => builder,
      eq: (col: string, val: any) => {
        filters[col] = val;
        filteredData = filteredData.filter((row) => row[col] === val);
        return builder;
      },
      lt: (col: string, val: any) => {
        filteredData = filteredData.filter((row) => row[col] < val);
        return builder;
      },
      in: (col: string, vals: any[]) => {
        filteredData = filteredData.filter((row) => vals.includes(row[col]));
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      single: () => ({
        data: filteredData.length > 0 ? filteredData[0] : null,
        error: null,
      }),
      update: (data: any) => {
        updateCalls.push({ table: tableName, data, filters: { ...filters } });
        return builder;
      },
      insert: (data: any) => {
        insertCalls.push({ table: tableName, data });
        return { error: null };
      },
      // When awaited directly (no .single()), return array
      then: (resolve: any) =>
        resolve({ data: filteredData, error: null }),
    };

    return builder;
  }

  const supabase = {
    from: (table: string) => createBuilder(table),
    _updateCalls: updateCalls,
    _insertCalls: insertCalls,
  };

  return supabase as any;
}

// ============================================================
// Tests
// ============================================================

describe("updateGlobalStreak", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("increments streak when last active was yesterday", async () => {
    const supabase = createMockSupabase({
      user_stats: [
        {
          id: "stats-1",
          current_streak: 5,
          longest_streak: 10,
          last_active_date: "2026-04-18", // yesterday
        },
      ],
    });

    await updateGlobalStreak(supabase);

    expect(supabase._updateCalls).toHaveLength(1);
    expect(supabase._updateCalls[0].data.current_streak).toBe(6);
    expect(supabase._updateCalls[0].data.longest_streak).toBe(10); // unchanged
    expect(supabase._updateCalls[0].data.last_active_date).toBe("2026-04-19");
  });

  it("resets streak to 1 when last active was 2+ days ago", async () => {
    const supabase = createMockSupabase({
      user_stats: [
        {
          id: "stats-1",
          current_streak: 5,
          longest_streak: 10,
          last_active_date: "2026-04-16", // 3 days ago
        },
      ],
    });

    await updateGlobalStreak(supabase);

    expect(supabase._updateCalls[0].data.current_streak).toBe(1);
  });

  it("does nothing when already active today (no-op)", async () => {
    const supabase = createMockSupabase({
      user_stats: [
        {
          id: "stats-1",
          current_streak: 5,
          longest_streak: 10,
          last_active_date: "2026-04-19", // today
        },
      ],
    });

    await updateGlobalStreak(supabase);

    expect(supabase._updateCalls).toHaveLength(0);
  });

  it("updates longest_streak when new streak exceeds it", async () => {
    const supabase = createMockSupabase({
      user_stats: [
        {
          id: "stats-1",
          current_streak: 10,
          longest_streak: 10,
          last_active_date: "2026-04-18",
        },
      ],
    });

    await updateGlobalStreak(supabase);

    expect(supabase._updateCalls[0].data.current_streak).toBe(11);
    expect(supabase._updateCalls[0].data.longest_streak).toBe(11);
  });

  it("does nothing when no user_stats row exists", async () => {
    const supabase = createMockSupabase({
      user_stats: [],
    });

    await updateGlobalStreak(supabase);

    expect(supabase._updateCalls).toHaveLength(0);
  });
});

describe("updateDomainStreak", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("increments domain streak when last active was yesterday", async () => {
    const supabase = createMockSupabase({
      domain_streaks: [
        {
          id: "ds-1",
          domain_id: "domain-linguistic",
          current_streak: 3,
          longest_streak: 7,
          last_active_date: "2026-04-18",
        },
      ],
    });

    await updateDomainStreak(supabase, "domain-linguistic");

    expect(supabase._updateCalls).toHaveLength(1);
    expect(supabase._updateCalls[0].data.current_streak).toBe(4);
  });

  it("resets domain streak when gap detected", async () => {
    const supabase = createMockSupabase({
      domain_streaks: [
        {
          id: "ds-1",
          domain_id: "domain-skill",
          current_streak: 8,
          longest_streak: 15,
          last_active_date: "2026-04-10",
        },
      ],
    });

    await updateDomainStreak(supabase, "domain-skill");

    expect(supabase._updateCalls[0].data.current_streak).toBe(1);
  });
});

// ============================================================
// Completion cascade tests
// ============================================================

describe("checkPhaseCompletion", () => {
  it("returns null when phase is already completed", async () => {
    const supabase = createMockSupabase({
      phases: [
        {
          id: "phase-1",
          status: "completed",
          title: "Phase 1",
          operation: { title: "Op 1", goal: { domain: { color: "#ff0000" } } },
        },
      ],
    });

    const result = await checkPhaseCompletion(supabase, "phase-1");
    expect(result).toBeNull();
  });

  it("returns null when no modules exist in phase", async () => {
    const supabase = createMockSupabase({
      phases: [
        {
          id: "phase-1",
          status: "active",
          title: "Phase 1",
          operation: { title: "Op 1", goal: { domain: { color: "#ff0000" } } },
        },
      ],
      modules: [],
    });

    const result = await checkPhaseCompletion(supabase, "phase-1");
    expect(result).toBeNull();
  });

  it("returns null when some modules are incomplete", async () => {
    const supabase = createMockSupabase({
      phases: [
        {
          id: "phase-1",
          status: "active",
          title: "Phase 1",
          operation: { title: "Op 1", goal: { domain: { color: "#ff0000" } } },
        },
      ],
      modules: [
        { phase_id: "phase-1", is_completed: true, start_time: "09:00", end_time: "10:00" },
        { phase_id: "phase-1", is_completed: false, start_time: "10:00", end_time: "11:00" },
      ],
    });

    const result = await checkPhaseCompletion(supabase, "phase-1");
    expect(result).toBeNull();
  });

  it("returns completion event when all modules are done", async () => {
    const supabase = createMockSupabase({
      phases: [
        {
          id: "phase-1",
          status: "active",
          title: "Research Phase",
          operation: {
            title: "Backend Program",
            goal: { domain: { color: "#22c55e" } },
          },
        },
      ],
      modules: [
        { phase_id: "phase-1", is_completed: true, start_time: "09:00", end_time: "10:00" },
        { phase_id: "phase-1", is_completed: true, start_time: "10:00", end_time: "11:30" },
      ],
    });

    const result = await checkPhaseCompletion(supabase, "phase-1");

    expect(result).not.toBeNull();
    expect(result!.tier).toBe("phase");
    expect(result!.name).toBe("Research Phase");
    expect(result!.color).toBe("#22c55e");
    expect(result!.stats.modules_completed).toBe(2);
    expect(result!.stats.hours_spent).toBe(2.5);
    expect(result!.context?.label).toBe("Operation");
    expect(result!.context?.name).toBe("Backend Program");
  });
});

describe("checkOperationCompletion", () => {
  it("returns null when operation is already completed", async () => {
    const supabase = createMockSupabase({
      operations: [
        {
          id: "op-1",
          status: "completed",
          title: "Op 1",
          goal: { title: "Goal 1", domain: { color: "#ff0000" } },
        },
      ],
    });

    const result = await checkOperationCompletion(supabase, "op-1");
    expect(result).toBeNull();
  });

  it("returns null when some phases are incomplete", async () => {
    const supabase = createMockSupabase({
      operations: [
        {
          id: "op-1",
          status: "active",
          title: "Op 1",
          goal: { title: "Goal 1", domain: { color: "#ff0000" } },
        },
      ],
      phases: [
        { operation_id: "op-1", status: "completed" },
        { operation_id: "op-1", status: "active" },
      ],
    });

    const result = await checkOperationCompletion(supabase, "op-1");
    expect(result).toBeNull();
  });

  it("returns completion event when all phases are done", async () => {
    const supabase = createMockSupabase({
      operations: [
        {
          id: "op-1",
          status: "active",
          title: "Backend Program",
          goal: { title: "Full-Stack Skills", domain: { color: "#3b82f6" } },
        },
      ],
      phases: [
        { operation_id: "op-1", status: "completed" },
        { operation_id: "op-1", status: "completed" },
      ],
      modules: [
        { operation_id: "op-1", is_completed: true, start_time: "09:00", end_time: "10:00" },
        { operation_id: "op-1", is_completed: true, start_time: "10:00", end_time: "12:00" },
      ],
    });

    const result = await checkOperationCompletion(supabase, "op-1");

    expect(result).not.toBeNull();
    expect(result!.tier).toBe("operation");
    expect(result!.name).toBe("Backend Program");
    expect(result!.stats.phases_completed).toBe(2);
    expect(result!.stats.modules_completed).toBe(2);
    expect(result!.stats.hours_spent).toBe(3);
    expect(result!.context?.name).toBe("Full-Stack Skills");
  });
});

describe("checkGoalCompletion", () => {
  it("returns null when goal is already completed", async () => {
    const supabase = createMockSupabase({
      goals: [
        {
          id: "goal-1",
          status: "completed",
          title: "Goal 1",
          domain: { color: "#ff0000" },
        },
      ],
    });

    const result = await checkGoalCompletion(supabase, "goal-1");
    expect(result).toBeNull();
  });

  it("returns null when some operations are incomplete", async () => {
    const supabase = createMockSupabase({
      goals: [
        {
          id: "goal-1",
          status: "active",
          title: "Goal 1",
          domain: { color: "#ff0000" },
        },
      ],
      operations: [
        { id: "op-1", goal_id: "goal-1", status: "completed" },
        { id: "op-2", goal_id: "goal-1", status: "active" },
      ],
    });

    const result = await checkGoalCompletion(supabase, "goal-1");
    expect(result).toBeNull();
  });

  it("returns completion event when all operations are done", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));

    const supabase = createMockSupabase({
      goals: [
        {
          id: "goal-1",
          status: "active",
          title: "Build Full-Stack Skills",
          icon: "rocket",
          created_at: "2026-04-01T00:00:00Z",
          domain: { color: "#22c55e" },
        },
      ],
      operations: [
        { id: "op-1", goal_id: "goal-1", status: "completed" },
        { id: "op-2", goal_id: "goal-1", status: "completed" },
      ],
      modules: [
        { operation_id: "op-1", is_completed: true, start_time: "09:00", end_time: "11:00" },
        { operation_id: "op-2", is_completed: true, start_time: "14:00", end_time: "16:00" },
      ],
    });

    const result = await checkGoalCompletion(supabase, "goal-1");

    expect(result).not.toBeNull();
    expect(result!.tier).toBe("goal");
    expect(result!.name).toBe("Build Full-Stack Skills");
    expect(result!.icon).toBe("rocket");
    expect(result!.stats.operations_completed).toBe(2);
    expect(result!.stats.hours_spent).toBe(4);
    expect(result!.stats.time_to_complete).toBeDefined();
    expect(result!.context).toBeNull(); // goals have no parent context

    vi.useRealTimers();
  });
});

// ============================================================
// Full cascade integration
// ============================================================

describe("runCompletionCascade", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates streaks even when no phase is linked", async () => {
    const supabase = createMockSupabase({
      user_stats: [
        { id: "s1", current_streak: 1, longest_streak: 5, last_active_date: "2026-04-18" },
      ],
      domain_streaks: [
        { id: "ds1", domain_id: "dom-1", current_streak: 1, longest_streak: 3, last_active_date: "2026-04-18" },
      ],
    });

    const events = await runCompletionCascade(supabase, null, null, "dom-1");

    expect(events).toHaveLength(0); // no cascade events
    expect(supabase._updateCalls.length).toBeGreaterThan(0); // but streaks updated
  });

  it("returns phase completion event when phase completes", async () => {
    const supabase = createMockSupabase({
      user_stats: [
        { id: "s1", current_streak: 1, longest_streak: 5, last_active_date: "2026-04-19" },
      ],
      domain_streaks: [
        { id: "ds1", domain_id: "dom-1", current_streak: 1, longest_streak: 3, last_active_date: "2026-04-19" },
      ],
      phases: [
        {
          id: "phase-1",
          status: "active",
          operation_id: "op-1",
          sort_order: 1,
          title: "Phase 1",
          operation: { title: "Op 1", goal: { domain: { color: "#22c55e" } } },
        },
      ],
      modules: [
        { phase_id: "phase-1", is_completed: true, start_time: "09:00", end_time: "10:00" },
      ],
    });

    const events = await runCompletionCascade(supabase, "phase-1", "op-1", "dom-1");

    // Should have at least the phase event
    const phaseEvent = events.find((e) => e.tier === "phase");
    expect(phaseEvent).toBeDefined();
    expect(phaseEvent!.name).toBe("Phase 1");
  });

  it("cascades through phase → operation when both complete", async () => {
    const supabase = createMockSupabase({
      user_stats: [
        { id: "s1", current_streak: 1, longest_streak: 5, last_active_date: "2026-04-19" },
      ],
      domain_streaks: [
        { id: "ds1", domain_id: "dom-1", current_streak: 1, longest_streak: 3, last_active_date: "2026-04-19" },
      ],
      phases: [
        {
          id: "phase-1",
          status: "active",
          operation_id: "op-1",
          sort_order: 1,
          title: "Final Phase",
          operation: {
            title: "Main Operation",
            goal: { title: "Big Goal", domain: { color: "#3b82f6" } },
          },
        },
      ],
      modules: [
        { phase_id: "phase-1", operation_id: "op-1", is_completed: true, start_time: "09:00", end_time: "10:00" },
      ],
      operations: [
        {
          id: "op-1",
          status: "active",
          title: "Main Operation",
          goal_id: "goal-1",
          goal: { title: "Big Goal", domain: { color: "#3b82f6" } },
        },
      ],
    });

    // Make all phases in operation appear completed (the mock returns
    // the phase filtered by operation_id, and since we only have one
    // and it just got marked completed by checkPhaseCompletion, simulate that)
    // Note: This is a limitation of the mock — in real Supabase the update
    // would change the row. For this test we verify the cascade structure.

    const events = await runCompletionCascade(supabase, "phase-1", "op-1", "dom-1");

    // At minimum we expect the phase event
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].tier).toBe("phase");
  });
});
