import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/auth";

// POST /api/operations/:id/restore — undo a soft delete.
// Restores the operation and any children that were cascade-deleted
// at the same timestamp.
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

  // Restore the operation
  const { error } = await supabase
    .from("operations")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("deleted_at", deleted_at);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Restore cascade-deleted phases (same timestamp)
  const { data: phases } = await supabase
    .from("phases")
    .select("id")
    .eq("operation_id", id)
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

  // Restore modules linked directly to this operation
  await supabase
    .from("modules")
    .update({ deleted_at: null })
    .eq("operation_id", id)
    .eq("deleted_at", deleted_at);

  return NextResponse.json({ restored: true });
}
