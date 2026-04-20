import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// POST /api/goals/:id/restore — undo a soft delete.
// Restores the goal and any children that were cascade-deleted
// at the same timestamp (shared deleted_at value).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const { deleted_at } = body;

  if (!deleted_at) {
    return NextResponse.json(
      { error: "deleted_at timestamp is required" },
      { status: 400 }
    );
  }

  // Restore the goal
  const { error } = await supabase
    .from("goals")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("deleted_at", deleted_at);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Restore cascade-deleted operations (same timestamp)
  const { data: ops } = await supabase
    .from("operations")
    .select("id")
    .eq("goal_id", id)
    .eq("deleted_at", deleted_at);

  if (ops && ops.length > 0) {
    const opIds = ops.map((o) => o.id);

    await supabase
      .from("operations")
      .update({ deleted_at: null })
      .in("id", opIds);

    // Restore cascade-deleted phases
    const { data: phases } = await supabase
      .from("phases")
      .select("id")
      .in("operation_id", opIds)
      .eq("deleted_at", deleted_at);

    if (phases && phases.length > 0) {
      const phaseIds = phases.map((p) => p.id);

      await supabase
        .from("phases")
        .update({ deleted_at: null })
        .in("id", phaseIds);

      // Restore cascade-deleted modules under those phases
      await supabase
        .from("modules")
        .update({ deleted_at: null })
        .in("phase_id", phaseIds)
        .eq("deleted_at", deleted_at);
    }

    // Restore modules linked directly to operations
    await supabase
      .from("modules")
      .update({ deleted_at: null })
      .in("operation_id", opIds)
      .eq("deleted_at", deleted_at);
  }

  // Restore modules linked directly to this goal
  await supabase
    .from("modules")
    .update({ deleted_at: null })
    .eq("goal_id", id)
    .eq("deleted_at", deleted_at);

  return NextResponse.json({ restored: true });
}
