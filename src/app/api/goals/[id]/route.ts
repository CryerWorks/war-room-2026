import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { updateGoalSchema } from "@/lib/schemas";
import { validate } from "@/lib/validation";

// GET /api/goals/:id — single goal with full operation/phase/module tree
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;

  const { data, error } = await supabase
    .from("goals")
    .select("*, domain:domains(*), operations(*, phases(*, modules:modules(id, is_completed, start_time, end_time, title, scheduled_date, completed_at, deleted_at)))")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out soft-deleted children from nested joins
  if (data) {
    data.operations = (data.operations || [])
      .filter((op: { deleted_at?: string | null }) => !op.deleted_at)
      .map((op: { phases?: Array<{ deleted_at?: string | null; modules?: Array<{ deleted_at?: string | null }> }> }) => ({
        ...op,
        phases: (op.phases || [])
          .filter((p) => !p.deleted_at)
          .map((p) => ({
            ...p,
            modules: (p.modules || []).filter((m) => !m.deleted_at),
          })),
      }));
  }

  return NextResponse.json(data);
}

// PATCH /api/goals/:id — update a goal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const parsed = validate(updateGoalSchema, body);
  if (!parsed.success) return parsed.response;

  const updates: Record<string, unknown> = { ...parsed.data };

  // If manually completing a goal, set completed_at
  if (updates.status === "completed" && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", id)
    .select("*, domain:domains(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/goals/:id — soft delete goal + cascade to children
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;
  const deleted_at = new Date().toISOString();

  // Soft delete the goal itself
  const { error } = await supabase
    .from("goals")
    .update({ deleted_at })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Cascade: soft delete non-deleted operations under this goal
  const { data: ops } = await supabase
    .from("operations")
    .select("id")
    .eq("goal_id", id)
    .is("deleted_at", null);

  if (ops && ops.length > 0) {
    const opIds = ops.map((o) => o.id);

    await supabase
      .from("operations")
      .update({ deleted_at })
      .in("id", opIds);

    // Cascade: soft delete non-deleted phases under those operations
    const { data: phases } = await supabase
      .from("phases")
      .select("id")
      .in("operation_id", opIds)
      .is("deleted_at", null);

    if (phases && phases.length > 0) {
      const phaseIds = phases.map((p) => p.id);

      await supabase
        .from("phases")
        .update({ deleted_at })
        .in("id", phaseIds);

      // Cascade: soft delete non-deleted modules under those phases
      await supabase
        .from("modules")
        .update({ deleted_at })
        .in("phase_id", phaseIds)
        .is("deleted_at", null);
    }

    // Also soft delete modules linked directly to operations (no phase)
    await supabase
      .from("modules")
      .update({ deleted_at })
      .in("operation_id", opIds)
      .is("deleted_at", null);
  }

  // Also soft delete modules linked directly to this goal (no operation)
  await supabase
    .from("modules")
    .update({ deleted_at })
    .eq("goal_id", id)
    .is("deleted_at", null);

  return NextResponse.json({ deleted: true, deleted_at });
}
