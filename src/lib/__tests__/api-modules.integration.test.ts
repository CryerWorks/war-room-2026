/**
 * Integration tests for /api/modules/[id] route handler.
 *
 * WHAT MAKES THESE "INTEGRATION" TESTS?
 * Unit tests check a single function (calculateModuleHours).
 * These tests check the full route handler pipeline:
 *   Request → auth check → body parsing → DB operations → cascade trigger → Response
 *
 * We mock the auth layer and database, but the route handler logic,
 * request parsing, and response formatting are all real.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockSupabase, mockRequest } from "./helpers/mock-supabase";

// Mock the auth module BEFORE importing the route handler.
// vi.mock() is hoisted to the top of the file by Vitest — this is
// how you intercept module imports in the test environment.
const mockSupabase = createMockSupabase();

vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: vi.fn(),
  unauthorized: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
}));

// Mock the completion cascade — for integration tests at the route level,
// we verify the cascade is CALLED correctly, not that it runs correctly
// (that's what the unit tests in streaks.test.ts are for).
vi.mock("@/lib/streaks", () => ({
  runCompletionCascade: vi.fn().mockResolvedValue([]),
}));

// Now import the route handlers and mocked modules
import { PATCH, DELETE } from "@/app/api/modules/[id]/route";
import { getAuthenticatedUser } from "@/lib/auth";
import { runCompletionCascade } from "@/lib/streaks";

describe("PATCH /api/modules/[id]", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-19T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: null,
      supabase: mockSupabase,
      error: "Unauthorized",
    });

    const request = mockRequest("/api/modules/mod-1", {
      method: "PATCH",
      body: { title: "Updated" },
    });

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "mod-1" }),
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("updates a module and returns the updated data", async () => {
    const supabase = createMockSupabase({
      modules: [
        {
          id: "mod-1",
          title: "Updated Title",
          is_completed: false,
          domain: { id: "dom-1", name: "Skill", color: "#22c55e" },
          notes: [],
        },
      ],
    });

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase,
      error: null,
    });

    const request = mockRequest("/api/modules/mod-1", {
      method: "PATCH",
      body: { title: "Updated Title" },
    });

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "mod-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.title).toBe("Updated Title");
    expect(json.completions).toEqual([]); // no cascade since not completed
  });

  it("triggers completion cascade when module is marked complete", async () => {
    const supabase = createMockSupabase({
      modules: [
        {
          id: "mod-1",
          title: "Learn SQL",
          is_completed: true,
          phase_id: "phase-1",
          operation_id: "op-1",
          domain_id: "dom-1",
          domain: { id: "dom-1", name: "Skill", color: "#22c55e" },
          notes: [],
        },
      ],
    });

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase,
      error: null,
    });

    // Make cascade return a phase completion event
    vi.mocked(runCompletionCascade).mockResolvedValue([
      {
        tier: "phase",
        name: "SQL Basics",
        color: "#22c55e",
        stats: { modules_completed: 3, hours_spent: 4.5 },
        context: { label: "Operation", name: "Backend Program" },
      },
    ]);

    const request = mockRequest("/api/modules/mod-1", {
      method: "PATCH",
      body: { is_completed: true },
    });

    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: "mod-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();

    // Verify cascade was called with the right IDs
    expect(runCompletionCascade).toHaveBeenCalledWith(
      supabase,
      "phase-1",    // phase_id from the module
      "op-1",       // operation_id from the module
      "dom-1"       // domain_id from the module
    );

    // Verify completion events are included in response
    expect(json.completions).toHaveLength(1);
    expect(json.completions[0].tier).toBe("phase");
    expect(json.completions[0].name).toBe("SQL Basics");
  });

  it("does NOT trigger cascade when module is uncompleted", async () => {
    const supabase = createMockSupabase({
      modules: [
        {
          id: "mod-1",
          title: "Learn SQL",
          is_completed: false,
          domain: { id: "dom-1" },
          notes: [],
        },
      ],
    });

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase,
      error: null,
    });

    const request = mockRequest("/api/modules/mod-1", {
      method: "PATCH",
      body: { is_completed: false },
    });

    await PATCH(request as any, {
      params: Promise.resolve({ id: "mod-1" }),
    });

    // Cascade should NOT have been called
    expect(runCompletionCascade).not.toHaveBeenCalled();
  });

  it("sets completed_at timestamp when completing a module", async () => {
    const supabase = createMockSupabase({
      modules: [
        {
          id: "mod-1",
          is_completed: true,
          domain: { id: "dom-1" },
          notes: [],
        },
      ],
    });

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase,
      error: null,
    });

    const request = mockRequest("/api/modules/mod-1", {
      method: "PATCH",
      body: { is_completed: true },
    });

    await PATCH(request as any, {
      params: Promise.resolve({ id: "mod-1" }),
    });

    // Check that the update call included completed_at
    const updateCall = supabase._updateCalls.find(
      (c: any) => c.table === "modules"
    );
    expect(updateCall).toBeDefined();
    expect(updateCall.data.completed_at).toBe("2026-04-19T12:00:00.000Z");
  });

  it("clears completed_at when uncompleting a module", async () => {
    const supabase = createMockSupabase({
      modules: [
        {
          id: "mod-1",
          is_completed: false,
          domain: { id: "dom-1" },
          notes: [],
        },
      ],
    });

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase,
      error: null,
    });

    const request = mockRequest("/api/modules/mod-1", {
      method: "PATCH",
      body: { is_completed: false },
    });

    await PATCH(request as any, {
      params: Promise.resolve({ id: "mod-1" }),
    });

    const updateCall = supabase._updateCalls.find(
      (c: any) => c.table === "modules"
    );
    expect(updateCall.data.completed_at).toBeNull();
  });
});

describe("DELETE /api/modules/[id]", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: null,
      supabase: mockSupabase,
      error: "Unauthorized",
    });

    const request = mockRequest("/api/modules/mod-1", { method: "DELETE" });
    const response = await DELETE(request as any, {
      params: Promise.resolve({ id: "mod-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("deletes a module and returns success", async () => {
    const supabase = createMockSupabase();

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: "test-user" } as any,
      supabase,
      error: null,
    });

    const request = mockRequest("/api/modules/mod-1", { method: "DELETE" });
    const response = await DELETE(request as any, {
      params: Promise.resolve({ id: "mod-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.deleted).toBe(true);
  });
});
