/**
 * Integration tests for POST /api/goals/merge
 *
 * This endpoint merges one goal into another — it's a destructive
 * operation that moves operations, reassigns modules, then deletes
 * the source goal. Good candidate for integration tests because
 * the ORDER of database operations matters (reassign before delete).
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { createMockSupabase, mockRequest } from "./helpers/mock-supabase";

vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: vi.fn(),
  unauthorized: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
}));

import { POST } from "@/app/api/goals/merge/route";
import { getAuthenticatedUser } from "@/lib/auth";

// Stable test UUIDs — valid format required by Zod validation
const GOAL_1 = "00000000-0000-4000-8000-000000000001";
const GOAL_2 = "00000000-0000-4000-8000-000000000002";
const DOM_1 = "00000000-0000-4000-8000-0000000000d1";
const DOM_2 = "00000000-0000-4000-8000-0000000000d2";
const DOM_LING = "00000000-0000-4000-8000-0000000000d3";
const DOM_SKILL = "00000000-0000-4000-8000-0000000000d4";
const OP_1 = "00000000-0000-4000-8000-000000000011";
const OP_2 = "00000000-0000-4000-8000-000000000012";
const MOD_1 = "00000000-0000-4000-8000-000000000021";
const NONEXISTENT = "00000000-0000-4000-8000-ffffffffffff";

describe("POST /api/goals/merge", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: null,
      supabase: createMockSupabase(),
      error: "Unauthorized",
    });

    const request = mockRequest("/api/goals/merge", {
      method: "POST",
      body: { source_id: GOAL_1, target_id: GOAL_2 },
    });

    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  it("returns 400 when source_id is missing", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase: createMockSupabase(),
      error: null,
    });

    const request = mockRequest("/api/goals/merge", {
      method: "POST",
      body: { target_id: GOAL_2 },
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 when target_id is missing", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase: createMockSupabase(),
      error: null,
    });

    const request = mockRequest("/api/goals/merge", {
      method: "POST",
      body: { source_id: GOAL_1 },
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it("returns 400 when merging a goal into itself", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase: createMockSupabase(),
      error: null,
    });

    const request = mockRequest("/api/goals/merge", {
      method: "POST",
      body: { source_id: GOAL_1, target_id: GOAL_1 },
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const json = await response.json();
    // Zod refinement error: "Cannot merge a goal into itself"
    expect(json.details._form).toBeDefined();
    expect(json.details._form[0]).toContain("itself");
  });

  it("returns 404 when source goal does not exist", async () => {
    const supabase = createMockSupabase({
      goals: [
        { id: GOAL_2, title: "Target Goal", domain_id: DOM_1 },
      ],
    });

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase,
      error: null,
    });

    const request = mockRequest("/api/goals/merge", {
      method: "POST",
      body: { source_id: NONEXISTENT, target_id: GOAL_2 },
    });

    const response = await POST(request as any);
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toContain("not found");
  });

  it("merges goals and returns summary", async () => {
    const supabase = createMockSupabase({
      goals: [
        { id: GOAL_1, title: "Source Goal", domain_id: DOM_1 },
        { id: GOAL_2, title: "Target Goal", domain_id: DOM_2 },
      ],
      operations: [
        { id: OP_1, goal_id: GOAL_1 },
        { id: OP_2, goal_id: GOAL_1 },
      ],
      modules: [
        { id: MOD_1, goal_id: GOAL_1 },
      ],
    });

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase,
      error: null,
    });

    const request = mockRequest("/api/goals/merge", {
      method: "POST",
      body: { source_id: GOAL_1, target_id: GOAL_2 },
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.summary.source_title).toBe("Source Goal");
    expect(json.summary.target_title).toBe("Target Goal");
    expect(json.summary.operations_moved).toBe(2);
    expect(json.summary.modules_moved).toBe(1);
  });

  it("reassigns operations to target goal's domain", async () => {
    const supabase = createMockSupabase({
      goals: [
        { id: GOAL_1, title: "Source", domain_id: DOM_LING },
        { id: GOAL_2, title: "Target", domain_id: DOM_SKILL },
      ],
      operations: [
        { id: OP_1, goal_id: GOAL_1 },
      ],
      modules: [],
    });

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase,
      error: null,
    });

    const request = mockRequest("/api/goals/merge", {
      method: "POST",
      body: { source_id: GOAL_1, target_id: GOAL_2 },
    });

    await POST(request as any);

    // Verify operations were reassigned to target's domain
    const opUpdate = supabase._updateCalls.find(
      (c: any) => c.table === "operations"
    );
    expect(opUpdate).toBeDefined();
    expect(opUpdate.data.goal_id).toBe(GOAL_2);
    expect(opUpdate.data.domain_id).toBe(DOM_SKILL);
  });

  it("deletes source goal after reassignment", async () => {
    const supabase = createMockSupabase({
      goals: [
        { id: GOAL_1, title: "Source", domain_id: DOM_1 },
        { id: GOAL_2, title: "Target", domain_id: DOM_1 },
      ],
      operations: [],
      modules: [],
    });

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase,
      error: null,
    });

    const request = mockRequest("/api/goals/merge", {
      method: "POST",
      body: { source_id: GOAL_1, target_id: GOAL_2 },
    });

    await POST(request as any);

    // Verify source goal was deleted
    expect(supabase._deleteCalls).toHaveLength(1);
    expect(supabase._deleteCalls[0].table).toBe("goals");
    expect(supabase._deleteCalls[0].filters.id).toBe(GOAL_1);
  });
});
