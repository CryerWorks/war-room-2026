import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { mergeGoalsSchema } from "@/lib/schemas";
import { validate } from "@/lib/validation";

// POST /api/goals/merge — merge one goal into another.
//
// Body: { source_id, target_id }
//
// This endpoint:
// 1. Moves all operations from source to target
// 2. Reassigns any modules directly linked to source goal
// 3. Deletes the source goal
// 4. Returns a summary of what was moved
//
// WHY THIS ORDER MATTERS:
// We must reassign operations BEFORE deleting the source goal,
// otherwise cascade delete would destroy the operations.
// The explicit reassignment preserves all data.

export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const body = await request.json();
  const parsed = validate(mergeGoalsSchema, body);
  if (!parsed.success) return parsed.response;

  const { source_id, target_id } = parsed.data;

  // Verify both goals exist
  const { data: source } = await supabase
    .from("goals")
    .select("id, title, domain_id")
    .eq("id", source_id)
    .single();

  const { data: target } = await supabase
    .from("goals")
    .select("id, title, domain_id")
    .eq("id", target_id)
    .single();

  if (!source || !target) {
    return NextResponse.json(
      { error: "One or both goals not found" },
      { status: 404 }
    );
  }

  // Step 1: Move all operations from source to target
  const { data: movedOps } = await supabase
    .from("operations")
    .update({
      goal_id: target_id,
      domain_id: target.domain_id, // align domain with target
      updated_at: new Date().toISOString(),
    })
    .eq("goal_id", source_id)
    .select("id");

  // Step 2: Reassign any modules directly linked to source goal
  const { data: movedModules } = await supabase
    .from("modules")
    .update({
      goal_id: target_id,
      updated_at: new Date().toISOString(),
    })
    .eq("goal_id", source_id)
    .select("id");

  // Step 3: Delete the source goal (now empty)
  const { error: deleteError } = await supabase
    .from("goals")
    .delete()
    .eq("id", source_id);

  if (deleteError) {
    return NextResponse.json(
      { error: `Failed to delete source goal: ${deleteError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    summary: {
      source_title: source.title,
      target_title: target.title,
      operations_moved: movedOps?.length || 0,
      modules_moved: movedModules?.length || 0,
    },
  });
}
