import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/dependencies?module_id=xxx
// Fetch dependencies for a module (what it depends on)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get("module_id");

  if (!moduleId) {
    return NextResponse.json(
      { error: "module_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("module_dependencies")
    .select("*, depends_on:modules!depends_on_id(id, title, is_completed)")
    .eq("module_id", moduleId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/dependencies — add a dependency
// Body: { module_id, depends_on_id }
// Includes cycle detection: if adding this dependency would create
// a circular chain (A→B→C→A), it's rejected.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { module_id, depends_on_id } = body;

  if (!module_id || !depends_on_id) {
    return NextResponse.json(
      { error: "module_id and depends_on_id are required" },
      { status: 400 }
    );
  }

  if (module_id === depends_on_id) {
    return NextResponse.json(
      { error: "A module cannot depend on itself" },
      { status: 400 }
    );
  }

  // Cycle detection: check if depends_on_id already has a path
  // back to module_id. If so, adding this link would create a cycle.
  const hasCycle = await detectCycle(depends_on_id, module_id);
  if (hasCycle) {
    return NextResponse.json(
      { error: "Adding this dependency would create a circular chain" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("module_dependencies")
    .insert({ module_id, depends_on_id })
    .select("*, depends_on:modules!depends_on_id(id, title, is_completed)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This dependency already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * Detect if adding an edge from `fromId` to `toId` would create a cycle.
 * Walks the dependency graph from `fromId` upward — if we reach `toId`,
 * there's a cycle.
 *
 * This is a simple BFS (breadth-first search). For a personal app with
 * dozens of modules, this is perfectly fast. For thousands of modules,
 * you'd want a database-level recursive CTE query instead.
 */
async function detectCycle(fromId: string, toId: string): Promise<boolean> {
  const visited = new Set<string>();
  const queue = [fromId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === toId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const { data } = await supabase
      .from("module_dependencies")
      .select("depends_on_id")
      .eq("module_id", current);

    if (data) {
      for (const dep of data) {
        queue.push(dep.depends_on_id);
      }
    }
  }

  return false;
}
