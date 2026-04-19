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
    .select("*, domain:domains(*), operations(*, phases(*, modules:modules(id, is_completed, start_time, end_time, title, scheduled_date, completed_at)))")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

// DELETE /api/goals/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;

  const { error } = await supabase.from("goals").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
