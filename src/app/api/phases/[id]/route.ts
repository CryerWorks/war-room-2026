import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { updatePhaseSchema } from "@/lib/schemas";
import { validate } from "@/lib/validation";

// PATCH /api/phases/:id — update a phase
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const parsed = validate(updatePhaseSchema, body);
  if (!parsed.success) return parsed.response;

  const updates: Record<string, unknown> = { ...parsed.data };

  if (updates.status === "completed" && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("phases")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/phases/:id — soft delete phase + cascade to modules
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;
  const deleted_at = new Date().toISOString();

  // Soft delete the phase itself
  const { error } = await supabase
    .from("phases")
    .update({ deleted_at })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Cascade: soft delete non-deleted modules under this phase
  await supabase
    .from("modules")
    .update({ deleted_at })
    .eq("phase_id", id)
    .is("deleted_at", null);

  return NextResponse.json({ deleted: true, deleted_at });
}
