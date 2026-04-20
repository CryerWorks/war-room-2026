import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";
import { updateOperationSchema } from "@/lib/schemas";
import { validate } from "@/lib/validation";

// GET /api/operations/:id — single operation with full phase/module tree
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;

  const { data, error } = await supabase
    .from("operations")
    .select("*, goal:goals(*, domain:domains(*)), phases(*, modules:modules(*, dependencies:module_dependencies!module_id(id, depends_on_id, depends_on:modules!depends_on_id(id, title, is_completed)), tags:module_tags!module_id(id, tag_id, tag:tags(*))))")
    .eq("id", id)
    .is("deleted_at", null)
    .order("sort_order", { referencedTable: "phases" })
    .single();

  if (error) {
    console.error("Operation fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out soft-deleted children from nested joins
  if (data) {
    data.phases = (data.phases || [])
      .filter((p: { deleted_at?: string | null }) => !p.deleted_at)
      .map((p: { modules?: Array<{ deleted_at?: string | null }> }) => ({
        ...p,
        modules: (p.modules || []).filter((m) => !m.deleted_at),
      }));
  }

  return NextResponse.json(data);
}

// PATCH /api/operations/:id — update an operation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const parsed = validate(updateOperationSchema, body);
  if (!parsed.success) return parsed.response;

  const updates: Record<string, unknown> = { ...parsed.data };

  if (updates.status === "completed" && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("operations")
    .update(updates)
    .eq("id", id)
    .select("*, goal:goals(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/operations/:id — soft delete operation + cascade to children
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error: authError } = await getAuthenticatedUser();
  if (authError) return unauthorized();

  const { id } = await params;
  const deleted_at = new Date().toISOString();

  // Soft delete the operation itself
  const { error } = await supabase
    .from("operations")
    .update({ deleted_at })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Cascade: soft delete non-deleted phases under this operation
  const { data: phases } = await supabase
    .from("phases")
    .select("id")
    .eq("operation_id", id)
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

  // Also soft delete modules linked directly to this operation (no phase)
  await supabase
    .from("modules")
    .update({ deleted_at })
    .eq("operation_id", id)
    .is("deleted_at", null);

  return NextResponse.json({ deleted: true, deleted_at });
}
